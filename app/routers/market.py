from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
import asyncio
from app.services.market_data import fetch_symbol_search, fetch_realtime_quote
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/search")
async def search_symbol(q: str, current_user = Depends(get_current_user)):
    return await fetch_symbol_search(q)

@router.get("/quote/{symbol}")
async def get_quote(symbol: str, current_user = Depends(get_current_user)):
    quote = await fetch_realtime_quote(symbol.upper())
    if not quote or not quote.get("c"):
        raise HTTPException(status_code=404, detail="Quote unavailable for this symbol")
    return {
        "symbol": symbol.upper(),
        "price": quote.get("c"),
        "change_pct": quote.get("dp"),
        "high": quote.get("h"),
        "low": quote.get("l"),
        "prev_close": quote.get("pc"),
    }

class BatchQuoteRequest(BaseModel):
    symbols: List[str]

@router.post("/quotes")
async def get_batch_quotes(request: BatchQuoteRequest, current_user = Depends(get_current_user)):
    """Fetch quotes for multiple symbols in one request using concurrent Finnhub calls."""
    symbols = [s.upper() for s in request.symbols[:20]]  # cap at 20 to prevent abuse

    async def fetch_one(symbol: str):
        quote = await fetch_realtime_quote(symbol)
        if not quote or not quote.get("c"):
            return symbol, None
        return symbol, {
            "symbol": symbol,
            "price": quote.get("c"),
            "change_pct": quote.get("dp"),
            "high": quote.get("h"),
            "low": quote.get("l"),
            "prev_close": quote.get("pc"),
        }

    results = await asyncio.gather(*[fetch_one(s) for s in symbols])
    return {symbol: data for symbol, data in results if data is not None}
