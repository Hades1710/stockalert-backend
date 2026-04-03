from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.schemas import UserProfile, TelegramLinkRequest
from app.routers.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/telegram/link", status_code=200)
def link_telegram(request: TelegramLinkRequest, current_user: UserProfile = Depends(get_current_user)):
    try:
        update_data = {
            "telegram_chat_id": request.chat_id,
            "telegram_enabled": True
        }
        res = supabase.table("profiles").update(update_data).eq("id", str(current_user.id)).execute()
        
        # If the profile doesn't exist yet, create it.
        if not res.data:
            supabase.table("profiles").insert({"id": str(current_user.id), **update_data}).execute()
            
        return {"status": "success", "message": "Telegram successfully linked!"}
    except Exception as e:
        logger.error(f"Error linking Telegram: {e}")
        raise HTTPException(status_code=500, detail=str(e))
