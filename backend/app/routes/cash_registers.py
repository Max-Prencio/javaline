from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware import get_current_user
from ..models.user import User
from ..models.cash_register import CashRegister
from ..schemas.cash_register import (
    CashRegisterOpen, CashRegisterClose,
    TransactionCreate, CashRegisterResponse,
)

router = APIRouter(prefix="/cash-registers", tags=["cash-registers"])


@router.get("", response_model=list[CashRegisterResponse])
def list_registers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(CashRegister).order_by(CashRegister.created_at.desc()).limit(50).all()


@router.get("/{register_id}", response_model=CashRegisterResponse)
def get_register(
    register_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(CashRegister).filter(CashRegister.id == register_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    return r


@router.get("/open/{user_id}", response_model=CashRegisterResponse)
def get_open_register(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(CashRegister).filter(
        CashRegister.user_id == user_id, CashRegister.status == "open"
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="No hay caja abierta")
    return r


@router.post("", response_model=CashRegisterResponse)
def open_register(
    data: CashRegisterOpen,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(CashRegister).filter(
        CashRegister.user_id == data.user_id, CashRegister.status == "open"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya hay una caja abierta")
    from datetime import datetime, timezone
    register = CashRegister(
        user_id=data.user_id,
        initial_balance=data.initial_balance,
        current_balance=data.initial_balance,
        open_date=datetime.now(timezone.utc),
    )
    db.add(register)
    db.commit()
    db.refresh(register)
    return register


@router.post("/close", response_model=CashRegisterResponse)
def close_register(
    data: CashRegisterClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    register = db.query(CashRegister).filter(
        CashRegister.user_id == data.user_id, CashRegister.status == "open"
    ).first()
    if not register:
        raise HTTPException(status_code=400, detail="No hay caja abierta")
    from datetime import datetime, timezone
    register.status = "closed"
    register.close_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(register)
    return register


@router.post("/{register_id}/transactions", response_model=CashRegisterResponse)
def add_transaction(
    register_id: str, data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    register = db.query(CashRegister).filter(CashRegister.id == register_id).first()
    if not register:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    if register.status != "open":
        raise HTTPException(status_code=400, detail="La caja está cerrada")
    import uuid
    txn = {
        "id": f"TXN-{uuid.uuid4().hex[:8].upper()}",
        "createdAt": db.query(CashRegister).first().created_at.isoformat() if False else __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        **data.model_dump(exclude={"user_id"}),
    }
    import datetime as dt
    txn["createdAt"] = dt.datetime.now(dt.timezone.utc).isoformat()
    transactions = list(register.transactions or [])
    transactions.append(txn)
    total_income = sum(t["amount"] for t in transactions if t.get("type") == "income")
    total_expense = sum(t["amount"] for t in transactions if t.get("type") == "expense")
    register.transactions = transactions
    register.total_income = total_income
    register.total_expense = total_expense
    register.current_balance = register.initial_balance + total_income - total_expense
    db.commit()
    db.refresh(register)
    return register


@router.delete("/{register_id}/transactions/{txn_id}", response_model=CashRegisterResponse)
def remove_transaction(
    register_id: str, txn_id: str, user_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    register = db.query(CashRegister).filter(CashRegister.id == register_id).first()
    if not register:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    transactions = [t for t in (register.transactions or []) if t.get("id") != txn_id]
    if len(transactions) == len(register.transactions or []):
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    total_income = sum(t["amount"] for t in transactions if t.get("type") == "income")
    total_expense = sum(t["amount"] for t in transactions if t.get("type") == "expense")
    register.transactions = transactions
    register.total_income = total_income
    register.total_expense = total_expense
    register.current_balance = register.initial_balance + total_income - total_expense
    db.commit()
    db.refresh(register)
    return register
