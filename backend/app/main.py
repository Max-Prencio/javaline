from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .models import *  # noqa: ensure all models are registered
from .routes import auth, purchases, approvals, inventory, sales

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Javaline API",
    description="Backend del sistema Javaline",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(purchases.router)
app.include_router(approvals.router)
app.include_router(inventory.router)
app.include_router(sales.router)


@app.get("/health")
def health():
    return {"status": "ok", "system": "javaline"}
