from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.schemas import UserProfile, TelegramLinkRequest
from app.routers.auth import get_current_user
import logging
import random
import string

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/telegram/link", status_code=200)
def link_telegram(request: TelegramLinkRequest, current_user: UserProfile = Depends(get_current_user)):
    try:
        update_data = {
            "telegram_chat_id": request.chat_id,
            "telegram_enabled": True
        }
        
        # Check if they are eligible for the first-50 PRO promo
        promo_used_res = supabase.table("profiles").select("*", count="exact").eq("telegram_enabled", True).execute()
        promo_used = promo_used_res.count if promo_used_res.count is not None else 0
        
        # Only upgrade if they are not already pro
        if promo_used < 50 and current_user.tier != "pro":
            update_data["tier"] = "pro"

        res = supabase.table("profiles").update(update_data).eq("id", str(current_user.id)).execute()
        
        # If the profile doesn't exist yet, create it.
        if not res.data:
            supabase.table("profiles").insert({"id": str(current_user.id), **update_data}).execute()
            
        message = "Telegram successfully linked!"
        if promo_used < 50 and current_user.tier != "pro":
            message += " You got a FREE Pro upgrade!"
            
        return {"status": "success", "message": message}
    except Exception as e:
        logger.error(f"Error linking Telegram: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/telegram/generate-code")
def generate_telegram_code(current_user: UserProfile = Depends(get_current_user)):
    """Generate a unique 6-digit code the user sends to the bot to verify ownership."""
    try:
        # Invalidate any old unused codes for this user first
        supabase.table("telegram_verification_codes") \
            .update({"verified": True}) \
            .eq("user_id", str(current_user.id)) \
            .eq("verified", False) \
            .execute()

        # Generate a unique 6-digit code
        code = ''.join(random.choices(string.digits, k=6))

        supabase.table("telegram_verification_codes").insert({
            "user_id": str(current_user.id),
            "code": code,
        }).execute()

        return {"code": code}
    except Exception as e:
        logger.error(f"Error generating Telegram code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/telegram/verify-status")
def telegram_verify_status(current_user: UserProfile = Depends(get_current_user)):
    """Frontend polls this every 2 seconds to check if user has sent the code to the bot."""
    try:
        res = supabase.table("telegram_verification_codes") \
            .select("verified, chat_id") \
            .eq("user_id", str(current_user.id)) \
            .eq("verified", True) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        if res.data:
            return {"verified": True, "chat_id": res.data[0]["chat_id"]}
        return {"verified": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
