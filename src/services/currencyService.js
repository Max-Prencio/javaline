import db from './db'
function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

const service = {
  async list() { await delay(); return db.getAll('currencies') },

  async getById(id) { await delay(); return db.getById('currencies', id) },

  async getDefault() { await delay(); const c = db.query('currencies', c => c.isDefault); return c[0] || null },

  async create(data, userId) { await delay(400); const item = db.insert('currencies', data); db.addAudit({action:'create',store:'currencies',detail:`Moneda creada: ${data.code}`,userId}); return item },

  async update(id, changes, userId) { await delay(300); const item = db.update('currencies', id, changes); if (!item) throw new Error('Moneda no encontrada'); db.addAudit({action:'update',store:'currencies',detail:`Moneda actualizada: ${id}`,userId}); return item },

  async remove(id, userId) { await delay(300); db.remove('currencies', id); db.addAudit({action:'delete',store:'currencies',detail:`Moneda eliminada: ${id}`,userId}); return true },

  async convert(amount, fromCode, toCode) { await delay(100); const currencies = db.getAll('currencies'); const from = currencies.find(c => c.code === fromCode); const to = currencies.find(c => c.code === toCode); if (!from || !to) throw new Error('Moneda no encontrada'); return (amount / from.exchangeRate) * to.exchangeRate },
}

export default service
