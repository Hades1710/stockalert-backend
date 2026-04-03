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
    
    # Environment variables are loaded from the .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()