import bcrypt as _bcrypt
from app.database import SessionLocal, engine, Base
from app.models import User, InventoryItem, PurchaseOrder, Approval, StockMovement, Sale
from datetime import datetime, timezone, timedelta
import uuid

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# --- USERS ---
if not db.query(User).first():
    users = [
        User(id=str(uuid.uuid4()), name="Admin", email="admin@javaline.com",
             password_hash=_bcrypt.hashpw(b"admin123", _bcrypt.gensalt()).decode(), role="admin"),
        User(id=str(uuid.uuid4()), name="Gerente", email="gerente@javaline.com",
             password_hash=_bcrypt.hashpw(b"gerente123", _bcrypt.gensalt()).decode(), role="manager"),
        User(id=str(uuid.uuid4()), name="Empleado", email="empleado@javaline.com",
             password_hash=_bcrypt.hashpw(b"empleado123", _bcrypt.gensalt()).decode(), role="employee"),
    ]
    db.add_all(users)
    db.commit()
    print(f"OK {len(users)} usuarios creados")

# --- INVENTORY ---
if not db.query(InventoryItem).first():
    items = [
        InventoryItem(name="Papel Bond 8.5x11", sku="SKU-PAP001", category="Papelería",
                      stock=500, min_stock=50, price=350, cost=280, unit="resma"),
        InventoryItem(name="Tóner HP 85A", sku="SKU-TON001", category="Tóner",
                      stock=15, min_stock=10, price=2500, cost=1900, unit="unidad"),
        InventoryItem(name="Carpetas Colgantes", sku="SKU-CAR001", category="Archivo",
                      stock=200, min_stock=30, price=120, cost=85, unit="caja"),
        InventoryItem(name="Bolígrafos Azules (caja)", sku="SKU-BOL001", category="Escritura",
                      stock=50, min_stock=20, price=450, cost=320, unit="caja"),
        InventoryItem(name="Clip Metálico (caja)", sku="SKU-CLI001", category="Oficina",
                      stock=100, min_stock=40, price=80, cost=55, unit="caja"),
    ]
    db.add_all(items)
    db.commit()
    print(f"OK {len(items)} productos creados")

# --- PURCHASE ORDERS ---
if not db.query(PurchaseOrder).first():
    admin = db.query(User).filter(User.role == "admin").first()
    orders = [
        PurchaseOrder(id="OC-001", supplier="Papelera Nacional", item="Papel Bond 8.5x11",
                      qty=100, total=35000, status="solicitud", created_by=admin.id),
        PurchaseOrder(id="OC-002", supplier="Suministros HP", item="Tóner HP 85A",
                      qty=5, total=12500, status="aprobado", created_by=admin.id),
        PurchaseOrder(id="OC-003", supplier="Office Depot", item="Carpetas Colgantes",
                      qty=50, total=6000, status="recibido", created_by=admin.id,
                      received_at=datetime.now(timezone.utc)),
    ]
    db.add_all(orders)
    db.commit()
    print(f"OK {len(orders)} ordenes de compra creadas")

db.close()
print("Seed completado")
