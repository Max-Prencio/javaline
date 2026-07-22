import logger from './logger.js'

const DB_PREFIX = 'javaline_'

export const STORES = [
  'users', 'profiles', 'invoices', 'contacts', 'employees',
  'purchases', 'products', 'tasks', 'meetings', 'roles', 'chats',
  'notifications', 'invitations', 'settings',
  'currencies', 'cashRegisters', 'accounts', 'journalEntries',
  'approvalHierarchies', 'taxRates', 'installmentPlans',
  'inventory', 'stockMovements',
  'accountsReceivable', 'accountsPayable', 'debitNotes', 'creditNotes',
  'checks', 'petty_cash_funds', 'pettyCash', 'fixedAssets',
  'income_records', 'cost_records', 'cashReconciliations', 'ncf_sequences',
]

export function getStore(store) {
  try {
    const data = localStorage.getItem(`${DB_PREFIX}${store}`)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export function setStore(store, data) {
  try {
    localStorage.setItem(`${DB_PREFIX}${store}`, JSON.stringify(data))
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      logger.error('dbStore', `localStorage lleno al guardar "${store}"`, { store })
      window.dispatchEvent(new CustomEvent('javaline:storage-full', { detail: { store } }))
    } else {
      throw e
    }
  }
}

export function init() {
  STORES.forEach(store => {
    const key = `${DB_PREFIX}${store}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]))
    }
  })
}

export function getAll(store) {
  return [...getStore(store)]
}

export function getById(store, id) {
  return getStore(store).find(i => i.id === id) || null
}

export function query(store, fn) {
  return getStore(store).filter(fn)
}

export function insert(store, item) {
  const items = getStore(store)
  const newItem = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item,
    id: item.id != null ? item.id : crypto.randomUUID(),
  }
  items.push(newItem)
  setStore(store, items)
  return newItem
}

export function update(store, id, changes) {
  const items = getStore(store)
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...changes, updatedAt: new Date().toISOString() }
  setStore(store, items)
  return items[idx]
}

export function remove(store, id) {
  const items = getStore(store)
  const filtered = items.filter(i => i.id !== id)
  if (filtered.length === items.length) return false
  setStore(store, filtered)
  return true
}

export function clear(store) {
  localStorage.removeItem(`${DB_PREFIX}${store}`)
}

export function addAudit(entry) {
  const log = getStore('audit')
  log.unshift({ id: `audit_${Date.now()}`, timestamp: new Date().toISOString(), ...entry })
  if (log.length > 1000) log.length = 1000
  setStore('audit', log)
  return log[0]
}

export function getAudit(filters = {}) {
  let log = getStore('audit')
  if (filters.action) log = log.filter(e => e.action === filters.action)
  if (filters.userId) log = log.filter(e => e.userId === filters.userId)
  if (filters.store) log = log.filter(e => e.store === filters.store)
  if (filters.limit) log = log.slice(0, filters.limit)
  return log
}
