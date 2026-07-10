from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .database import engine, Base
from .models import *  # noqa: ensure all models are registered
from .routes import auth, purchases, approvals, inventory, sales, users, invoices, contacts, cash_registers, branches, approval_hierarchies, pocket, duplicates, ai_assistant, business_context, hr

Base.metadata.create_all(bind=engine)

# Migrations for new columns
try:
    from sqlalchemy import text as sa_text
    with engine.connect() as conn:
        conn.execute(sa_text("ALTER TABLE ats_candidates ADD COLUMN position_descr_file VARCHAR DEFAULT ''"))
        conn.commit()
except Exception:
    pass  # column already exists
try:
    from app.models.hr import HRPosition
except Exception:
    pass

app = FastAPI(
    title="Javaline API",
    description="Backend del sistema Javaline",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(purchases.router)
app.include_router(approvals.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(users.router)
app.include_router(invoices.router)
app.include_router(contacts.router)
app.include_router(cash_registers.router)
app.include_router(branches.router)
app.include_router(approval_hierarchies.router)
app.include_router(pocket.router)
app.include_router(duplicates.router)
app.include_router(ai_assistant.router)
app.include_router(business_context.router)
app.include_router(hr.router)

uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/health")
def health():
    return {"status": "ok", "system": "javaline"}
