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
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False
