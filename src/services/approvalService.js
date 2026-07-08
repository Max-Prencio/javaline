import db from './db'
function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

const service = {
  async listHierarchies(filters = {}) { await delay(); let items = db.getAll('approvalHierarchies'); if (filters.currency) items = items.filter(h => h.currency === filters.currency); return items },

  async getHierarchy(id) { await delay(); return db.getById('approvalHierarchies', id) },

  async createHierarchy(data, userId) { await delay(400); const item = db.insert('approvalHierarchies', data); db.addAudit({action:'create',store:'approvalHierarchies',detail:`Jerarquía creada: ${data.currency} - ${data.role}`,userId}); return item },

  async updateHierarchy(id, changes, userId) { await delay(300); const item = db.update('approvalHierarchies', id, changes); if (!item) throw new Error('Jerarquía no encontrada'); db.addAudit({action:'update',store:'approvalHierarchies',detail:`Jerarquía actualizada: ${id}`,userId}); return item },

  async removeHierarchy(id, userId) { await delay(300); db.remove('approvalHierarchies', id); db.addAudit({action:'delete',store:'approvalHierarchies',detail:`Jerarquía eliminada: ${id}`,userId}); return true },

  async canApprove(currency, amount, userRole) { await delay(100);
    const rules = db.query('approvalHierarchies', h => h.currency === currency && h.active !== false)
    const matching = rules.filter(r => amount >= r.minAmount && amount <= r.maxAmount)
    if (matching.length === 0) return { allowed: false, reason: 'No hay regla para este monto', requiredRole: null }
    const allowed = matching.some(r => r.role === userRole || r.role === 'admin')
    return { allowed, requiredRole: matching[0].role, requiredLevel: matching[0].level }
  },

  async getDefaultHierarchy(currency) { await delay();
    const rules = db.query('approvalHierarchies', h => h.currency === currency && h.active !== false).sort((a, b) => a.minAmount - b.minAmount)
    if (rules.length > 0) return rules
    const defaultRules = [
      { id: `rule-${Date.now()}`, currency, role: 'Empleado', level: 1, minAmount: 0, maxAmount: 10000, active: true },
      { id: `rule-${Date.now()+1}`, currency, role: 'Gerente', level: 2, minAmount: 10001, maxAmount: 100000, active: true },
      { id: `rule-${Date.now()+2}`, currency, role: 'Administrador', level: 3, minAmount: 100001, maxAmount: 999999999, active: true },
    ]
    defaultRules.forEach(r => db.insert('approvalHierarchies', r))
    return defaultRules
  },
}

export default service
