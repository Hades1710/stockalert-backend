import logging
import asyncio
from app.database import supabase
from app.services.notifications.telegram import send_telegram_alert

logger = logging.getLogger(__name__)

async def evaluate_rules_for_symbol(symbol: str, quote_data: dict):
    if "c" not in quote_data or "pc" not in quote_data:
        logger.warning(f"Invalid quote data for {symbol}: {quote_data}")
        return

    current_price = quote_data["c"]
    prev_close = quote_data["pc"]
    if prev_close == 0:
        return

    price_change_percent = ((current_price - prev_close) / prev_close) * 100

    try:
        # Fetch all active rules for this symbol
        rules_response = supabase.table("alert_rules").select("*").eq("symbol", symbol).execute()
        rules = rules_response.data
        if not rules:
            return

        import datetime
        current_minute = datetime.datetime.now().minute
        user_tiers_cache = {}

        for rule in rules:
            user_id = rule["user_id"]
            
            # Cache tier to prevent aggressive DB hits per rule
            if user_id not in user_tiers_cache:
                prof_res = supabase.table("profiles").select("tier").eq("id", user_id).execute()
                user_tiers_cache[user_id] = prof_res.data[0].get("tier", "free") if prof_res.data else "free"
            
            tier = user_tiers_cache[user_id]
            
            # Enforce Tier Polling Frequency
            if tier == "free" and current_minute % 15 != 0:
                continue
            if tier == "plus" and current_minute % 5 != 0:
                continue
            rule_id = rule["id"]
            user_id = rule["user_id"]
            rule_type = rule["rule_type"]
            threshold = rule["threshold"]

            triggered = False
            msg = ""

            if rule_type == "price_threshold":
                if abs(price_change_percent) >= threshold:
                    direction = "up" if price_change_percent > 0 else "down"
                    proposed_msg = f"{symbol} price moved {direction} by {abs(price_change_percent):.2f}% to ${current_price:.2f} (Threshold: {threshold}%)"
                    
                    can_trigger = True
                    # query the single most recent alert for this rule
                    recent_req = supabase.table("alert_log") \
                        .select("message, triggered_at") \
                        .eq("user_id", user_id) \
                        .eq("rule_id", rule_id) \
                        .order("triggered_at", desc=True) \
                        .limit(1).execute()
                    
                    if recent_req.data:
                        last_alert = recent_req.data[0]
                        last_time_str = last_alert["triggered_at"].replace("Z", "+00:00")
                        import datetime as dt
                        last_time = dt.datetime.fromisoformat(last_time_str)
                        time_since_last = (dt.datetime.now(dt.timezone.utc) - last_time).total_seconds()
                        
                        # 30 minute cooldown (1800 seconds)
                        if time_since_last < 1800:
                            can_trigger = False
                            
                            # BYPASS LOGIC: Check for Massive Movement (if current % >= last % + threshold)
                            import re
                            match = re.search(r"by ([\d\.]+)%", last_alert["message"])
                            if match:
                                prev_pct = float(match.group(1))
                                if abs(price_change_percent) >= (prev_pct + threshold):
                                    can_trigger = True
                                    logger.info(f"Hybrid Bypass Triggered! {symbol} moved from {prev_pct}% to {abs(price_change_percent):.2f}%")
                                    
                    if can_trigger:
                        triggered = True
                        msg = proposed_msg
            
            elif rule_type == "52w_high_low":
                # Fetch heavily cached fundamental metrics (only if a rule requires it!)
                from app.services.market_data import fetch_basic_metrics
                metrics = await fetch_basic_metrics(symbol)
                high_52w = metrics.get("52WeekHigh")
                low_52w = metrics.get("52WeekLow")

                if high_52w and current_price >= high_52w * (1 - (threshold / 100)):
                    triggered = True
                    msg = f"🔥 {symbol} is within {threshold}% of its 52-Week HIGH! Current: ${current_price:.2f} (52W High: ${high_52w:.2f})"
                
                elif low_52w and current_price <= low_52w * (1 + (threshold / 100)):
                    triggered = True
                    msg = f"🧊 {symbol} is within {threshold}% of its 52-Week LOW! Current: ${current_price:.2f} (52W Low: ${low_52w:.2f})"
            
            elif rule_type == "price_breakout":
                # Trigger when current price crosses the specific threshold target
                # Check cross direction relative to previous close
                if prev_close < threshold and current_price >= threshold:
                    triggered = True
                    msg = f"🎯 BREAKOUT! {symbol} crossed ABOVE ${threshold} (Current: ${current_price:.2f})"
                elif prev_close > threshold and current_price <= threshold:
                    triggered = True
                    msg = f"🎯 BREAKDOWN! {symbol} crossed BELOW ${threshold} (Current: ${current_price:.2f})"
            
            # elif rule_type == "unusual_volume":
            #     pass
            
            elif rule_type == "analyst_upgrade":
                from app.services.market_data import fetch_analyst_recommendations
                recs = await fetch_analyst_recommendations(symbol)
                
                if recs and len(recs) >= 2:
                    current = recs[0]
                    previous = recs[1]
                    
                    curr_buy = current.get("strongBuy", 0) + current.get("buy", 0)
                    prev_buy = previous.get("strongBuy", 0) + previous.get("buy", 0)
                    
                    curr_sell = current.get("strongSell", 0) + current.get("sell", 0)
                    prev_sell = previous.get("strongSell", 0) + previous.get("sell", 0)
                    
                    total_curr = curr_buy + curr_sell + current.get("hold", 0)
                    total_prev = prev_buy + prev_sell + previous.get("hold", 0)
                    
                    curr_is_buy_consensus = (curr_buy / max(total_curr, 1)) > 0.5
                    prev_is_buy_consensus = (prev_buy / max(total_prev, 1)) > 0.5
                    curr_is_sell_consensus = (curr_sell / max(total_curr, 1)) > 0.5
                    prev_is_sell_consensus = (prev_sell / max(total_prev, 1)) > 0.5

                    if curr_buy > prev_buy:
                        diff = curr_buy - prev_buy
                        triggered = True
                        msg = f"📈 Analyst Upgrade Detected! {symbol} received {diff} new 'Buy/Strong Buy' ratings. Total Buys: {curr_buy} out of {total_curr} analysts."
                    elif curr_sell > prev_sell:
                        diff = curr_sell - prev_sell
                        triggered = True
                        msg = f"📉 Warning: The institutional consensus on {symbol} is shifting bearish. {diff} analysts have downgraded to 'Sell'."
                    elif (not prev_is_buy_consensus) and curr_is_buy_consensus:
                        triggered = True
                        msg = f"🚨 Consensus Shift Detected! The absolute majority of Wall Street analysts have shifted to a 'Buy' consensus on {symbol}."
                    elif (not prev_is_sell_consensus) and curr_is_sell_consensus:
                        triggered = True
                        msg = f"🚨 Consensus Shift Detected! The absolute majority of Wall Street analysts have shifted to a 'Sell' consensus on {symbol}."
            
            elif rule_type == "insider_buying":
                from app.services.market_data import fetch_insider_sentiment
                insider_data = await fetch_insider_sentiment(symbol)
                if insider_data:
                    # Sort desc by year and month to ensure the newest is index 0
                    sorted_data = sorted(insider_data, key=lambda x: (x.get("year", 0), x.get("month", 0)), reverse=True)
                    current_month = sorted_data[0]
                    change = current_month.get("change", 0)
                    
                    if change > 0:
                        triggered = True
                        msg = f"🕵️‍♂️ Insider Buying Detected! Executives at {symbol} have actively bought {change:,.0f} net shares of their own company this month!"
                    elif change <= -100000:
                        triggered = True
                        msg = f"📉 Insider Dump Warning! Executives at {symbol} have aggressively unloaded {abs(change):,.0f} net shares this month. Proceed with caution."

            elif rule_type == "earnings_alert":
                from app.services.market_data import fetch_earnings_calendar
                calendar = await fetch_earnings_calendar(symbol)
                
                if calendar:
                    import datetime as dt
                    from datetime import timezone
                    today = dt.datetime.now(timezone.utc).date()
                    
                    for event in calendar:
                        event_date_str = event.get("date")
                        if not event_date_str: continue
                        
                        event_date = dt.datetime.fromisoformat(event_date_str).date()
                        days_until = (event_date - today).days
                        
                        if 0 <= days_until <= threshold:
                            quarter = event.get('quarter', 'Recent')
                            year = event.get('year', '')
                            hour_code = event.get('hour', '')
                            eps = event.get('epsEstimate')
                            
                            hour_str = "(Before Market Open)" if hour_code == "bmo" else "(After Market Close)" if hour_code == "amc" else ""
                            eps_str = f" Expected EPS: ${eps:.2f}." if eps is not None else ""
                            
                            triggered = True
                            msg = f"📅 Upcoming Earnings Catalyst: {symbol} is reporting Quarter {quarter} {year} Earnings in {days_until} days {hour_str}.{eps_str}"
                            break
            
            if triggered and rule_type in ['analyst_upgrade', 'insider_buying', 'earnings_alert', 'price_breakout']:
                import datetime as dt
                from datetime import timezone
                cooldown_days = 30 if rule_type == 'earnings_alert' else 1 if rule_type == 'price_breakout' else 7
                cutoff = (dt.datetime.now(timezone.utc) - dt.timedelta(days=cooldown_days)).isoformat()
                recent = supabase.table("alert_log").select("id").eq("user_id", user_id).eq("rule_id", rule_id).gt("triggered_at", cutoff).execute()
                if recent.data:
                    triggered = False

            if triggered:
                logger.info(f"Alert triggered for user {user_id} on {symbol}: {msg}")
                
                # Default log entry
                log_data = {
                    "user_id": user_id,
                    "rule_id": rule_id,
                    "rule_type": rule_type,
                    "symbol": symbol,
                    "message": msg,
                    "notified": False
                }

                # Mid-poll database safety wrap
                try:
                    # 1. ALWAYS write the alert log first to secure the event
                    log_res = supabase.table("alert_log").insert(log_data).execute()
                    
                    if log_res.data:
                        # Grab the generated UUID of the log
                        log_id = log_res.data[0].get('id')
                        
                        # 2. Try fetching the user profile for Telegram dispatch
                        profile_res = supabase.table("profiles").select("telegram_chat_id, telegram_enabled").eq("id", user_id).execute()
                        if profile_res.data and len(profile_res.data) > 0:
                            profile = profile_res.data[0]
                            chat_id = profile.get("telegram_chat_id")
                            
                            if profile.get("telegram_enabled") and chat_id:
                                # 3. Send the HTTP request
                                success = await send_telegram_alert(chat_id, f"🚨 <b>StockAlert</b> 🚨\n\n{msg}")
                                
                                # 4. Mark log as explicitly notified
                                if success and log_id:
                                    supabase.table("alert_log").update({"notified": True}).eq("id", log_id).execute()
                except Exception as db_err:
                    logger.error(f"🚨 Supabase connection DROPPED mid-poll for user {user_id}: {db_err} 🚨")
                    
            # ANTI-SPAM THROTTLE: Respect Telegram's 30 msg/sec strict global limit rules
            # Prevents 429 Too Many Requests if 100 users immediately trigger rules on AAPL
            await asyncio.sleep(0.05)
                
    except Exception as e:
        logger.error(f"Error evaluating rules for {symbol}: {e}")