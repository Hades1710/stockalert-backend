from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import supabase
from app.routers.auth import get_current_user
from app.schemas import UserProfile

router = APIRouter()

@router.get("/history")
def get_alert_history(current_user: UserProfile = Depends(get_current_user)):
    try:
        response = supabase.table("alert_log").select("*").eq("user_id", str(current_user.id)).order("triggered_at", desc=True).limit(30).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
