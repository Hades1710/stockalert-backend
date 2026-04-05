import asyncio
import logging
from datetime import datetime
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
            for symbol in symbols:
                quote = await fetch_realtime_quote(symbol)
                
                if quote:
                    logger.info(f"Fetched quote for {symbol}: {quote.get('c')}")
                    # Evaluate alert rules
                    await evaluate_rules_for_symbol(symbol, quote)
                else:
                    logger.warning(f"Skipping {symbol} due to missing quote data")
            
            # Sleep for 15 minutes (900 seconds)
            await asyncio.sleep(900)
            
        except Exception as e:
            logger.error(f"🚨 CATASTROPHIC FAILURE IN POLLING LOOP: {e} 🚨")
            logger.error("Sleeping for 60 seconds before gracefully restarting the engine...")
            await asyncio.sleep(60)