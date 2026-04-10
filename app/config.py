from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Supabase configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # Optional Third-party API keys
    FINNHUB_API_KEY: Optional[str] = None
    FMP_API_KEY: Optional[str] = None
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = None

    # Secret token to authenticate the cron trigger endpoint
    # Set this in Render environment variables and in cron-job.org request headers
    CRON_SECRET: Optional[str] = None

    # Dodo Payments
    DODO_PAYMENTS_API_KEY: Optional[str] = None
    DODO_PAYMENTS_WEBHOOK_SECRET: Optional[str] = None
    DODO_PLUS_PRODUCT_ID: Optional[str] = None
    DODO_PRO_PRODUCT_ID: Optional[str] = None
    
    # Environment variables are loaded from the .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()