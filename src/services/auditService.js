import db from './db'

const auditService = {
  add(entry) {
    db.addAudit(entry)
  },
}

export default auditService
