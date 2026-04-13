"""
main.py — FastAPI application entry point.

Architecture note:
  Alert evaluation is NOT run as a background asyncio task on startup.
  Instead, POST /internal/trigger-poll is called every 60 seconds by
  cron-job.org (free tier), which triggers one complete poll cycle.

  This is intentional — Render's free-tier Web Service does not support
  persistent background workers. Using cron keeps the server stateless,
  predictable, and fully compatible with free-tier hosting.

  To add more cron jobs in the future, add new endpoints under /internal/
  and wire them up in cron-job.org the same way.
"""
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, watchlist, notifications, market, alerts, payments
from app.routers import telegram_webhook
from app.tasks.polling import run_single_poll_cycle
from app.services.market_data import fetch_realtime_quote, fetch_dividends, fetch_stock_splits
from app.services.notifications.telegram import send_telegram_alert
from app.database import supabase
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StockAlert API",
    version="1.0.0",
    description="Backend for StockAlert — real-time stock alert engine with Telegram notifications.",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                           # Local dev
        "https://stockalert-backend-82o8.onrender.com",   # Render backend (Swagger)
        "https://stockalert-backend.vercel.app",          # Vercel frontend
        "https://*.vercel.app",
        "https://stockping.me",
        "https://www.stockping.me",                           # Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,             prefix="/auth",          tags=["Auth"])
app.include_router(watchlist.router,        prefix="/watchlist",     tags=["Watchlist"])
app.include_router(notifications.router,    prefix="/notifications", tags=["Notifications"])
app.include_router(market.router,           prefix="/market",        tags=["Market"])
app.include_router(alerts.router,           prefix="/alerts",        tags=["Alerts"])
app.include_router(telegram_webhook.router, prefix="/telegram",      tags=["Telegram Webhook"])
app.include_router(payments.router,         prefix="",               tags=["Payments"])

# ─── Cron Trigger Endpoint ─────────────────────────────────────────────────────
@app.post("/internal/trigger-poll", tags=["Internal / Cron"])
async def trigger_poll(x_cron_secret: str = Header(default=None)):
    """
    Called every 60 seconds by cron-job.org.
    Protected by X-Cron-Secret header — set CRON_SECRET in Render env vars
    and in cron-job.org's custom request headers.

    Returns a summary of the cycle so cron logs are human-readable.
    """
    # If a secret is configured, enforce it. If not set (local dev), skip check.
    if settings.CRON_SECRET and x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid cron secret")

    summary = await run_single_poll_cycle()
    return {"status": "ok", "cycle": summary}

# ─── Health Endpoints ──────────────────────────────────────────────────────────
@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"])
def health():
    """UptimeRobot pings this every 5 minutes to keep Render awake."""
    try:
        supabase.table("system_health").select("*").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database_error": str(e)}


@app.get("/health/polling", tags=["Health"])
def polling_status():
    """Dashboard status pill reads this to show last heartbeat time."""
    try:
        response = supabase.table("system_health").select("last_check").eq("id", 1).execute()
        if response.data:
            return {"status": "ok", "last_poll": response.data[0].get("last_check")}
        return {"status": "error", "message": "No heartbeat record found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ─── Dev / Testing Endpoints ────────────────────────────────────────────────────
@app.get("/test/market-data/{symbol}", tags=["Testing"])
async def test_market_data(symbol: str):
    return {
        "symbol": symbol.upper(),
        "finnhub_quote": await fetch_realtime_quote(symbol.upper()),
        "fmp_dividends": await fetch_dividends(symbol.upper()),
        "fmp_splits": await fetch_stock_splits(symbol.upper()),
    }


@app.get("/test/telegram/{symbol}", tags=["Testing"])
async def test_telegram_alert(symbol: str, chat_id: str):
    quote = await fetch_realtime_quote(symbol.upper())
    if not quote or "c" not in quote:
        return {"status": "error", "message": "Failed to fetch Finnhub quote"}
    message = (
        f"🧪 <b>StockAlert Test</b> 🧪\n\n"
        f"<b>{symbol.upper()}</b> — Current Price: ${quote['c']}\n"
        f"Daily High: ${quote['h']} | Daily Low: ${quote['l']}\n"
    )
    success = await send_telegram_alert(chat_id, message)
    if success:
        return {"status": "success", "message": "Message dispatched to Telegram!"}
    return {"status": "error", "message": "Failed to send message — check logs."}