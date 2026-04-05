import logging
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

        for rule in rules:
            rule_id = rule["id"]
            user_id = rule["user_id"]
            rule_type = rule["rule_type"]
            threshold = rule["threshold"]

            triggered = False
            msg = ""

            if rule_type == "price_threshold":
                # Check if absolute percentage change > threshold
                if abs(price_change_percent) >= threshold:
                    triggered = True
                    direction = "up" if price_change_percent > 0 else "down"
                    msg = f"{symbol} price moved {direction} by {abs(price_change_percent):.2f}% (Threshold: {threshold}%)"
            
            # Additional rule types could be evaluated here (52w_high, volume_spike)
            
            if triggered:
                logger.info(f"Alert triggered for user {user_id} on {symbol}: {msg}")
                
                # Default log entry
                log_data = {
                    "user_id": user_id,
                    "rule_id": rule_id,
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
                
    except Exception as e:
        logger.error(f"Error evaluating rules for {symbol}: {e}")