import api from './apiClient'
import db from './db'
import accountingService from './accountingService'
import logger from './logger'

const API_PATH = '/cash-registers'

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

function getNextId() {
  const items = db.getAll('cashRegisters')
  const nums = items.map(i => { const m = i.id.match(/CAJ-(\d+)/); return m ? parseInt(m[1]) : 0 })
  const max = nums.length ? Math.max(...nums) : 0
  return `CAJ-${String(max + 1).padStart(3, '0')}`
}

async function tryApi(fn) {
  try { return await fn() } catch { return null }
}

const service = {
  async list() {
    const res = await tryApi(() => api.get(API_PATH))
    if (res) return res
    await delay(); return db.getAll('cashRegisters')
  },

  async getById(id) {
    const res = await tryApi(() => api.get(`${API_PATH}/${id}`))
    if (res) return res
    await delay(); return db.getById('cashRegisters', id)
  },

  async getOpen(userId) {
    const res = await tryApi(() => api.get(`${API_PATH}/open/${userId}`))
    if (res) return res
    await delay(); const registers = db.query('cashRegisters', r => r.userId === userId && r.status === 'open'); return registers[0] || null
  },

  async open(userId, initialBalance = 0) {
    const res = await tryApi(() => api.post(API_PATH, { userId, initialBalance }))
    if (res) return res
    await delay(400);
    const open = await service.getOpen(userId); if (open) throw new Error('Ya hay una caja abierta');
    const register = db.insert('cashRegisters', {
      id: getNextId(), userId, openDate: new Date().toISOString(), closeDate: null,
      initialBalance, currentBalance: initialBalance, totalIncome: 0, totalExpense: 0,
      status: 'open', currency: 'DOP', transactions: [],
    })
    db.addAudit({action:'open',store:'cashRegisters',detail:`Caja abierta: ${register.id}`,userId})
    return register
  },

  async close(userId) {
    const res = await tryApi(() => api.post(`${API_PATH}/close`, { userId }))
    if (res) return res
    await delay(500);
    const register = await service.getOpen(userId); if (!register) throw new Error('No hay caja abierta');
    const closed = db.update('cashRegisters', register.id, { status: 'closed', closeDate: new Date().toISOString() })
    try {
      await accountingService.createJournalEntry({
        date: new Date().toISOString().slice(0,10),
        concept: `Cuadre de caja ${register.id} — Cierre`,
        reference: register.id,
        lines: [
          { accountId: 'ACC-1-01-001', accountName: 'Caja General', debit: closed.currentBalance, credit: 0 },
          { accountId: 'ACC-4-01-001', accountName: 'Ingresos por Ventas', debit: 0, credit: closed.totalIncome },
          { accountId: 'ACC-6-01-001', accountName: 'Gastos Operativos', debit: closed.totalExpense, credit: 0 },
          { accountId: 'ACC-1-01-002', accountName: 'Banco Comercial', debit: 0, credit: closed.initialBalance },
        ],
      }, userId)
      db.addAudit({action:'cuadre_contable',store:'cashRegisters',detail:`Asiento de cierre creado para ${register.id}`,userId})
    } catch (e) {
      logger.warn('cashRegisterService', 'No se pudo crear asiento contable', e)
    }
    db.addAudit({action:'close',store:'cashRegisters',detail:`Caja cerrada: ${register.id}`,userId})
    return closed
  },

  async addTransaction(registerId, txn, userId) {
    const res = await tryApi(() => api.post(`${API_PATH}/${registerId}/transactions`, { ...txn, userId }))
    if (res) return res
    await delay(300);
    const register = db.getById('cashRegisters', registerId); if (!register) throw new Error('Caja no encontrada');
    if (register.status !== 'open') throw new Error('La caja está cerrada');
    const t = { id: `TXN-${Date.now()}`, createdAt: new Date().toISOString(), ...txn }
    const transactions = [...register.transactions, t]
    const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const currentBalance = register.initialBalance + totalIncome - totalExpense
    const updated = db.update('cashRegisters', registerId, { transactions, totalIncome, totalExpense, currentBalance })
    db.addAudit({action:'transaction',store:'cashRegisters',detail:`Transacción ${t.id}: ${txn.type} ${txn.amount}`,userId})
    return updated
  },

  async removeTransaction(registerId, txnId, userId) {
    const res = await tryApi(() => api.delete(`${API_PATH}/${registerId}/transactions/${txnId}?userId=${userId}`))
    if (res) return res
    await delay(300);
    const register = db.getById('cashRegisters', registerId); if (!register) throw new Error('Caja no encontrada');
    const transactions = register.transactions.filter(t => t.id !== txnId)
    if (transactions.length === register.transactions.length) throw new Error('Transacción no encontrada');
    const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const currentBalance = register.initialBalance + totalIncome - totalExpense
    const updated = db.update('cashRegisters', registerId, { transactions, totalIncome, totalExpense, currentBalance })
    db.addAudit({action:'remove_transaction',store:'cashRegisters',detail:`Transacción eliminada: ${txnId}`,userId})
    return updated
  },

  async getReport(registerId) { await delay(200);
    const register = db.getById('cashRegisters', registerId); if (!register) throw new Error('Caja no encontrada');
    const txns = register.transactions
    const byHour = {}; const byDate = {}; const byMethod = {}
    txns.forEach(t => {
      const d = new Date(t.createdAt)
      const hour = `${String(d.getHours()).padStart(2,'0')}:00`
      const date = d.toISOString().slice(0,10)
      byHour[hour] = (byHour[hour] || 0) + t.amount
      byDate[date] = (byDate[date] || 0) + t.amount
      byMethod[t.paymentMethod || 'cash'] = (byMethod[t.paymentMethod || 'cash'] || 0) + t.amount
    })
    return { register, transactions: txns, byHour, byDate, byMethod }
  },

  async generateReportHtml(registerId) { await delay(100);
    const report = await service.getReport(registerId)
    const r = report.register
    const lines = [
      `<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:20px;margin:0">Javaline — Reporte de Cierre</h1>`,
      `<p style="font-size:12px;color:#6b5a4a">${r.id} | ${new Date(r.openDate).toLocaleString('es-DO')} — ${r.closeDate ? new Date(r.closeDate).toLocaleString('es-DO') : 'Abierta'}</p></div>`,
      `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px"><tr><th style="text-align:left;border-bottom:2px solid #f59e0b;padding:6px 4px;font-size:11px;text-transform:uppercase">ID</th><th style="text-align:left;border-bottom:2px solid #f59e0b;padding:6px 4px;font-size:11px;text-transform:uppercase">Hora</th><th style="text-align:left;border-bottom:2px solid #f59e0b;padding:6px 4px;font-size:11px;text-transform:uppercase">Concepto</th><th style="text-align:left;border-bottom:2px solid #f59e0b;padding:6px 4px;font-size:11px;text-transform:uppercase">Método</th><th style="text-align:right;border-bottom:2px solid #f59e0b;padding:6px 4px;font-size:11px;text-transform:uppercase">Monto</th></tr>`,
      ...report.transactions.map(t => `<tr><td style="padding:4px;border-bottom:1px solid #f0e8dd">${t.id}</td><td style="padding:4px;border-bottom:1px solid #f0e8dd">${new Date(t.createdAt).toLocaleTimeString('es-DO')}</td><td style="padding:4px;border-bottom:1px solid #f0e8dd">${t.concept || ''}</td><td style="padding:4px;border-bottom:1px solid #f0e8dd">${t.paymentMethod || 'cash'}</td><td style="padding:4px;border-bottom:1px solid #f0e8dd;text-align:right">${t.type === 'income' ? '' : '-'}$${t.amount.toLocaleString('es-DO')}</td></tr>`),
      `<tr style="font-weight:700;border-top:2px solid #1a1410"><td colspan="4" style="padding:4px;text-align:right">Totales</td><td style="padding:4px;text-align:right">$${(r.totalIncome - r.totalExpense).toLocaleString('es-DO')}</td></tr>`,
      `</table>`,
      `<h2 style="font-size:14px;margin:20px 0 8px;border-bottom:1px solid #e8ddd0;padding-bottom:4px">Resumen por Hora</h2><table style="width:100%;border-collapse:collapse;font-size:12px">${Object.entries(report.byHour).map(([h, a]) => `<tr><td style="padding:4px;border-bottom:1px solid #f0e8dd">${h}</td><td style="padding:4px;border-bottom:1px solid #f0e8dd;text-align:right">$${a.toLocaleString('es-DO')}</td></tr>`).join('')}</table>`,
      `<h2 style="font-size:14px;margin:20px 0 8px;border-bottom:1px solid #e8ddd0;padding-bottom:4px">Resumen por Fecha</h2><table style="width:100%;border-collapse:collapse;font-size:12px">${Object.entries(report.byDate).map(([d, a]) => `<tr><td style="padding:4px;border-bottom:1px solid #f0e8dd">${d}</td><td style="padding:4px;border-bottom:1px solid #f0e8dd;text-align:right">$${a.toLocaleString('es-DO')}</td></tr>`).join('')}</table>`,
      `<h2 style="font-size:14px;margin:20px 0 8px;border-bottom:1px solid #e8ddd0;padding-bottom:4px">Resumen por Método de Pago</h2><table style="width:100%;border-collapse:collapse;font-size:12px">${Object.entries(report.byMethod).map(([m, a]) => `<tr><td style="padding:4px;border-bottom:1px solid #f0e8dd">${m}</td><td style="padding:4px;border-bottom:1px solid #f0e8dd;text-align:right">$${a.toLocaleString('es-DO')}</td></tr>`).join('')}</table>`,
    ].join('\n')
    return lines
  },
}

export default service
