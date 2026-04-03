from fastapi import FastAPI
import asyncio
from contextlib import asynccontextmanager
from app.routers import auth, watchlist, notifications
from app.tasks.polling import poll_market_data
from app.services.market_data import fetch_realtime_quote, fetch_dividends, fetch_stock_splits
from app.services.notifications.telegram import send_telegram_alert
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background polling task
    logger.info("Starting application lifespan...")
    polling_task = asyncio.create_task(poll_market_data())
    yield
    # Shutdown
    logger.info("Shutting down application...")
    polling_task.cancel()

app = FastAPI(title="StockAlert API", version="0.1.0", lifespan=lifespan)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(watchlist.router, prefix="/watchlist", tags=["Watchlist"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

@app.get("/test/market-data/{symbol}", tags=["Testing"])
async def test_market_data(symbol: str):
    return {
        "symbol": symbol.upper(),
        "finnhub_quote": await fetch_realtime_quote(symbol.upper()),
        "fmp_dividends": await fetch_dividends(symbol.upper()),
        "fmp_splits": await fetch_stock_splits(symbol.upper())
    }

@app.get("/test/telegram/{symbol}", tags=["Testing"])
async def test_telegram_alert(symbol: str, chat_id: str):
    quote = await fetch_realtime_quote(symbol.upper())
    if not quote or "c" not in quote:
        return {"status": "error", "message": "Failed to fetch Finnhub quote"}
        
    message = (
        f"🧪 <b>StockAlert Test</b> 🧪\n\n"
        f"<b>{symbol.upper()}</b> Current Price: ${quote['c']}\n"
        f"Daily High: ${quote['h']}\n"
        f"Daily Low: ${quote['l']}\n"
    )
    
    success = await send_telegram_alert(chat_id, message)
    if success:
        return {"status": "success", "message": "Message perfectly dispatched to Telegram!"}
    else:
        return {"status": "error", "message": "Failed to send message. Check the uvicorn terminal."}

@app.get("/health")
def health():
    return {"status": "ok"}