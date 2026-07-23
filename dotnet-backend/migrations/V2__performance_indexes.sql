-- Performance indexes for high-traffic tables
-- Applied: 2026-07-23

-- INVOICES
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invoices_tenant_id         ON invoices (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invoices_type              ON invoices (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invoices_date_desc         ON invoices (date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invoices_status_date       ON invoices (status, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invoices_client_id         ON invoices (client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invoices_created_by        ON invoices (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invoices_created_at        ON invoices (created_at DESC);

-- CONTACTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_contacts_tenant_id         ON contacts (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_contacts_email             ON contacts (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_contacts_type              ON contacts (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_contacts_active            ON contacts (active);

-- SALES
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_sales_tenant_id            ON sales (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_sales_user_created_at      ON sales (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_sales_created_at           ON sales (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_sales_user_id              ON sales (user_id);

-- PURCHASE ORDERS + ITEMS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_purchase_orders_tenant_id      ON purchase_orders (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_purchase_orders_created_by     ON purchase_orders (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_purchase_orders_created_at     ON purchase_orders (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_purchase_order_items_order_id  ON purchase_order_items (order_id);

-- STOCK MOVEMENTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_stock_movements_tenant_id      ON stock_movements (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_stock_movements_date_desc      ON stock_movements (date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_stock_movements_product_date   ON stock_movements (product_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_stock_movements_user_id        ON stock_movements (user_id);

-- NOTIFICATIONS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_notifications_user_id          ON notifications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_notifications_user_read        ON notifications (user_id, read);

-- TASKS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_tasks_user_id                  ON tasks (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_tasks_status                   ON tasks (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_tasks_assigned_to              ON tasks (assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_tasks_due_date                 ON tasks (due_date);

-- MEETINGS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_meetings_user_id               ON meetings (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_meetings_start_date            ON meetings (start_date);

-- AUDIT LOGS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_audit_logs_tenant_id           ON audit_logs (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_audit_logs_user_id             ON audit_logs (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_audit_logs_created_at          ON audit_logs (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_audit_logs_entity              ON audit_logs (entity_type, entity_id);

-- CASH REGISTERS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_cash_registers_tenant_id       ON cash_registers (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_cash_registers_status          ON cash_registers (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_cash_registers_user_status     ON cash_registers (user_id, status);

-- APPROVALS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_approvals_status               ON approvals (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_approvals_approved_by          ON approvals (approved_by);

-- ATTENDANCES
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_attendances_employee_id        ON attendances (employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_attendances_tenant_employee    ON attendances (tenant_id, employee_id);

-- REFRESH TOKENS
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_refresh_tokens_expires_at      ON "RefreshTokens" ("ExpiresAt");
