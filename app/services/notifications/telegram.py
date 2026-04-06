"""
telegram.py — Notification delivery service.

Handles all outbound Telegram messages with robust error recovery:

  - 403 Forbidden  → user blocked the bot. Auto-disables their Telegram.
  - 400 Bad Request → chat_id is invalid/deleted. Auto-disables.
  - 404 Not Found  → bot token invalid or chat does not exist. Logs critical.
  - 429 Too Many Requests → Telegram rate limit. Respects Retry-After header.
  - Network errors → logged, returns False gracefully (never crashes the caller).

A user whose Telegram is auto-disabled will see "Not connected" in /settings
and can reconnect using the 6-digit code flow anytime.
"""
import asyncio
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = "https://api.telegram.org/bot"

# Telegram error descriptions that mean "this chat_id is permanently invalid"
_FATAL_ERRORS = {
    "bot was blocked by the user",
    "user is deactivated",
    "chat not found",
    "bot was kicked from the supergroup chat",
    "have no rights to send a message",
}


async def _disable_telegram_for_chat(chat_id: str, reason: str) -> None:
    """
    Set telegram_enabled=False in the profiles table for a given chat_id.
    Called automatically when Telegram confirms the chat is unreachable.
    """
    try:
        from app.database import supabase
        supabase.table("profiles") \
            .update({"telegram_enabled": False}) \
            .eq("telegram_chat_id", chat_id) \
            .execute()
        logger.warning(
            f"Auto-disabled Telegram for chat_id={chat_id}. Reason: {reason}"
        )
    except Exception as e:
        logger.error(f"Failed to disable Telegram for chat_id={chat_id}: {e}")


async def send_telegram_alert(chat_id: str, message: str) -> bool:
    """
    Send an HTML-formatted Telegram message to the given chat_id.

    Returns:
        True  — message delivered successfully.
        False — delivery failed (caller should not retry immediately).
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN is not set — skipping alert.")
        return False

    url = f"{TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(url, json=payload)

            # ── 429: Telegram rate limit ──────────────────────────────
            if response.status_code == 429:
                retry_after = response.json().get("parameters", {}).get("retry_after", 5)
                logger.warning(
                    f"Telegram rate limit hit for chat_id={chat_id}. "
                    f"Retrying after {retry_after}s..."
                )
                await asyncio.sleep(retry_after)
                # Single retry after the cool-down
                response = await client.post(url, json=payload)

            response.raise_for_status()
            logger.info(f"Telegram alert delivered to chat_id={chat_id}")
            return True

        except httpx.HTTPStatusError as err:
            status = err.response.status_code
            body = {}
            try:
                body = err.response.json()
            except Exception:
                pass

            description = body.get("description", "").lower()
            logger.error(
                f"Telegram HTTP {status} for chat_id={chat_id}: {description}"
            )

            # ── Permanent failures: auto-disable the user ─────────────
            if status in (400, 403) and any(e in description for e in _FATAL_ERRORS):
                await _disable_telegram_for_chat(chat_id, description)

            # ── 404: usually means invalid bot token ─────────────────
            elif status == 404:
                logger.critical(
                    "Telegram 404 — bot token may be invalid or revoked. "
                    "Check TELEGRAM_BOT_TOKEN in environment variables."
                )

            return False

        except httpx.TimeoutException:
            logger.error(
                f"Telegram request timed out for chat_id={chat_id}. "
                "Telegram servers may be slow — will retry next cycle."
            )
            return False

        except httpx.RequestError as e:
            logger.error(
                f"Network error sending Telegram alert to chat_id={chat_id}: {e}"
            )
            return False
