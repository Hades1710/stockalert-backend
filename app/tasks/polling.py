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
            if is_market_open():
                logger.info("Market is open. Polling data...")
                # Fetch distinct symbols from watchlists
                response = supabase.table("watchlist").select("symbol").execute()
                if response.data:
                    symbols = set([item["symbol"] for item in response.data])
                    logger.info(f"Polling {len(symbols)} unique symbols")
                    for symbol in symbols:
                        quote = await fetch_realtime_quote(symbol)
                        if quote:
                            await evaluate_rules_for_symbol(symbol, quote)
            else:
                logger.info("Market is closed. Skipping polling.")
        except Exception as e:
            logger.error(f"Error in polling loop: {e}")
        
        # Poll every 15 minutes (900 seconds)
        await asyncio.sleep(900)