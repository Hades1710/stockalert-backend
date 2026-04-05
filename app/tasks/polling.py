import asyncio
import logging
from datetime import datetime, timedelta
import time
import pytz
from app.database import supabase
from app.services.market_data import fetch_realtime_quote
from app.services.alert_engine import evaluate_rules_for_symbol

logger = logging.getLogger(__name__)

def is_market_open() -> bool:
    return True  # 🚨 FORCED OPEN FOR TESTING 🚨

    tz = pytz.timezone('US/Eastern')
    now = datetime.now(tz)
    # Market closes on weekends (Mon=0, Sun=6)
    if now.weekday() > 4:
        return False
    # Market hours: 9:30 AM to 4:00 PM
    if now.hour < 9 or (now.hour == 9 and now.minute < 30):
        return False
    if now.hour >= 16:
        return False
    return True

async def poll_market_data():
    logger.info("Starting background polling task")
    while True:
        try:
            if not is_market_open():
                logger.info("Market is closed. Skipping polling.")
                await asyncio.sleep(900)
                continue
                
            logger.info("Polling data...")
            
            # 1. Fetch unique symbols from user watchlists
            try:
                response = supabase.table("watchlist").select("symbol").execute()
                watchlists = response.data
            except Exception as e:
                logger.error(f"Error fetching watchlists from DB: {e}")
                raise e # Bubble up to master try/except
                
            if not watchlists:
                logger.info("No stocks in any watchlists. Sleeping...")
                await asyncio.sleep(900)
                continue
                
            # Use a Set to avoid duplicating requests for the same symbol
            symbols = set([item["symbol"] for item in watchlists])
            logger.info(f"Unique symbols to track: {symbols}")
            
            # 2. Iterate each symbol and fetch market data
            finnhub_strikes = 0
            
            for symbol in symbols:
                quote = await fetch_realtime_quote(symbol)
                
                if quote:
                    finnhub_strikes = 0  # Reset strike counter on success
                    
                    current_price = quote.get('c')
                    trade_time = quote.get('t', 0)
                    
                    # Security Validation 1: Null/Negative LTP Protection
                    if not current_price or float(current_price) <= 0:
                        logger.warning(f"Dropping {symbol}: Finnhub returned null or negative price.")
                        continue
                        
                    # Security Validation 2: Stale Data Protection (> 20 mins)
                    current_timestamp = int(time.time())
                    if (current_timestamp - trade_time) > 1200:
                        logger.warning(f"Dropping {symbol}: Finnhub timestamp is entirely stale (>20m).")
                        continue
                        
                    logger.info(f"Fetched verified quote for {symbol}: ${current_price}")
                    # Evaluate alert rules safely
                    await evaluate_rules_for_symbol(symbol, quote)
                else:
                    logger.warning(f"Skipping {symbol} due to missing quote data")
                    finnhub_strikes += 1
                    
                    # Security Validation 3: API Global Outage Strike Counter
                    if finnhub_strikes == 3:
                        logger.error("🚨 3 CONSECUTIVE DROPS: Finnhub appears globally down!")
                        from app.services.notifications.telegram import send_telegram_alert
                        
                        # Fetch the absolute first active profile to serve as the admin ping
                        admin_res = supabase.table("profiles").select("telegram_chat_id").not_is("telegram_chat_id", "null").limit(1).execute()
                        if admin_res.data:
                            admin_chat = admin_res.data[0].get("telegram_chat_id")
                            if admin_chat:
                                await send_telegram_alert(admin_chat, "🚨 <b>SYSTEM CRIT</b> 🚨\n\nFinnhub API has violently dropped 3 consecutive requests. Check system status immediately.")
                                
            # 3. Autonomous Database Maintenance (Delete alert logs older than 30 days)
            try:
                thirty_days_ago = (datetime.now(pytz.utc) - timedelta(days=30)).isoformat()
                # Use Supabase REST filter `.lt()` strictly deleting anything older than 30 days to save 500MB free-tier limit
                supabase.table("alert_log").delete().lt("triggered_at", thirty_days_ago).execute()
            except Exception as cleanup_err:
                logger.error(f"Failed autonomous DB cleanup: {cleanup_err}")

            # Sleep for 15 minutes (900 seconds)
            await asyncio.sleep(900)
            
        except Exception as e:
            logger.error(f"🚨 CATASTROPHIC FAILURE IN POLLING LOOP: {e} 🚨")
            logger.error("Sleeping for 60 seconds before gracefully restarting the engine...")
            await asyncio.sleep(60)