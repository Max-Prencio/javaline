-- ══════════════════════════════════════════════════════════════════════
-- V3: Row Level Security (RLS)
-- Applied: 2026-07-23
--
-- Design:
--   • Regular users  → see only their own rows
--   • Admin/Manager  → see ALL rows within the same tenant
--   • Fail-closed    → if session vars not set, zero rows visible
--   • Superuser (postgres) → bypasses RLS automatically (migrations safe)
--
-- Session vars set by .NET interceptor on each connection:
--   app.current_tenant_id  — tenant the user belongs to
--   app.current_user_id    — the authenticated user's id
--   app.current_role       — 'admin' | 'manager' | 'service' | 'user' | 'employee'
--   'service' = background jobs (no HTTP context) — same full-tenant access as admin
-- ══════════════════════════════════════════════════════════════════════

-- ── Helpers ────────────────────────────────────────────────────────────
-- Inline macros used in every policy (avoids repeating logic)
-- is_admin_or_manager: role is admin or manager
-- same_tenant: tenant_id matches current session tenant
-- same_user(col): a column matches current session user

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 1: Add tenant_id to tables that are missing it
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE sales            ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE purchase_orders  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE contacts         ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE notifications    ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE tasks            ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE meetings         ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE cash_registers   ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE audit_logs       ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE stock_movements  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);

-- ── Backfill from users table via FK columns ────────────────────────
UPDATE invoices i
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE i.created_by = u.id AND i.tenant_id IS NULL;
UPDATE invoices SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE sales s
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE s.user_id = u.id AND s.tenant_id IS NULL;
UPDATE sales SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE purchase_orders po
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE po.created_by = u.id AND po.tenant_id IS NULL;
UPDATE purchase_orders SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE contacts SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE notifications n
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE n.user_id = u.id AND n.tenant_id IS NULL;
UPDATE notifications SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE tasks t
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE t.user_id = u.id AND t.tenant_id IS NULL;
UPDATE tasks SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE meetings m
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE m.user_id = u.id AND m.tenant_id IS NULL;
UPDATE meetings SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE cash_registers cr
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE cr.user_id = u.id AND cr.tenant_id IS NULL;
UPDATE cash_registers SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE audit_logs al
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE al.user_id = u.id AND al.tenant_id IS NULL;
UPDATE audit_logs SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE stock_movements sm
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE sm.user_id = u.id AND sm.tenant_id IS NULL;
UPDATE stock_movements SET tenant_id = 'default' WHERE tenant_id IS NULL;

UPDATE purchase_order_items poi
  SET tenant_id = po.tenant_id
  FROM purchase_orders po
  WHERE poi.order_id = po.id AND poi.tenant_id IS NULL;
UPDATE purchase_order_items SET tenant_id = 'default' WHERE tenant_id IS NULL;

