import httpx
import time
from app.config import settings
import logging

logger = logging.getLogger(__name__)

FINNHUB_BASE = "https://finnhub.io/api/v1"
FMP_BASE = "https://financialmodelingprep.com/api/v3"

# ─── In-Memory Quote Cache ────────────────────────────────────────────────────
# Each entry: { symbol: {"data": dict, "fetched_at": float} }
# TTL: 60 seconds — shared across ALL users on the single Render instance.
# This means 50 users tracking the same 10 stocks = 10 Finnhub calls/min, not 500.
QUOTE_CACHE: dict[str, dict] = {}
CACHE_TTL_SECONDS = 60

def get_cached_quote(symbol: str) -> dict | None:
    """Return a cached quote if it is still fresh, else None."""
    entry = QUOTE_CACHE.get(symbol)
    if entry and (time.time() - entry["fetched_at"]) < CACHE_TTL_SECONDS:
        logger.debug(f"Cache HIT for {symbol}")
        return entry["data"]
    return None

def set_cached_quote(symbol: str, data: dict) -> None:
    """Store a fresh quote in the in-memory cache."""
    QUOTE_CACHE[symbol] = {"data": data, "fetched_at": time.time()}

# ─────────────────────────────────────────────────────────────────────────────

async def fetch_realtime_quote(symbol: str) -> dict:
    if not settings.FINNHUB_API_KEY:
        logger.warning("Finnhub API key not set")
        return {}

    # Check cache first — avoids burning Finnhub API calls
    cached = get_cached_quote(symbol)
    if cached:
        return cached

    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Cache MISS — calling Finnhub for {symbol}")
            response = await client.get(
                f"{FINNHUB_BASE}/quote",
                params={"symbol": symbol, "token": settings.FINNHUB_API_KEY}
            )
            response.raise_for_status()
            data = response.json()
            if data.get("c"):  # only cache valid non-zero quotes
                set_cached_quote(symbol, data)
            return data
        except Exception as e:
            logger.error(f"Error fetching real-time quote for {symbol}: {e}")
            return {}

async def fetch_symbol_search(query: str) -> list:
    if not settings.FINNHUB_API_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{FINNHUB_BASE}/search",
                params={"q": query, "token": settings.FINNHUB_API_KEY}
            )
            response.raise_for_status()
            data = response.json().get("result", [])
            # Strictly filter for Common Stock natively preventing foreign stocks (dots in symbol)
            return [
                {
                    "symbol": item.get("symbol"),
                    "name": item.get("description"),
                    "type": item.get("type")
                }
                for item in data if item.get("type") == "Common Stock" and "." not in item.get("symbol", ".")
            ]
        except Exception as e:
            logger.error(f"Error searching symbol {query}: {e}")
            return []

async def fetch_earnings_calendar(start_date: str, end_date: str) -> list:
    if not settings.FINNHUB_API_KEY:
        return []
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{FINNHUB_BASE}/calendar/earnings",
                params={"from": start_date, "to": end_date, "token": settings.FINNHUB_API_KEY}
            )
            response.raise_for_status()
            return response.json().get("earningsCalendar", [])
        except Exception as e:
            logger.error(f"Error fetching earnings calendar: {e}")
            return []

async def fetch_dividends(symbol: str) -> list:
    if not settings.FMP_API_KEY:
        return []
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{FMP_BASE}/historical-price-full/stock_dividend/{symbol}",
                params={"apikey": settings.FMP_API_KEY}
            )
            response.raise_for_status()
            return response.json().get("historical", [])
        except Exception as e:
            logger.error(f"Error fetching dividends for {symbol}: {e}")
            return []

async def fetch_stock_splits(symbol: str) -> list:
    if not settings.FMP_API_KEY:
        return []
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{FMP_BASE}/historical-price-full/stock_split/{symbol}",
                params={"apikey": settings.FMP_API_KEY}
            )
            response.raise_for_status()
            return response.json().get("historical", [])
        except Exception as e:
            logger.error(f"Error fetching stock splits for {symbol}: {e}")
            return []