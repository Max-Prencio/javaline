import db from './db'
import api from './apiClient'

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

async function tryApi(fn) {
  try { return await fn() } catch { return null }
}

const service = {
  async listAccounts(filters = {}) { await delay(); let items = db.getAll('accounts'); if (filters.type) items = items.filter(a => a.type === filters.type); if (filters.active !== undefined) items = items.filter(a => a.active === filters.active); return items },
  async getAccount(id) { await delay(); return db.getById('accounts', id) },
  async createAccount(data, userId) { await delay(400); const item = db.insert('accounts', data); db.addAudit({action:'create',store:'accounts',detail:`Cuenta creada: ${data.code} - ${data.name}`,userId}); return item },
  async updateAccount(id, changes, userId) { await delay(300); const item = db.update('accounts', id, changes); if (!item) throw new Error('Cuenta no encontrada'); db.addAudit({action:'update',store:'accounts',detail:`Cuenta actualizada: ${id}`,userId}); return item },
  async removeAccount(id, userId) { await delay(300); db.remove('accounts', id); db.addAudit({action:'delete',store:'accounts',detail:`Cuenta eliminada: ${id}`,userId}); return true },
  async getAccountsByType(type) { await delay(); return db.query('accounts', a => a.type === type && a.active) },

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
  async reverseJournalEntry(id, reason) {
    const result = await tryApi(() => api.post(`/accounting/journal/${id}/reverse`, { reason }))
    if (result) return result
    const original = db.getById('journalEntries', id)
    if (!original) throw new Error('Asiento no encontrado')
    if (original.status === 'reversed') throw new Error('Este asiento ya fue reversado')
    db.update('journalEntries', id, { status: 'reversed' })
    const reversedLines = (original.lines || []).map(l => ({
      ...l,
      debit: l.credit || 0,
      credit: l.debit || 0,
    }))
    return db.insert('journalEntries', {
      ...original,
      id: undefined,
      lines: reversedLines,
      status: 'posted',
      description: `Reversa de ${original.reference || original.id}: ${reason}`,
      reversesId: id,
      reference: undefined,
    })
  },

  async getBalanceSheet(toDate) { await delay(300);
    const entries = db.getAll('journalEntries').filter(e => e.status === 'posted' && e.date <= toDate)
    const accounts = db.getAll('accounts')
    // Normal balance: activo/gasto → debit; pasivo/patrimonio/ingreso → credit
    const debitNormal = new Set(['activo', 'gasto'])
    const rawBalances = {}
    accounts.forEach(a => { rawBalances[a.id] = 0 })
    entries.forEach(e => { e.lines.forEach(l => { if (l.accountId) { rawBalances[l.accountId] = (rawBalances[l.accountId] || 0) + (l.debit || 0) - (l.credit || 0) } }) })
    return accounts.map(a => {
      const raw = rawBalances[a.id] || 0
      const balance = debitNormal.has(a.type) ? raw : -raw
      return { ...a, balance, balanceFormatted: balance.toLocaleString('es-DO', {style:'currency',currency:'DOP'}) }
    })
  },
  async getIncomeStatement(fromDate, toDate) { await delay(300);
    const entries = db.getAll('journalEntries').filter(e => e.status === 'posted' && e.date >= fromDate && e.date <= toDate)
    const accounts = db.getAll('accounts')
    const incomeAccounts = accounts.filter(a => a.type === 'ingreso')
    const expenseAccounts = accounts.filter(a => a.type === 'gasto')
    const getBalance = (accts) => { return accts.map(a => { const balance = entries.reduce((s, e) => { const line = e.lines.find(l => l.accountId === a.id); return s + (line ? (line.credit || 0) - (line.debit || 0) : 0) }, 0); return { ...a, balance } }) }
    return { income: getBalance(incomeAccounts), expense: getBalance(expenseAccounts) }
  },
  async getClientPortfolio() { await delay(); const contacts = db.getAll('contacts'); return contacts.filter(c => c.stage === 'cliente') },

  // ── Chart of Accounts via API ──
  async getChartOfAccounts(search, type) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    const qs = params.toString()
    return (await tryApi(() => api.get(`/accounting/accounts${qs ? '?' + qs : ''}`)))
      ?? db.getAll('accounts').filter(a => a.active !== false)
  },

  // ── Receivables ──
  async getReceivables(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return (await tryApi(() => api.get(`/accounting/receivables?${params}`)))
      ?? db.getAll('accountsReceivable') ?? []
  },
  async createReceivable(data) {
    return (await tryApi(() => api.post('/accounting/receivables', data)))
      ?? db.insert('accountsReceivable', { ...data, paid: 0, status: 'pending', paymentsJson: '[]' })
  },
  async payReceivable(id, paymentData) {
    return (await tryApi(() => api.post(`/accounting/receivables/${id}/pay`, paymentData)))
      ?? (() => {
        const rec = db.getById('accountsReceivable', id)
        if (!rec) throw new Error('No encontrado')
        const payments = [...(JSON.parse(rec.paymentsJson || '[]')), paymentData]
        const paid = payments.reduce((s, p) => s + (p.amount || 0), 0)
        const status = paid >= rec.amount ? 'paid' : paid > 0 ? 'partial' : 'pending'
        return db.update('accountsReceivable', id, { paymentsJson: JSON.stringify(payments), paid, status })
      })()
  },
  async getReceivablesAging() {
    return (await tryApi(() => api.get('/accounting/receivables/aging')))
      ?? (() => {
        const items = (db.getAll('accountsReceivable') ?? []).filter(r => r.status !== 'paid')
        const today = new Date()
        const buckets = { current: { count: 0, total: 0 }, '1-30d': { count: 0, total: 0 }, '31-60d': { count: 0, total: 0 }, '61-90d': { count: 0, total: 0 }, '90+d': { count: 0, total: 0 } }
        items.forEach(r => {
          const days = r.dueDate ? Math.max(0, Math.floor((today - new Date(r.dueDate)) / 86400000)) : 999
          const key = days <= 0 ? 'current' : days <= 30 ? '1-30d' : days <= 60 ? '31-60d' : days <= 90 ? '61-90d' : '90+d'
          buckets[key].count++
          buckets[key].total += (r.amount || 0) - (r.paid || 0)
        })
        return buckets
      })()
  },

  // ── Payables ──
  async getPayables(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return (await tryApi(() => api.get(`/accounting/payables?${params}`)))
      ?? db.getAll('accountsPayable') ?? []
  },
  async createPayable(data) {
    return (await tryApi(() => api.post('/accounting/payables', data)))
      ?? db.insert('accountsPayable', { ...data, paid: 0, status: 'pending', paymentsJson: '[]' })
  },
  async payPayable(id, paymentData) {
    return (await tryApi(() => api.post(`/accounting/payables/${id}/pay`, paymentData)))
      ?? (() => {
        const rec = db.getById('accountsPayable', id)
        if (!rec) throw new Error('No encontrado')
        const payments = [...(JSON.parse(rec.paymentsJson || '[]')), paymentData]
        const paid = payments.reduce((s, p) => s + (p.amount || 0), 0)
        const status = paid >= rec.amount ? 'paid' : paid > 0 ? 'partial' : 'pending'
        return db.update('accountsPayable', id, { paymentsJson: JSON.stringify(payments), paid, status })
      })()
  },
  async getPayablesAging() {
    return (await tryApi(() => api.get('/accounting/payables/aging')))
      ?? (() => {
        const items = (db.getAll('accountsPayable') ?? []).filter(p => p.status !== 'paid')
        const today = new Date()
        const buckets = { current: { count: 0, total: 0 }, '1-30d': { count: 0, total: 0 }, '31-60d': { count: 0, total: 0 }, '61-90d': { count: 0, total: 0 }, '90+d': { count: 0, total: 0 } }
        items.forEach(p => {
          const days = p.dueDate ? Math.max(0, Math.floor((today - new Date(p.dueDate)) / 86400000)) : 999
          const key = days <= 0 ? 'current' : days <= 30 ? '1-30d' : days <= 60 ? '31-60d' : days <= 90 ? '61-90d' : '90+d'
          buckets[key].count++
          buckets[key].total += (p.amount || 0) - (p.paid || 0)
        })
        return buckets
      })()
  },

  // ── Notes ──
  async getDebitNotes(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return (await tryApi(() => api.get(`/accounting/debit-notes?${params}`)))
      ?? db.getAll('debitNotes') ?? []
  },
  async createDebitNote(data) {
    const result = await tryApi(() => api.post('/accounting/debit-notes', data))
    if (result) return result
    const ncfSeqs = db.getAll('ncf_sequences') ?? []
    const seq = ncfSeqs.find(s => s.type === 'B34')
    const ncf = seq ? `B34${String(seq.sequence).padStart(10, '0')}` : 'B34-LOCAL'
    if (seq) db.update('ncf_sequences', seq.id, { sequence: seq.sequence + 1 })
    return db.insert('debitNotes', { ...data, ncf, ncfType: 'B34', status: 'active' })
  },
  async getCreditNotes(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return (await tryApi(() => api.get(`/accounting/credit-notes?${params}`)))
      ?? db.getAll('creditNotes') ?? []
  },
  async createCreditNote(data) {
    const result = await tryApi(() => api.post('/accounting/credit-notes', data))
    if (result) return result
    const ncfSeqs = db.getAll('ncf_sequences') ?? []
    const seq = ncfSeqs.find(s => s.type === 'B04')
    const ncf = seq ? `B04${String(seq.sequence).padStart(10, '0')}` : 'B04-LOCAL'
    if (seq) db.update('ncf_sequences', seq.id, { sequence: seq.sequence + 1 })
    return db.insert('creditNotes', { ...data, ncf, ncfType: 'B04', status: 'active' })
  },

  // ── Checks ──
  async getChecks(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return (await tryApi(() => api.get(`/accounting/checks?${params}`)))
      ?? db.getAll('checks') ?? []
  },
  async createCheck(data) {
    return (await tryApi(() => api.post('/accounting/checks', data)))
      ?? db.insert('checks', { ...data, status: 'pendiente' })
  },
  async updateCheckStatus(id, status) {
    return (await tryApi(() => api.put(`/accounting/checks/${id}/status`, { status })))
      ?? db.update('checks', id, { status })
  },

  // ── Petty Cash ──
  async getPettyCashFunds() {
    return (await tryApi(() => api.get('/accounting/petty-cash')))
      ?? db.getAll('petty_cash_funds') ?? []
  },
  async getPettyCashMovements(fundId) {
    return (await tryApi(() => api.get(`/accounting/petty-cash/${fundId}/movements`)))
      ?? (db.getAll('pettyCash') ?? []).filter(m => m.fundId === fundId)
  },
  async addPettyCashMovement(fundId, data) {
    const result = await tryApi(() => api.post(`/accounting/petty-cash/${fundId}/movements`, data))
    if (result) return result
    const fund = (db.getAll('petty_cash_funds') ?? []).find(f => f.id === fundId)
    if (!fund) throw new Error('Fondo no encontrado')
    if (data.type === 'egreso' && (fund.balance || fund.currentBalance || 0) < data.amount) throw new Error('Saldo insuficiente')
    const bal = fund.balance || fund.currentBalance || 0
    const newBalance = data.type === 'egreso' ? bal - data.amount : bal + data.amount
    db.update('petty_cash_funds', fundId, { balance: newBalance, currentBalance: newBalance })
    return db.insert('pettyCash', { ...data, fundId, balanceAfter: newBalance })
  },
  async reconcilePettyCash(fundId, concept) {
    return (await tryApi(() => api.post(`/accounting/petty-cash/${fundId}/reconcile`, { concept })))
      ?? (() => {
        const fund = (db.getAll('petty_cash_funds') ?? []).find(f => f.id === fundId)
        if (!fund) throw new Error('Fondo no encontrado')
        const bal = fund.balance || fund.currentBalance || 0
        const initBal = fund.initialBalance || fund.InitialBalance || 5000
        db.update('petty_cash_funds', fundId, { balance: initBal, currentBalance: initBal })
        return db.insert('pettyCash', { fundId, type: 'reposicion', concept: `Reposición: ${concept}`, amount: initBal - bal, balanceAfter: initBal, date: new Date().toISOString().slice(0,10) })
      })()
  },

  // ── Fixed Assets ──
  async getFixedAssets() {
    return (await tryApi(() => api.get('/accounting/fixed-assets')))
      ?? db.getAll('fixedAssets') ?? []
  },
  async createFixedAsset(data) {
    return (await tryApi(() => api.post('/accounting/fixed-assets', data)))
      ?? db.insert('fixedAssets', { ...data, status: 'active' })
  },
  calculateMonthlyDepreciation(asset) {
    if (!asset || (asset.usefulLifeYears || 0) <= 0) return 0
    return ((asset.acquisitionCost || asset.AcquisitionCost || 0) - (asset.salvageValue || asset.SalvageValue || 0)) / ((asset.usefulLifeYears || asset.UsefulLifeYears || 1) * 12)
  },
  async disposeAsset(id, data) {
    return (await tryApi(() => api.put(`/accounting/fixed-assets/${id}/dispose`, data)))
      ?? db.update('fixedAssets', id, { status: 'disposed', ...data })
  },

  // ── Income & Cost Records ──
  async getIncomeRecords(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return (await tryApi(() => api.get(`/accounting/income-records?${params}`)))
      ?? db.getAll('income_records') ?? []
  },
  async createIncomeRecord(data) {
    return (await tryApi(() => api.post('/accounting/income-records', data)))
      ?? db.insert('income_records', data)
  },
  async getCostRecords(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return (await tryApi(() => api.get(`/accounting/cost-records?${params}`)))
      ?? db.getAll('cost_records') ?? []
  },
  async createCostRecord(data) {
    return (await tryApi(() => api.post('/accounting/cost-records', data)))
      ?? db.insert('cost_records', data)
  },

  // ── Reports ──
  async generate607(period) {
    return (await tryApi(() => api.get(`/accounting/report/607?period=${period}`)))
      ?? (() => {
        const [year, month] = [period.slice(0,4), period.slice(4,6)]
        const invoices = db.getAll('invoices') ?? []
        return invoices.filter(inv => {
          const d = new Date(inv.date)
          return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month) && inv.ncf
        }).map(inv => ({
          rnc: inv.rnc || '', tipoIdentificacion: inv.rnc?.length === 11 ? '1' : '2',
          ncf: inv.ncf || '', fechaNcf: inv.date ? inv.date.replace(/-/g,'') : '',
          montoFacturado: (inv.subtotal || 0).toFixed(2), itbisFacturado: (inv.tax || 0).toFixed(2),
          itbisRetenidoTerceros: '0.00', itbisPercibido: '0.00', totalItbis: (inv.tax || 0).toFixed(2),
          montoPropina: '0.00', efectivo: (inv.total || 0).toFixed(2), tarjeta: '0.00',
          chequeTransferencia: '0.00', credito: '0.00', bonosCertificados: '0.00',
        }))
      })()
  },
  async export607CSV(period) {
    const rows = await service.generate607(period)
    const header = 'RNC|TIPO_ID|NCF|FECHA|MONTO|ITBIS|ITBIS_TERCEROS|ITBIS_PERCIBIDO|TOTAL_ITBIS|PROPINA|EFECTIVO|TARJETA|CHEQUE|CREDITO|BONOS'
    const lines = rows.map(r =>
      `${r.rnc}|${r.tipoIdentificacion}|${r.ncf}|${r.fechaNcf}|${r.montoFacturado}|${r.itbisFacturado}|${r.itbisRetenidoTerceros}|${r.itbisPercibido}|${r.totalItbis}|${r.montoPropina}|${r.efectivo}|${r.tarjeta}|${r.chequeTransferencia}|${r.credito}|${r.bonosCertificados}`
    )
    const content = [header, ...lines].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `607_${period}.txt`; a.click(); URL.revokeObjectURL(url)
  },
  async getIncomeStatementReport(from, to) {
    return (await tryApi(() => api.get(`/accounting/report/income-statement?from=${from}&to=${to}`)))
      ?? (() => {
        const income = (db.getAll('income_records') ?? []).filter(r => r.date >= from && r.date <= to)
        const costs = (db.getAll('cost_records') ?? []).filter(r => r.date >= from && r.date <= to && r.type === 'costo_venta')
        const expenses = (db.getAll('cost_records') ?? []).filter(r => r.date >= from && r.date <= to && r.type !== 'costo_venta')
        const totalIncome = income.reduce((s, r) => s + (r.amount || 0), 0)
        const totalCosts = costs.reduce((s, r) => s + (r.amount || 0), 0)
        const totalExpenses = expenses.reduce((s, r) => s + (r.amount || 0), 0)
        return {
          income: { total: totalIncome, items: income }, costs: { total: totalCosts, items: costs },
          expenses: { total: totalExpenses, items: expenses },
          grossProfit: totalIncome - totalCosts, operatingProfit: totalIncome - totalCosts - totalExpenses,
          netIncome: totalIncome - totalCosts - totalExpenses,
        }
      })()
  },
  async getCashReconciliation(date, registerId) {
    return (await tryApi(() => api.get(`/accounting/report/cash-reconciliation?date=${date}&registerId=${registerId || ''}`)))
      ?? null
  },
  async saveCashReconciliation(data) {
    return (await tryApi(() => api.post('/accounting/report/cash-reconciliation', data)))
      ?? db.insert('cashReconciliations', data)
  },
}

export default service
