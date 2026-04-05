import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = "https://api.telegram.org/bot"

async def send_telegram_alert(chat_id: str, message: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("Telegram Bot Token is not set. Cannot send alert.")
        return False
        
    url = f"{TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            logger.info(f"Telegram alert sent successfully to chat_id {chat_id}")
            return True
        except httpx.HTTPStatusError as http_err:
            if http_err.response.status_code == 403:
                logger.warning(f"🚨 Bot BLOCKED by user {chat_id} (HTTP 403). Deactivating account instantly...")
                try:
                    from app.database import supabase
                    supabase.table("profiles").update({"telegram_enabled": False}).eq("telegram_chat_id", chat_id).execute()
                except Exception as block_err:
                    logger.error(f"Failed to securely deactivate user {chat_id} in DB: {block_err}")
            
            logger.error(f"HTTP Error sending Telegram alert to {chat_id}: {http_err}")
            return False
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False
