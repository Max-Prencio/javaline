-- ============================================================
-- Javaline Seed Data (PostgreSQL)
-- Idempotent: uses INSERT ... ON CONFLICT DO NOTHING
-- ============================================================

-- ===================== USERS =====================
INSERT INTO users (id, name, email, password_hash, role, status, created_at)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'Admin Javaline',
   'admin@javaline.com',
   '$2b$12$tbfXHL1PxH88XGkbCWlVsuUZQUAnvSuBoZeUv7PDpSzV8fWycoM6u',
   'admin',
   'active',
   NOW()),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'Gerente Javaline',
   'gerente@javaline.com',
   '$2b$12$KxVz9L4rGJz3d3k9q2h5vOx7yT8u9i0o1p2a3s4d5f6g7h8j9k0l',
   'manager',
   'active',
   NOW()),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803',
   'Empleado Javaline',
   'empleado@javaline.com',
   '$2b$12$LmWz8K5sHIa4e4l0r3i6wPy8zA9v0j1k2l3m4n5o6p7q8r9s0t1u2',
   'employee',
   'active',
   NOW())
ON CONFLICT (email) DO NOTHING;

-- ===================== INVENTORY =====================
INSERT INTO inventory (id, name, sku, stock, min_stock, price, cost, category, unit, active, created_at)
VALUES
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'Laptop Dell XPS 15',
   'SKU-LAP001',
   10, 2, 45000, 38000,
   'Laptops', 'pieza', true, NOW()),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'Mouse Logitech MX Master',
   'SKU-MOU001',
   25, 5, 3500, 2800,
   'Periféricos', 'pieza', true, NOW()),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567803',
   'Teclado Mecánico Keychron',
   'SKU-TEC001',
   15, 3, 4200, 3200,
   'Periféricos', 'pieza', true, NOW()),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567804',
   'Monitor Samsung 27" 4K',
   'SKU-MON001',
   8, 2, 28000, 22000,
   'Monitores', 'pieza', true, NOW()),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567805',
   'Audífonos Sony WH-1000XM5',
   'SKU-AUD001',
   3, 2, 12000, 9500,
   'Audio', 'pieza', true, NOW())
ON CONFLICT (sku) DO NOTHING;

-- ===================== CONTACTS =====================
INSERT INTO contacts (id, name, company, rnc, type, active, created_at)
VALUES
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'Distribuidora Ortiz',
   'Distribuidora Ortiz',
   '123456789',
   'cliente',
   true, NOW()),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'TechSupply SRL',
   'TechSupply SRL',
   NULL,
   'proveedor',
   true, NOW()),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567803',
   'María González',
   NULL,
   NULL,
   'cliente',
   true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ===================== BRANCHES =====================
INSERT INTO branches (id, name, address, active, created_at)
VALUES
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'Sede Principal',
   'Santo Domingo',
   true, NOW()),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'Sucursal Norte',
   'Santiago',
   true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ===================== APPROVAL HIERARCHIES =====================
INSERT INTO approval_hierarchies (id, currency, role, min_amount, max_amount, created_by, created_at)
VALUES
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'DOP', 'admin', 0, 500000,
   '6cbfe35a-6e0a-46a5-bb4d-1f17b58f8825', NOW()),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'DOP', 'manager', 0, 100000,
   '6cbfe35a-6e0a-46a5-bb4d-1f17b58f8825', NOW()),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567803',
   'USD', 'admin', 0, 20000,
   '6cbfe35a-6e0a-46a5-bb4d-1f17b58f8825', NOW())
ON CONFLICT (id) DO NOTHING;

-- ===================== PURCHASE ORDER =====================
INSERT INTO purchase_orders (id, supplier, item, qty, currency, total, status, created_by, created_at)
VALUES
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'TechSupply SRL',
   'Laptop Dell XPS 15',
   5,
   'DOP',
   190000,
   'pending',
   '6cbfe35a-6e0a-46a5-bb4d-1f17b58f8825',
   NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_order_items (id, order_id, product_name, sku, quantity, unit_price, total)
VALUES
  ('g1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'f1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'Laptop Dell XPS 15',
   'SKU-LAP001',
   5,
   38000,
   190000)
