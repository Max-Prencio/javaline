import db from './db'
import api from './apiClient'
import {
  calcBalanceSheet, calcIncomeStatement, calcAging,
  calcMonthlyDepreciation, buildIncomeStatementReport, build607Rows,
} from './accountingCalcs'

async function tryApi(fn) {
  try { return await fn() } catch { return null }
}

const service = {
  // ── Chart of Accounts ──
  async listAccounts(filters = {}) {
    let items = db.getAll('accounts')
    if (filters.type) items = items.filter(a => a.type === filters.type)
    if (filters.active !== undefined) items = items.filter(a => a.active === filters.active)
    return items
  },
  async getAccount(id) { return db.getById('accounts', id) },
  async createAccount(data, userId) {
    const item = db.insert('accounts', data)
    db.addAudit({ action: 'create', store: 'accounts', detail: `Cuenta creada: ${data.code} - ${data.name}`, userId })
    return item
  },
  async updateAccount(id, changes, userId) {
    const item = db.update('accounts', id, changes)
    if (!item) throw new Error('Cuenta no encontrada')
    db.addAudit({ action: 'update', store: 'accounts', detail: `Cuenta actualizada: ${id}`, userId })
    return item
  },
  async removeAccount(id, userId) {
    db.remove('accounts', id)
    db.addAudit({ action: 'delete', store: 'accounts', detail: `Cuenta eliminada: ${id}`, userId })
    return true
  },
  async getAccountsByType(type) { return db.query('accounts', a => a.type === type && a.active) },
  async getChartOfAccounts(search, type) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    const qs = params.toString()
    return (await tryApi(() => api.get(`/accounting/accounts${qs ? '?' + qs : ''}`)))
      ?? db.getAll('accounts').filter(a => a.active !== false)
  },

  // ── Journal Entries ──
  async listJournalEntries(filters = {}) {
    let items = db.getAll('journalEntries')
    if (filters.fromDate) items = items.filter(e => e.date >= filters.fromDate)
    if (filters.toDate) items = items.filter(e => e.date <= filters.toDate)
    return items.sort((a, b) => new Date(b.date) - new Date(a.date))
  },
  async getJournalEntry(id) { return db.getById('journalEntries', id) },
  async createJournalEntry(data, userId) {
    if (!data.lines?.length) throw new Error('El asiento debe tener al menos una línea')
    const totalDebit = data.lines.reduce((s, l) => s + (l.debit || 0), 0)
    const totalCredit = data.lines.reduce((s, l) => s + (l.credit || 0), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error('El asiento no está balanceado (débitos ≠ créditos)')
    const item = db.insert('journalEntries', { ...data, totalDebit, totalCredit, status: 'posted' })
    db.addAudit({ action: 'create', store: 'journalEntries', detail: `Asiento contable creado: ${item.id}`, userId })
    return item
  },
  async reverseJournalEntry(id, reason) {
    const result = await tryApi(() => api.post(`/accounting/journal/${id}/reverse`, { reason }))
    if (result) return result
    const original = db.getById('journalEntries', id)
    if (!original) throw new Error('Asiento no encontrado')
    if (original.status === 'reversed') throw new Error('Este asiento ya fue reversado')
    db.update('journalEntries', id, { status: 'reversed' })
    const reversedLines = (original.lines || []).map(l => ({ ...l, debit: l.credit || 0, credit: l.debit || 0 }))
    return db.insert('journalEntries', {
      ...original, id: undefined, lines: reversedLines, status: 'posted',
      description: `Reversa de ${original.reference || original.id}: ${reason}`,
      reversesId: id, reference: undefined,
    })
  },

  // ── Financial Reports (use calc functions) ──
  async getBalanceSheet(toDate) {
    return calcBalanceSheet(db.getAll('accounts'), db.getAll('journalEntries'), toDate)
  },
  async getIncomeStatement(fromDate, toDate) {
    return calcIncomeStatement(db.getAll('accounts'), db.getAll('journalEntries'), fromDate, toDate)
  },
  async getIncomeStatementReport(from, to) {
    return (await tryApi(() => api.get(`/accounting/report/income-statement?from=${from}&to=${to}`)))
      ?? buildIncomeStatementReport(db.getAll('income_records') ?? [], db.getAll('cost_records') ?? [], from, to)
  },
  async generate607(period) {
    return (await tryApi(() => api.get(`/accounting/report/607?period=${period}`)))
      ?? build607Rows(db.getAll('invoices') ?? [], period)
  },
  async export607CSV(period) {
    const rows = await service.generate607(period)
    const header = 'RNC|TIPO_ID|NCF|FECHA|MONTO|ITBIS|ITBIS_TERCEROS|ITBIS_PERCIBIDO|TOTAL_ITBIS|PROPINA|EFECTIVO|TARJETA|CHEQUE|CREDITO|BONOS'
    const lines = rows.map(r =>
      `${r.rnc}|${r.tipoIdentificacion}|${r.ncf}|${r.fechaNcf}|${r.montoFacturado}|${r.itbisFacturado}|${r.itbisRetenidoTerceros}|${r.itbisPercibido}|${r.totalItbis}|${r.montoPropina}|${r.efectivo}|${r.tarjeta}|${r.chequeTransferencia}|${r.credito}|${r.bonosCertificados}`
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `607_${period}.txt`; a.click(); URL.revokeObjectURL(url)
  },
  async getCashReconciliation(date, registerId) {
    return (await tryApi(() => api.get(`/accounting/report/cash-reconciliation?date=${date}&registerId=${registerId || ''}`))) ?? null
  },
  async saveCashReconciliation(data) {
    return (await tryApi(() => api.post('/accounting/report/cash-reconciliation', data)))
      ?? db.insert('cashReconciliations', data)
  },

  // ── Receivables ──
  async getReceivables(filters = {}) {
    return (await tryApi(() => api.get(`/accounting/receivables?${new URLSearchParams(filters)}`)))
      ?? db.getAll('accountsReceivable') ?? []
  },
  async createReceivable(data) {
    return (await tryApi(() => api.post('/accounting/receivables', data)))
      ?? db.insert('accountsReceivable', { ...data, paid: 0, status: 'pending', paymentsJson: '[]' })
  },
  async payReceivable(id, paymentData) {
    const result = await tryApi(() => api.post(`/accounting/receivables/${id}/pay`, paymentData))
    if (result) return result
    const rec = db.getById('accountsReceivable', id)
    if (!rec) throw new Error('No encontrado')
    const payments = [...JSON.parse(rec.paymentsJson || '[]'), paymentData]
    const paid = payments.reduce((s, p) => s + (p.amount || 0), 0)
    return db.update('accountsReceivable', id, { paymentsJson: JSON.stringify(payments), paid, status: paid >= rec.amount ? 'paid' : paid > 0 ? 'partial' : 'pending' })
  },
  async getReceivablesAging() {
    return (await tryApi(() => api.get('/accounting/receivables/aging')))
      ?? calcAging(db.getAll('accountsReceivable') ?? [])
  },

  // ── Payables ──
  async getPayables(filters = {}) {
    return (await tryApi(() => api.get(`/accounting/payables?${new URLSearchParams(filters)}`)))
      ?? db.getAll('accountsPayable') ?? []
  },
  async createPayable(data) {
    return (await tryApi(() => api.post('/accounting/payables', data)))
      ?? db.insert('accountsPayable', { ...data, paid: 0, status: 'pending', paymentsJson: '[]' })
  },
  async payPayable(id, paymentData) {
    const result = await tryApi(() => api.post(`/accounting/payables/${id}/pay`, paymentData))
    if (result) return result
    const rec = db.getById('accountsPayable', id)
    if (!rec) throw new Error('No encontrado')
    const payments = [...JSON.parse(rec.paymentsJson || '[]'), paymentData]
    const paid = payments.reduce((s, p) => s + (p.amount || 0), 0)
    return db.update('accountsPayable', id, { paymentsJson: JSON.stringify(payments), paid, status: paid >= rec.amount ? 'paid' : paid > 0 ? 'partial' : 'pending' })
  },
  async getPayablesAging() {
    return (await tryApi(() => api.get('/accounting/payables/aging')))
      ?? calcAging(db.getAll('accountsPayable') ?? [])
  },

  // ── Notes ──
  async getDebitNotes(filters = {}) {
    return (await tryApi(() => api.get(`/accounting/debit-notes?${new URLSearchParams(filters)}`)))
      ?? db.getAll('debitNotes') ?? []
  },
  async createDebitNote(data) {
    const result = await tryApi(() => api.post('/accounting/debit-notes', data))
    if (result) return result
    const seq = (db.getAll('ncf_sequences') ?? []).find(s => s.type === 'B34')
    const ncf = seq ? `B34${String(seq.sequence).padStart(10, '0')}` : 'B34-LOCAL'
    if (seq) db.update('ncf_sequences', seq.id, { sequence: seq.sequence + 1 })
    return db.insert('debitNotes', { ...data, ncf, ncfType: 'B34', status: 'active' })
  },
  async getCreditNotes(filters = {}) {
    return (await tryApi(() => api.get(`/accounting/credit-notes?${new URLSearchParams(filters)}`)))
      ?? db.getAll('creditNotes') ?? []
  },
  async createCreditNote(data) {
    const result = await tryApi(() => api.post('/accounting/credit-notes', data))
    if (result) return result
    const seq = (db.getAll('ncf_sequences') ?? []).find(s => s.type === 'B04')
    const ncf = seq ? `B04${String(seq.sequence).padStart(10, '0')}` : 'B04-LOCAL'
    if (seq) db.update('ncf_sequences', seq.id, { sequence: seq.sequence + 1 })
    return db.insert('creditNotes', { ...data, ncf, ncfType: 'B04', status: 'active' })
  },

  // ── Checks ──
  async getChecks(filters = {}) {
    return (await tryApi(() => api.get(`/accounting/checks?${new URLSearchParams(filters)}`)))
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
    return (await tryApi(() => api.get('/accounting/petty-cash'))) ?? db.getAll('petty_cash_funds') ?? []
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
    const bal = fund.balance || fund.currentBalance || 0
    if (data.type === 'egreso' && bal < data.amount) throw new Error('Saldo insuficiente')
    const newBalance = data.type === 'egreso' ? bal - data.amount : bal + data.amount
    db.update('petty_cash_funds', fundId, { balance: newBalance, currentBalance: newBalance })
    return db.insert('pettyCash', { ...data, fundId, balanceAfter: newBalance })
  },
  async reconcilePettyCash(fundId, concept) {
    const result = await tryApi(() => api.post(`/accounting/petty-cash/${fundId}/reconcile`, { concept }))
    if (result) return result
    const fund = (db.getAll('petty_cash_funds') ?? []).find(f => f.id === fundId)
    if (!fund) throw new Error('Fondo no encontrado')
    const bal = fund.balance || fund.currentBalance || 0
    const initBal = fund.initialBalance || fund.InitialBalance || 5000
    db.update('petty_cash_funds', fundId, { balance: initBal, currentBalance: initBal })
    return db.insert('pettyCash', { fundId, type: 'reposicion', concept: `Reposición: ${concept}`, amount: initBal - bal, balanceAfter: initBal, date: new Date().toISOString().slice(0, 10) })
  },

  // ── Fixed Assets ──
  async getFixedAssets() {
    return (await tryApi(() => api.get('/accounting/fixed-assets'))) ?? db.getAll('fixedAssets') ?? []
  },
  async createFixedAsset(data) {
    return (await tryApi(() => api.post('/accounting/fixed-assets', data)))
      ?? db.insert('fixedAssets', { ...data, status: 'active' })
  },
  calculateMonthlyDepreciation: calcMonthlyDepreciation,
  async disposeAsset(id, data) {
    return (await tryApi(() => api.put(`/accounting/fixed-assets/${id}/dispose`, data)))
      ?? db.update('fixedAssets', id, { status: 'disposed', ...data })
  },

  // ── Income & Cost Records ──
  async getIncomeRecords(filters = {}) {
    return (await tryApi(() => api.get(`/accounting/income-records?${new URLSearchParams(filters)}`)))
      ?? db.getAll('income_records') ?? []
  },
  async createIncomeRecord(data) {
    return (await tryApi(() => api.post('/accounting/income-records', data))) ?? db.insert('income_records', data)
  },
  async getCostRecords(filters = {}) {
    return (await tryApi(() => api.get(`/accounting/cost-records?${new URLSearchParams(filters)}`)))
      ?? db.getAll('cost_records') ?? []
  },
  async createCostRecord(data) {
    return (await tryApi(() => api.post('/accounting/cost-records', data))) ?? db.insert('cost_records', data)
  },

  async getClientPortfolio() { return db.getAll('contacts').filter(c => c.stage === 'cliente') },
}

export default service
