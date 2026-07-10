import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from ..database import Base


class Branch(Base):
    __tablename__ = "branches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    address = Column(String(500), default="")
    phone = Column(String(50), default="")
    email = Column(String(255), default="")
    manager = Column(String(255), default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