-- ── Indexes on new columns ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ix_invoices_tenant_id2        ON invoices        (tenant_id);
CREATE INDEX IF NOT EXISTS ix_sales_tenant_id2           ON sales           (tenant_id);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_tenant2    ON purchase_orders  (tenant_id);
CREATE INDEX IF NOT EXISTS ix_contacts_tenant_id2        ON contacts        (tenant_id);
CREATE INDEX IF NOT EXISTS ix_notifications_tenant2      ON notifications   (tenant_id);
CREATE INDEX IF NOT EXISTS ix_tasks_tenant_id2           ON tasks           (tenant_id);
CREATE INDEX IF NOT EXISTS ix_meetings_tenant_id2        ON meetings        (tenant_id);
CREATE INDEX IF NOT EXISTS ix_cash_registers_tenant2     ON cash_registers  (tenant_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_tenant_id2      ON audit_logs      (tenant_id);
CREATE INDEX IF NOT EXISTS ix_stock_movements_tenant2    ON stock_movements (tenant_id);
CREATE INDEX IF NOT EXISTS ix_po_items_tenant2           ON purchase_order_items (tenant_id);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 2: Enable RLS on all target tables
-- FORCE: applies even to table owner (not superusers)
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 FORCE  ROW LEVEL SECURITY;

ALTER TABLE employees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees             FORCE  ROW LEVEL SECURITY;

ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              FORCE  ROW LEVEL SECURITY;

ALTER TABLE sales                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                 FORCE  ROW LEVEL SECURITY;

ALTER TABLE purchase_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders       FORCE  ROW LEVEL SECURITY;

ALTER TABLE purchase_order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items  FORCE  ROW LEVEL SECURITY;

ALTER TABLE contacts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts              FORCE  ROW LEVEL SECURITY;

ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         FORCE  ROW LEVEL SECURITY;

ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 FORCE  ROW LEVEL SECURITY;

ALTER TABLE meetings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings              FORCE  ROW LEVEL SECURITY;

ALTER TABLE cash_registers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers        FORCE  ROW LEVEL SECURITY;

ALTER TABLE stock_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements       FORCE  ROW LEVEL SECURITY;

ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            FORCE  ROW LEVEL SECURITY;

ALTER TABLE attendances           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances           FORCE  ROW LEVEL SECURITY;

ALTER TABLE payrolls              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrolls              FORCE  ROW LEVEL SECURITY;

ALTER TABLE vacations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations             FORCE  ROW LEVEL SECURITY;

ALTER TABLE ai_conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations      FORCE  ROW LEVEL SECURITY;

ALTER TABLE "RefreshTokens"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshTokens"       FORCE  ROW LEVEL SECURITY;

ALTER TABLE inventory             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory             FORCE  ROW LEVEL SECURITY;

ALTER TABLE pocket_notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pocket_notifications  FORCE  ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 3: Create RLS policies
--
-- Naming: rls_{table}
-- Pattern for user-isolated tables:
--   same_tenant AND (same_user OR is_admin_manager)
-- Fail-closed: tenant var empty → condition false → 0 rows
-- ══════════════════════════════════════════════════════════════════════

-- ── USERS: self or admin in same tenant ────────────────────────────
DROP POLICY IF EXISTS rls_users ON users;
CREATE POLICY rls_users ON users
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── EMPLOYEES: self (via user_id) or admin ─────────────────────────
DROP POLICY IF EXISTS rls_employees ON employees;
CREATE POLICY rls_employees ON employees
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── ATTENDANCES: via employee.user_id or admin ─────────────────────
DROP POLICY IF EXISTS rls_attendances ON attendances;
CREATE POLICY rls_attendances ON attendances
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
      OR employee_id IN (
        SELECT id FROM employees
        WHERE user_id = current_setting('app.current_user_id', true)
          AND tenant_id = current_setting('app.current_tenant_id', true)
      )
    )
  );

-- ── PAYROLLS: via employee.user_id or admin ────────────────────────
DROP POLICY IF EXISTS rls_payrolls ON payrolls;
CREATE POLICY rls_payrolls ON payrolls
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
      OR employee_id IN (
        SELECT id FROM employees
        WHERE user_id = current_setting('app.current_user_id', true)
          AND tenant_id = current_setting('app.current_tenant_id', true)
      )
    )
  );

-- ── VACATIONS: via employee.user_id or admin ───────────────────────
DROP POLICY IF EXISTS rls_vacations ON vacations;
CREATE POLICY rls_vacations ON vacations
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
      OR employee_id IN (
        SELECT id FROM employees
        WHERE user_id = current_setting('app.current_user_id', true)
          AND tenant_id = current_setting('app.current_tenant_id', true)
      )
    )
  );

