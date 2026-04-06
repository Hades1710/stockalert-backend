from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager
from app.routers import auth, watchlist, notifications, market, alerts
from app.routers import telegram_webhook
from app.tasks.polling import poll_market_data
from app.services.market_data import fetch_realtime_quote, fetch_dividends, fetch_stock_splits
from app.services.notifications.telegram import send_telegram_alert
from app.database import supabase
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

# CORS: Allow the Next.js frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                          # Local dev
        "https://stockalert-backend-82o8.onrender.com",  # Render backend (for Swagger testing)
        "https://stockalert-backend.vercel.app",         # Vercel frontend
        "https://*.vercel.app",                          # Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(watchlist.router, prefix="/watchlist", tags=["Watchlist"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(market.router, prefix="/market", tags=["Market (Phase 3)"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts Feed (Phase 3)"])
app.include_router(telegram_webhook.router, prefix="/telegram", tags=["Telegram Webhook"])

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

@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"])
def health():
    try:
        # Heartbeat ping to keep Supabase free tier from auto-pausing
        supabase.table("system_health").select("*").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        # If DB drops, UptimeRobot will still get 200 OK but we can see degradation
        return {"status": "degraded", "database_error": str(e)}

@app.get("/health/polling", tags=["Health"])
def polling_status():
    try:
        response = supabase.table("system_health").select("last_check").eq("id", 1).execute()
        if response.data:
            return {"status": "ok", "last_poll": response.data[0].get("last_check")}
        return {"status": "error", "message": "No heartbeat record found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}