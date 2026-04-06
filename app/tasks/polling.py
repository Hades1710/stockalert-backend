"""
polling.py — Alert evaluation engine.

Designed to run as a SINGLE CYCLE triggered by an external cron service
(e.g., cron-job.org) via POST /internal/trigger-poll.

This replaces the old asyncio while-True loop that was incompatible with
Render's free-tier web service (which only supports web processes, not
persistent background workers).

Flow per trigger:
  1. Check if US market is open (skip gracefully if not).
  2. Fetch all unique symbols from every user's watchlist.
  3. For each symbol, call fetch_realtime_quote (cache-first, TTL=60s).
  4. Validate the quote (non-null, non-stale, positive price).
  5. Run the alert rule evaluator for that symbol.
  6. Clean up alert_log entries older than 30 days.
  7. Update the system_health heartbeat for the dashboard status pill.
"""
import logging
import time
from datetime import datetime, timedelta

import pytz

from app.database import supabase
from app.services.market_data import fetch_realtime_quote
from app.services.alert_engine import evaluate_rules_for_symbol

logger = logging.getLogger(__name__)


def is_market_open() -> bool:
    """
    Returns True only during US market hours Mon-Fri 09:30-16:00 ET.
    Extend this in future to handle market holidays via a calendar API.
    """
    tz = pytz.timezone("US/Eastern")
    now = datetime.now(tz)
    if now.weekday() > 4:          # Saturday=5, Sunday=6
        return False
    if now.hour < 9 or (now.hour == 9 and now.minute < 30):
        return False
    if now.hour >= 16:
        return False
    return True


async def run_single_poll_cycle() -> dict:
    """
    Execute one complete alert-evaluation cycle.
    Called by POST /internal/trigger-poll — meant to be hit every 60s by cron-job.org.

    Returns a summary dict so the cron log is human-readable.
    """
    summary = {
        "market_open": False,
        "symbols_evaluated": 0,
        "alerts_triggered": 0,
        "errors": [],
    }

    # ── 1. Market hours gate ──────────────────────────────────────────
    if not is_market_open():
        logger.info("Market is closed — skipping poll cycle.")
        return summary

    summary["market_open"] = True
    logger.info("Market is open — starting poll cycle.")

    # ── 2. Fetch unique symbols across all watchlists ─────────────────
    try:
        response = supabase.table("watchlist").select("symbol").execute()
        watchlists = response.data or []
    except Exception as e:
        msg = f"Failed to fetch watchlist: {e}"
        logger.error(msg)
        summary["errors"].append(msg)
        return summary

    if not watchlists:
        logger.info("No stocks in any watchlist — nothing to evaluate.")
        return summary

    symbols = {item["symbol"] for item in watchlists}
    logger.info(f"Evaluating {len(symbols)} unique symbols: {symbols}")

    # ── 3. Consecutive-failure strike counter (Finnhub outage detection) ──
    consecutive_failures = 0

    for symbol in symbols:
        try:
            quote = await fetch_realtime_quote(symbol)

            if not quote:
                consecutive_failures += 1
                logger.warning(f"No quote returned for {symbol} ({consecutive_failures} consecutive failures)")
                _maybe_alert_admin_on_outage(consecutive_failures)
                continue

            consecutive_failures = 0  # reset on success

            current_price = quote.get("c")
            trade_time = quote.get("t", 0)

            # Validation: reject zero / negative prices
            if not current_price or float(current_price) <= 0:
                logger.warning(f"Dropping {symbol}: null or negative price ({current_price})")
                continue

            # Validation: reject data that is stale by more than 20 minutes
            if (int(time.time()) - trade_time) > 1200:
                logger.warning(f"Dropping {symbol}: quote timestamp is stale (>20 min old)")
                continue

            logger.info(f"Valid quote for {symbol}: ${current_price}")

            # ── 4. Evaluate alert rules ───────────────────────────────
            triggered = await evaluate_rules_for_symbol(symbol, quote)
            if triggered:
                summary["alerts_triggered"] += triggered
            summary["symbols_evaluated"] += 1

        except Exception as e:
            msg = f"Error evaluating {symbol}: {e}"
            logger.error(msg)
            summary["errors"].append(msg)

    # ── 5. Auto-cleanup: delete alert_log entries older than 30 days ──
    try:
        cutoff = (datetime.now(pytz.utc) - timedelta(days=30)).isoformat()
        supabase.table("alert_log").delete().lt("triggered_at", cutoff).execute()
        logger.debug("Old alert_log entries cleaned up.")
    except Exception as e:
        logger.error(f"DB cleanup failed: {e}")

    # ── 6. Update heartbeat for dashboard status pill ─────────────────
    try:
        supabase.table("system_health").update({"last_check": "now()"}).eq("id", 1).execute()
    except Exception as e:
        logger.error(f"Heartbeat update failed: {e}")

    logger.info(f"Poll cycle complete: {summary}")
    return summary


def _maybe_alert_admin_on_outage(strike_count: int) -> None:
    """
    After 3 consecutive Finnhub failures, fire a Telegram alert to the
    first admin profile. Runs synchronously to avoid loop complexity.
    """
    if strike_count != 3:
        return
    try:
        import asyncio
        from app.services.notifications.telegram import send_telegram_alert
        admin_res = (
            supabase.table("profiles")
            .select("telegram_chat_id")
            .not_is("telegram_chat_id", "null")
            .limit(1)
            .execute()
        )
        if admin_res.data:
            chat_id = admin_res.data[0].get("telegram_chat_id")
            if chat_id:
                asyncio.create_task(
                    send_telegram_alert(
                        chat_id,
                        "🚨 <b>SYSTEM ALERT</b>\n\nFinnhub has failed 3 consecutive requests. "
                        "Check API status immediately."
                    )
                )
    except Exception as e:
        logger.error(f"Admin outage alert failed: {e}")