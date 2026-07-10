from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class CashRegisterOpen(BaseModel):
    user_id: str
    initial_balance: float = 0


class CashRegisterClose(BaseModel):
    user_id: str


class TransactionCreate(BaseModel):
    type: str
    concept: str
    amount: float
    payment_method: str = "cash"
    reference: str = ""
    user_id: Optional[str] = None


class CashRegisterResponse(BaseModel):
    id: str
    user_id: str
    open_date: datetime
    close_date: Optional[datetime]
    initial_balance: float
    current_balance: float
    total_income: float
    total_expense: float
    status: str
    currency: str
    transactions: Any
    created_at: datetime

    class Config:
        from_attributes = True
