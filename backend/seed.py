import bcrypt as _bcrypt
from app.database import SessionLocal, engine, Base
from app.models import User, InventoryItem, PurchaseOrder, Approval, StockMovement, Sale, Invoice, Contact, CashRegister, Branch, ApprovalHierarchy
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

# --- CONTACTS ---
if not db.query(Contact).first():
    contacts = [
        Contact(name="Distribuidora Ortiz", company="Ortiz SRL", rnc="131-45678-9", type="client", email="info@ortiz.do", phone="809-555-0101"),
        Contact(name="Papelera Nacional", company="Papelera Nacional SRL", rnc="101-23456-7", type="supplier", email="ventas@papelera.do", phone="809-555-0202"),
        Contact(name="Tech Solutions", company="Tech Solutions SA", rnc="131-87654-3", type="client", email="contacto@techsol.do", phone="809-555-0303"),
    ]
    db.add_all(contacts)
    db.commit()
    print(f"OK {len(contacts)} contactos creados")

# --- INVOICES ---
if not db.query(Invoice).first():
    invoices = [
        Invoice(type="client", client_name="Distribuidora Ortiz", rnc="131-45678-9",
                date="2026-07-01", due_date="2026-07-15", currency="DOP",
                items=[{"productName":"Papel Bond","qty":10,"price":350,"total":3500}],
                subtotal=3500, taxable_base=3500, tax=630, total=4130, status="pending"),
        Invoice(type="client", client_name="Tech Solutions", rnc="131-87654-3",
                date="2026-07-05", due_date="2026-07-20", currency="USD",
                items=[{"productName":"Tóner HP","qty":2,"price":2500,"total":5000}],
                subtotal=5000, taxable_base=5000, tax=900, total=5900, status="paid"),
    ]
    db.add_all(invoices)
    db.commit()
    print(f"OK {len(invoices)} facturas creadas")

# --- BRANCHES ---
if not db.query(Branch).first():
    branches = [
        Branch(name="Casa Matriz", address="Av. Abraham Lincoln 105, Santo Domingo", phone="809-555-0001"),
        Branch(name="Sucursal Santiago", address="Calle del Sol 45, Santiago", phone="809-555-0002"),
    ]
    db.add_all(branches)
    db.commit()
    print(f"OK {len(branches)} sucursales creadas")

# --- APPROVAL HIERARCHIES ---
if not db.query(ApprovalHierarchy).first():
    hierarchies = [
        ApprovalHierarchy(currency="DOP", role="employee", min_amount=0, max_amount=50000),
        ApprovalHierarchy(currency="DOP", role="manager", min_amount=50001, max_amount=200000),
        ApprovalHierarchy(currency="DOP", role="admin", min_amount=200001, max_amount=999999),
        ApprovalHierarchy(currency="USD", role="employee", min_amount=0, max_amount=1000),
        ApprovalHierarchy(currency="USD", role="manager", min_amount=1001, max_amount=5000),
        ApprovalHierarchy(currency="USD", role="admin", min_amount=5001, max_amount=999999),
    ]
    db.add_all(hierarchies)
    db.commit()
    print(f"OK {len(hierarchies)} jerarquías de aprobación creadas")

db.close()
print("Seed completado")
