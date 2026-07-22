// Pure calculation functions — no side effects, no API, no DB

export function calcBalanceSheet(accounts, journalEntries, toDate) {
  const entries = journalEntries.filter(e => e.status === 'posted' && e.date <= toDate)
  const debitNormal = new Set(['activo', 'gasto'])
  const rawBalances = {}
  accounts.forEach(a => { rawBalances[a.id] = 0 })
  entries.forEach(e => {
    e.lines.forEach(l => {
      if (l.accountId) rawBalances[l.accountId] = (rawBalances[l.accountId] || 0) + (l.debit || 0) - (l.credit || 0)
    })
  })
  return accounts.map(a => {
    const raw = rawBalances[a.id] || 0
    const balance = debitNormal.has(a.type) ? raw : -raw
    return { ...a, balance, balanceFormatted: balance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }) }
  })
}

export function calcIncomeStatement(accounts, journalEntries, fromDate, toDate) {
  const entries = journalEntries.filter(e => e.status === 'posted' && e.date >= fromDate && e.date <= toDate)
  const getBalance = (accts) => accts.map(a => {
    const balance = entries.reduce((s, e) => {
      const line = e.lines.find(l => l.accountId === a.id)
      return s + (line ? (line.credit || 0) - (line.debit || 0) : 0)
    }, 0)
    return { ...a, balance }
  })
  return {
    income: getBalance(accounts.filter(a => a.type === 'ingreso')),
    expense: getBalance(accounts.filter(a => a.type === 'gasto')),
  }
}

export function calcAging(items, amountKey = 'amount', paidKey = 'paid') {
  const today = new Date()
  const buckets = {
    current: { count: 0, total: 0 },
    '1-30d': { count: 0, total: 0 },
    '31-60d': { count: 0, total: 0 },
    '61-90d': { count: 0, total: 0 },
    '90+d': { count: 0, total: 0 },
  }
  items.filter(r => r.status !== 'paid').forEach(r => {
    const days = r.dueDate ? Math.max(0, Math.floor((today - new Date(r.dueDate)) / 86400000)) : 999
    const key = days <= 0 ? 'current' : days <= 30 ? '1-30d' : days <= 60 ? '31-60d' : days <= 90 ? '61-90d' : '90+d'
    buckets[key].count++
    buckets[key].total += (r[amountKey] || 0) - (r[paidKey] || 0)
  })
  return buckets
}

export function calcMonthlyDepreciation(asset) {
  if (!asset || (asset.usefulLifeYears || 0) <= 0) return 0
  const cost = asset.acquisitionCost || asset.AcquisitionCost || 0
  const salvage = asset.salvageValue || asset.SalvageValue || 0
  const life = (asset.usefulLifeYears || asset.UsefulLifeYears || 1) * 12
  return (cost - salvage) / life
}

export function buildIncomeStatementReport(incomeRecords, costRecords, from, to) {
  const income = incomeRecords.filter(r => r.date >= from && r.date <= to)
  const costs = costRecords.filter(r => r.date >= from && r.date <= to && r.type === 'costo_venta')
  const expenses = costRecords.filter(r => r.date >= from && r.date <= to && r.type !== 'costo_venta')
  const totalIncome = income.reduce((s, r) => s + (r.amount || 0), 0)
  const totalCosts = costs.reduce((s, r) => s + (r.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, r) => s + (r.amount || 0), 0)
  return {
    income: { total: totalIncome, items: income },
    costs: { total: totalCosts, items: costs },
    expenses: { total: totalExpenses, items: expenses },
    grossProfit: totalIncome - totalCosts,
    operatingProfit: totalIncome - totalCosts - totalExpenses,
    netIncome: totalIncome - totalCosts - totalExpenses,
  }
}

export function build607Rows(invoices, period) {
  const [year, month] = [period.slice(0, 4), period.slice(4, 6)]
  return invoices.filter(inv => {
    const d = new Date(inv.date)
    return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month) && inv.ncf
  }).map(inv => ({
    rnc: inv.rnc || '', tipoIdentificacion: inv.rnc?.length === 11 ? '1' : '2',
    ncf: inv.ncf || '', fechaNcf: inv.date ? inv.date.replace(/-/g, '') : '',
    montoFacturado: (inv.subtotal || 0).toFixed(2), itbisFacturado: (inv.tax || 0).toFixed(2),
    itbisRetenidoTerceros: '0.00', itbisPercibido: '0.00', totalItbis: (inv.tax || 0).toFixed(2),
    montoPropina: '0.00', efectivo: (inv.total || 0).toFixed(2), tarjeta: '0.00',
    chequeTransferencia: '0.00', credito: '0.00', bonosCertificados: '0.00',
  }))
}
