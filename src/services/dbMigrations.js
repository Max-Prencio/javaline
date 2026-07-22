import { getStore, setStore } from './dbStore.js'

const DB_PREFIX = 'javaline_'
export const DB_VERSION = 3
export const DB_VERSION_KEY = `${DB_PREFIX}db_version`

const MIGRATIONS = {
  1: () => {
    // v1→v2: Add IDs to contacts seeded without them
    const contacts = getStore('contacts')
    if (contacts.length > 0 && !contacts[0].id) {
      contacts.forEach((c, i) => {
        c.id = `CLI-${String(i + 1).padStart(3, '0')}`
        c.createdAt = c.createdAt || new Date().toISOString()
        c.updatedAt = new Date().toISOString()
      })
      setStore('contacts', contacts)
    }
  },
  2: () => {
    // v2→v3: Add permissions to users that don't have them
    const users = getStore('users')
    const changed = users.map(u => {
      if (!u.permissions) {
        return {
          ...u,
          permissions: u.role === 'admin'
            ? ['factura_cliente', 'factura_proveedor', 'caja', 'contabilidad', 'todos']
            : ['factura_cliente'],
          updatedAt: new Date().toISOString(),
        }
      }
      return u
    })
    if (JSON.stringify(changed) !== JSON.stringify(users)) setStore('users', changed)
  },
}

export function runMigrations() {
  const current = parseInt(localStorage.getItem(DB_VERSION_KEY) || '0', 10)
  if (current >= DB_VERSION) return
  for (let v = current + 1; v <= DB_VERSION; v++) {
    if (MIGRATIONS[v - 1]) {
      try {
        MIGRATIONS[v - 1]()
      } catch (e) {
        console.error(`[db] Migration v${v} failed:`, e)
      }
    }
  }
  localStorage.setItem(DB_VERSION_KEY, String(DB_VERSION))
}
