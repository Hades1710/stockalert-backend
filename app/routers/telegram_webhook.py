from fastapi import APIRouter, Request, Response
from app.database import supabase
from app.services.notifications.telegram import send_telegram_alert
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Telegram calls this endpoint whenever someone messages the bot.
    We use it to match 6-digit verification codes to users.
    """
    try:
        body = await request.json()
        message = body.get("message") or body.get("edited_message")
        if not message:
            return Response(status_code=200)

        chat_id = str(message["chat"]["id"])
        text = message.get("text", "").strip()

        # Only process 6-digit numeric codes
        if not text.isdigit() or len(text) != 6:
            await send_telegram_alert(chat_id, "Send your 6-digit verification code from the StockAlert website to connect your account.")
            return Response(status_code=200)

        # Look up unused, unexpired code
        res = supabase.table("telegram_verification_codes") \
            .select("*") \
            .eq("code", text) \
            .eq("verified", False) \
            .gt("expires_at", "now()") \
            .execute()

        if not res.data:
            await send_telegram_alert(chat_id, "❌ Code not found or expired. Please generate a new code from the website.")
            return Response(status_code=200)

        record = res.data[0]
        user_id = record["user_id"]

        # Mark code as verified and store the real chat_id
        supabase.table("telegram_verification_codes") \
            .update({"verified": True, "chat_id": chat_id}) \
            .eq("id", record["id"]) \
            .execute()

        # Save chat_id to user's profile
        existing = supabase.table("profiles").select("id").eq("id", user_id).execute()
        if existing.data:
            supabase.table("profiles").update({
                "telegram_chat_id": chat_id,
                "telegram_enabled": True
            }).eq("id", user_id).execute()
        else:
            supabase.table("profiles").insert({
                "id": user_id,
                "telegram_chat_id": chat_id,
                "telegram_enabled": True
            }).execute()

        # Send confirmation
        await send_telegram_alert(chat_id, "✅ <b>Telegram connected!</b>\n\nYou'll now receive StockAlert notifications here. Head back to the website to continue setup.")
        logger.info(f"Telegram verified for user {user_id} → chat_id {chat_id}")

    except Exception as e:
        logger.error(f"Webhook error: {e}")

    return Response(status_code=200)
