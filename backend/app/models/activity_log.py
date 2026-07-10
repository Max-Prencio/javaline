import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime
from ..database import Base


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(150), nullable=False)
    user_name = Column(String(150), default="")
    action = Column(String(100), nullable=False)
    detail = Column(Text, default="")
    store = Column(String(50), default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
