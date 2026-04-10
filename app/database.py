import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    dummy_urls = ["", "your_supabase_url_here", "https://your-supabase-url-here.supabase.co"]
    if settings.SUPABASE_URL in dummy_urls or not settings.SUPABASE_KEY or settings.SUPABASE_KEY == "your_supabase_anon_key_here":
        logger.warning("Supabase credentials not fully configured. Using dummy client.")
        class DummySupabase:
            def table(self, *args, **kwargs):
                raise ValueError("Supabase credentials are not configured in .env")
            def auth(self):
                raise ValueError("Supabase credentials are not configured in .env")
        return DummySupabase()
        
    try:
        url: str = settings.SUPABASE_URL.strip()
        key: str = settings.SUPABASE_KEY.strip()
        supabase: Client = create_client(url, key)
        return supabase
    except Exception as e:
        logger.error(f"Error initializing Supabase client: {e}")
        raise

# Singleton client instance
supabase = get_supabase()