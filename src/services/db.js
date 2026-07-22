import { init, getAll, getById, query, insert, update, remove, clear, addAudit, getAudit, STORES } from './dbStore.js'
import { seedAll } from './dbSeed.js'

init()
seedAll()

export default { getById, getAll, query, insert, update, remove, clear, addAudit, getAudit, STORES, init, seedAll }
