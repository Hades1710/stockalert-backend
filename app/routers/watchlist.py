from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database import supabase
from app.schemas import UserProfile, WatchlistAddRequest, WatchlistItem, AlertRuleCreate, AlertRule, AlertRuleUpdate
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
async def add_to_watchlist(item: WatchlistAddRequest, current_user: UserProfile = Depends(get_current_user)):
    try:
        symbol = item.symbol.upper()
        
        # 3B: Symbol Validation mathematically restricting bad Finnhub returns
        from app.services.market_data import fetch_realtime_quote
        quote = await fetch_realtime_quote(symbol)
        if not quote or not quote.get("c") or float(quote.get("c")) <= 0:
            raise HTTPException(status_code=400, detail="Invalid symbol or market data unavailable.")
            
        # Avoid duplicates
        existing = supabase.table("watchlist").select("*").eq("user_id", str(current_user.id)).eq("symbol", symbol).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Symbol already in watchlist")
            
        new_item = {
            "user_id": str(current_user.id),
            "symbol": symbol
        }
        response = supabase.table("watchlist").insert(new_item).execute()
        
        # 3C: Default Rules bulk generation for UX mapping
        default_rules = [
            {"user_id": str(current_user.id), "symbol": symbol, "rule_type": "price_threshold", "threshold": 5.0},
            {"user_id": str(current_user.id), "symbol": symbol, "rule_type": "52w_high_low", "threshold": 1.0},
            {"user_id": str(current_user.id), "symbol": symbol, "rule_type": "unusual_volume", "threshold": 200.0}
        ]
        supabase.table("alert_rules").insert(default_rules).execute()
        
        return response.data[0]
    except HTTPException:
        raise
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

@router.patch("/rules/{rule_id}", response_model=AlertRule)
def update_alert_rule(rule_id: str, update: AlertRuleUpdate, current_user: UserProfile = Depends(get_current_user)):
    try:
        res = supabase.table("alert_rules").update({"threshold": update.threshold}).eq("id", rule_id).eq("user_id", str(current_user.id)).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Rule not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))