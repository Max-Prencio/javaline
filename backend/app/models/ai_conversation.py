from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text
from ..database import Base

class AiConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String, primary_key=True)
    user_id = Column(String(255), nullable=False, index=True)
    tenant_id = Column(String(50), default="default", index=True)
    title = Column(String(255), default="")
    messages = Column(Text, default="[]")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
