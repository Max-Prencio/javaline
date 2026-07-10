import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text
from ..database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    company = Column(String(255), default="")
    rnc = Column(String(50), default="")
    email = Column(String(255), default="")
    phone = Column(String(50), default="")
    type = Column(String(20), default="client")
    address = Column(Text, default="")
    notes = Column(Text, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