-- ── INVOICES: creator or admin ─────────────────────────────────────
DROP POLICY IF EXISTS rls_invoices ON invoices;
CREATE POLICY rls_invoices ON invoices
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      created_by = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── SALES: creator or admin ────────────────────────────────────────
DROP POLICY IF EXISTS rls_sales ON sales;
CREATE POLICY rls_sales ON sales
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── PURCHASE ORDERS: creator or admin ─────────────────────────────
DROP POLICY IF EXISTS rls_purchase_orders ON purchase_orders;
CREATE POLICY rls_purchase_orders ON purchase_orders
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      created_by = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── PURCHASE ORDER ITEMS: inherits from parent order ───────────────
DROP POLICY IF EXISTS rls_po_items ON purchase_order_items;
CREATE POLICY rls_po_items ON purchase_order_items
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
      OR order_id IN (
        SELECT id FROM purchase_orders
        WHERE created_by = current_setting('app.current_user_id', true)
          AND tenant_id = current_setting('app.current_tenant_id', true)
      )
    )
  );

-- ── CONTACTS: all tenant members can see (shared CRM resource) ─────
DROP POLICY IF EXISTS rls_contacts ON contacts;
CREATE POLICY rls_contacts ON contacts
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
  );

-- ── NOTIFICATIONS: strictly personal ──────────────────────────────
DROP POLICY IF EXISTS rls_notifications ON notifications;
CREATE POLICY rls_notifications ON notifications
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND user_id = current_setting('app.current_user_id', true)
  );

-- ── TASKS: assigned_to or creator or admin ─────────────────────────
DROP POLICY IF EXISTS rls_tasks ON tasks;
CREATE POLICY rls_tasks ON tasks
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id    = current_setting('app.current_user_id', true)
      OR assigned_to = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── MEETINGS: creator or admin ─────────────────────────────────────
DROP POLICY IF EXISTS rls_meetings ON meetings;
CREATE POLICY rls_meetings ON meetings
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── CASH REGISTERS: owner or admin ────────────────────────────────
DROP POLICY IF EXISTS rls_cash_registers ON cash_registers;
CREATE POLICY rls_cash_registers ON cash_registers
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── STOCK MOVEMENTS: creator or admin ─────────────────────────────
DROP POLICY IF EXISTS rls_stock_movements ON stock_movements;
CREATE POLICY rls_stock_movements ON stock_movements
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── AUDIT LOGS: admin only ─────────────────────────────────────────
DROP POLICY IF EXISTS rls_audit_logs ON audit_logs;
CREATE POLICY rls_audit_logs ON audit_logs
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
  );

-- ── AI CONVERSATIONS: personal + admin ─────────────────────────────
DROP POLICY IF EXISTS rls_ai_conversations ON ai_conversations;
CREATE POLICY rls_ai_conversations ON ai_conversations
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

-- ── REFRESH TOKENS: strictly personal ─────────────────────────────
DROP POLICY IF EXISTS rls_refresh_tokens ON "RefreshTokens";
CREATE POLICY rls_refresh_tokens ON "RefreshTokens"
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    "UserId" = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

-- ── INVENTORY: all tenant members read; admin writes ───────────────
DROP POLICY IF EXISTS rls_inventory_read  ON inventory;
DROP POLICY IF EXISTS rls_inventory_write ON inventory;

CREATE POLICY rls_inventory_read ON inventory
  AS PERMISSIVE FOR SELECT TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
  );

CREATE POLICY rls_inventory_write ON inventory
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
  );

-- ── POCKET NOTIFICATIONS: personal (has user_id) ──────────────────
DROP POLICY IF EXISTS rls_pocket_notifications ON pocket_notifications;
CREATE POLICY rls_pocket_notifications ON pocket_notifications
  AS PERMISSIVE FOR ALL TO javaline_app
  USING (
    current_setting('app.current_tenant_id', true) <> ''
    AND tenant_id = current_setting('app.current_tenant_id', true)
    AND (
      user_id = current_setting('app.current_user_id', true)
      OR current_setting('app.current_role', true) IN ('admin', 'manager', 'service')
    )
  );

SELECT 'RLS applied successfully' AS result;
