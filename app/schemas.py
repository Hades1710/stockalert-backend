from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserProfile(BaseModel):
    id: UUID
    email: Optional[str] = None

class WatchlistAddRequest(BaseModel):
    symbol: str

class WatchlistItem(BaseModel):
    id: UUID
    user_id: UUID
    symbol: str
    added_at: datetime

class AlertRuleCreate(BaseModel):
    rule_type: str  # e.g., 'price_threshold', '52w_high', 'volume_spike'
    threshold: float

class AlertRule(BaseModel):
    id: UUID
    user_id: UUID
    symbol: str
    rule_type: str
    threshold: float
    created_at: datetime

class AlertLog(BaseModel):
    id: UUID
    user_id: UUID
    rule_id: UUID
    symbol: str
    message: str
    triggered_at: datetime

class TelegramLinkRequest(BaseModel):
    chat_id: str
