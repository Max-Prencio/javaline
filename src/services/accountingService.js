import db from './db'
function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

const service = {
  async listAccounts(filters = {}) { await delay(); let items = db.getAll('accounts'); if (filters.type) items = items.filter(a => a.type === filters.type); if (filters.active !== undefined) items = items.filter(a => a.active === filters.active); return items },

  async getAccount(id) { await delay(); return db.getById('accounts', id) },

  async createAccount(data, userId) { await delay(400); const item = db.insert('accounts', data); db.addAudit({action:'create',store:'accounts',detail:`Cuenta creada: ${data.code} - ${data.name}`,userId}); return item },

  async updateAccount(id, changes, userId) { await delay(300); const item = db.update('accounts', id, changes); if (!item) throw new Error('Cuenta no encontrada'); db.addAudit({action:'update',store:'accounts',detail:`Cuenta actualizada: ${id}`,userId}); return item },

  async removeAccount(id, userId) { await delay(300); db.remove('accounts', id); db.addAudit({action:'delete',store:'accounts',detail:`Cuenta eliminada: ${id}`,userId}); return true },

  async getAccountsByType(type) { await delay(); return db.query('accounts', a => a.type === type && a.active) },

  // --- Journal Entries ---
  async listJournalEntries(filters = {}) { await delay(); let items = db.getAll('journalEntries'); if (filters.fromDate) items = items.filter(e => e.date >= filters.fromDate); if (filters.toDate) items = items.filter(e => e.date <= filters.toDate); return items.sort((a, b) => new Date(b.date) - new Date(a.date)) },

  async getJournalEntry(id) { await delay(); return db.getById('journalEntries', id) },

  async createJournalEntry(data, userId) { await delay(400);
    if (!data.lines || data.lines.length === 0) throw new Error('El asiento debe tener al menos una línea');
    const totalDebit = data.lines.reduce((s, l) => s + (l.debit || 0), 0)
    const totalCredit = data.lines.reduce((s, l) => s + (l.credit || 0), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error('El asiento no está balanceado (débitos ≠ créditos)');
    const item = db.insert('journalEntries', { ...data, totalDebit, totalCredit, status: 'posted' })
    db.addAudit({action:'create',store:'journalEntries',detail:`Asiento contable creado: ${item.id}`,userId})
    return item
  },

  async getBalanceSheet(toDate) { await delay(300);
    const entries = db.getAll('journalEntries').filter(e => e.status === 'posted' && e.date <= toDate)
    const accounts = db.getAll('accounts')
    const balances = {}
    accounts.forEach(a => { balances[a.id] = 0 })
    entries.forEach(e => { e.lines.forEach(l => { if (l.accountId) { balances[l.accountId] = (balances[l.accountId] || 0) + (l.debit || 0) - (l.credit || 0) } }) })
    return accounts.map(a => ({ ...a, balance: balances[a.id] || 0, balanceFormatted: (balances[a.id] || 0).toLocaleString('es-DO', {style:'currency',currency:'DOP'}) }))
  },

  async getIncomeStatement(fromDate, toDate) { await delay(300);
    const entries = db.getAll('journalEntries').filter(e => e.status === 'posted' && e.date >= fromDate && e.date <= toDate)
    const accounts = db.getAll('accounts')
    const incomeAccounts = accounts.filter(a => a.type === 'ingreso')
    const expenseAccounts = accounts.filter(a => a.type === 'gasto')
    const getBalance = (accts) => { return accts.map(a => { const balance = entries.reduce((s, e) => { const line = e.lines.find(l => l.accountId === a.id); return s + (line ? (line.credit || 0) - (line.debit || 0) : 0) }, 0); return { ...a, balance } }) }
    return { income: getBalance(incomeAccounts), expense: getBalance(expenseAccounts) }
  },

  // --- Client Portfolio ---
  async getClientPortfolio() { await delay(); const contacts = db.getAll('contacts'); return contacts.filter(c => c.stage === 'cliente') },
}

export default service
