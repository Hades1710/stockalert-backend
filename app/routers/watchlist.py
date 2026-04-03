from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database import supabase
from app.schemas import UserProfile, WatchlistAddRequest, WatchlistItem, AlertRuleCreate, AlertRule
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[WatchlistItem])
def get_watchlist(current_user: UserProfile = Depends(get_current_user)):
    try:
        response = supabase.table("watchlist").select("*").eq("user_id", str(current_user.id)).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=WatchlistItem)
def add_to_watchlist(item: WatchlistAddRequest, current_user: UserProfile = Depends(get_current_user)):
    try:
        # Avoid duplicates
        existing = supabase.table("watchlist").select("*").eq("user_id", str(current_user.id)).eq("symbol", item.symbol.upper()).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Symbol already in watchlist")
            
        new_item = {
            "user_id": str(current_user.id),
            "symbol": item.symbol.upper()
        }
        response = supabase.table("watchlist").insert(new_item).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(symbol: str, current_user: UserProfile = Depends(get_current_user)):
    try:
        supabase.table("watchlist").delete().eq("user_id", str(current_user.id)).eq("symbol", symbol.upper()).execute()
        # Also clean up associated alert rules?
        supabase.table("alert_rules").delete().eq("user_id", str(current_user.id)).eq("symbol", symbol.upper()).execute()
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/rules", response_model=List[AlertRule])
def get_alert_rules(symbol: str, current_user: UserProfile = Depends(get_current_user)):
    try:
        response = supabase.table("alert_rules").select("*").eq("user_id", str(current_user.id)).eq("symbol", symbol.upper()).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{symbol}/rules", response_model=AlertRule)
def add_alert_rule(symbol: str, rule: AlertRuleCreate, current_user: UserProfile = Depends(get_current_user)):
    try:
        new_rule = {
            "user_id": str(current_user.id),
            "symbol": symbol.upper(),
            "rule_type": rule.rule_type,
            "threshold": rule.threshold
        }
        response = supabase.table("alert_rules").insert(new_rule).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_rule(rule_id: str, current_user: UserProfile = Depends(get_current_user)):
    try:
        supabase.table("alert_rules").delete().eq("id", rule_id).eq("user_id", str(current_user.id)).execute()
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))