ON CONFLICT (id) DO NOTHING;

-- ===================== TAX CONFIG =====================
INSERT INTO tax_config (id, name, rate, type, active, created_at)
VALUES
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'ITBIS 16%', 16, 'ITBIS', true, NOW()),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'ITBIS 18%', 18, 'ITBIS', true, NOW()),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567803',
   'Exento', 0, 'Exento', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ===================== DISCOUNT CONFIG =====================
INSERT INTO discount_config (id, name, type, value, active, created_at)
VALUES
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'Descuento General', 'percentage', 10, true, NOW()),
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'Descuento por Volumen', 'percentage', 15, true, NOW()),
   ('i1b2c3d4-e5f6-7890-abcd-ef1234567803',
   'Descuento Fijo', 'fixed', 500, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ===================== NCF SEQUENCES =====================
INSERT INTO "NcfSequences" ("id","NcfType","Name","CurrentSequence","MaxSequence","Active","TenantId","created_at")
SELECT gen_random_uuid()::text, t.type, t.name, 1, 9999999, true, '', NOW()
FROM (VALUES
  ('B01','Crédito Fiscal'),
  ('B02','Consumidor Final'),
  ('B04','Nota de Crédito'),
  ('B14','Régimen Especial'),
  ('B15','Gubernamental'),
  ('B16','Exportaciones'),
  ('B34','Nota de Débito')
) AS t(type, name)
WHERE NOT EXISTS (SELECT 1 FROM "NcfSequences" LIMIT 1);

-- ===================== PETTY CASH FUND =====================
INSERT INTO "PettyCashFunds" ("id","Name","InitialBalance","CurrentBalance","Currency","Active","TenantId","created_at")
SELECT gen_random_uuid()::text, 'Caja Chica Principal', 5000, 5000, 'DOP', true, '', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PettyCashFunds" LIMIT 1);

-- ===================== CHART OF ACCOUNTS =====================
INSERT INTO "ChartAccounts" ("id","Code","Name","Type","ParentCode","Level","Active","TenantId","created_at")
SELECT gen_random_uuid()::text, t.code, t.name, t.type, t.parent, t.level, true, '', NOW()
FROM (VALUES
  ('1000','Activos','asset',NULL,1),
  ('1100','Activo Corriente','asset','1000',2),
  ('1101','Caja','asset','1100',3),
  ('1102','Caja Chica','asset','1100',3),
  ('1103','Banco Nacional','asset','1100',3),
  ('1200','Cuentas por Cobrar','asset','1100',3),
  ('1300','Inventario','asset','1100',3),
  ('1400','ITBIS Pagado por Anticipado','asset','1100',3),
  ('1500','Activo No Corriente','asset','1000',2),
  ('1501','Activos Fijos','asset','1500',3),
  ('1502','Depreciación Acumulada','asset','1500',3),
  ('2000','Pasivos','liability',NULL,1),
  ('2100','Pasivo Corriente','liability','2000',2),
  ('2101','Cuentas por Pagar','liability','2100',3),
  ('2102','ITBIS por Pagar','liability','2100',3),
  ('2103','ISR por Pagar','liability','2100',3),
  ('2104','Sueldos por Pagar','liability','2100',3),
  ('3000','Capital','equity',NULL,1),
  ('3001','Capital Social','equity','3000',2),
  ('3002','Utilidades Retenidas','equity','3000',2),
  ('4000','Ingresos','income',NULL,1),
  ('4001','Ingresos por Ventas','income','4000',2),
  ('4002','Otros Ingresos','income','4000',2),
  ('5000','Costos','cost',NULL,1),
  ('5001','Costo de Ventas','cost','5000',2),
  ('6000','Gastos','expense',NULL,1),
  ('6001','Gastos de Administración','expense','6000',2),
  ('6002','Gastos de Ventas','expense','6000',2),
  ('6003','Gastos Financieros','expense','6000',2),
  ('6004','Depreciación','expense','6000',2)
) AS t(code, name, type, parent, level)
WHERE NOT EXISTS (SELECT 1 FROM "ChartAccounts" LIMIT 1);
