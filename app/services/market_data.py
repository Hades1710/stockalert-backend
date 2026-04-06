import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)

FINNHUB_BASE = "https://finnhub.io/api/v1"
FMP_BASE = "https://financialmodelingprep.com/api/v3"

async def fetch_realtime_quote(symbol: str) -> dict:
    if not settings.FINNHUB_API_KEY:
        logger.warning("Finnhub API key not set")
        return {}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{FINNHUB_BASE}/quote",
                params={"symbol": symbol, "token": settings.FINNHUB_API_KEY}
            )
            response.raise_for_status()
            return response.json()
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