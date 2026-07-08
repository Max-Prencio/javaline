// CORE DATABASE - localStorage abstraction with audit trail
import bcrypt from 'bcryptjs'
const DB_PREFIX = 'javaline_'
const AUDIT_KEY = `${DB_PREFIX}audit`

const STORES = ['users', 'profiles', 'invoices', 'contacts', 'employees',
  'purchases', 'products', 'tasks', 'meetings', 'roles', 'chats',
  'notifications', 'invitations', 'settings',
  'currencies', 'cashRegisters', 'accounts', 'journalEntries',
  'approvalHierarchies', 'taxRates', 'installmentPlans']

function init() {
  STORES.forEach(store => {
    const key = `${DB_PREFIX}${store}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]))
    }
  })
}

function getStore(store) {
  try {
    const data = localStorage.getItem(`${DB_PREFIX}${store}`)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function setStore(store, data) {
  localStorage.setItem(`${DB_PREFIX}${store}`, JSON.stringify(data))
}

function getAll(store) {
  return [...getStore(store)]
}

function getById(store, id) {
  const items = getStore(store)
  return items.find(i => i.id === id) || null
}

function query(store, fn) {
  const items = getStore(store)
  return items.filter(fn)
}

function insert(store, item) {
  const items = getStore(store)
  const newItem = {
    id: `${store.slice(0,-1)}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item,
  }
  items.push(newItem)
  setStore(store, items)
  return newItem
}

function update(store, id, changes) {
  const items = getStore(store)
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...changes, updatedAt: new Date().toISOString() }
  setStore(store, items)
  return items[idx]
}

function remove(store, id) {
  const items = getStore(store)
  const filtered = items.filter(i => i.id !== id)
  if (filtered.length === items.length) return false
  setStore(store, filtered)
  return true
}

function clear(store) {
  localStorage.removeItem(`${DB_PREFIX}${store}`)
}

// --- AUDIT LOG ---
function addAudit(entry) {
  const log = getStore('audit')
  log.unshift({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  })
  if (log.length > 1000) log.length = 1000 // keep last 1000
  setStore('audit', log)
  return log[0]
}

function getAudit(filters = {}) {
  let log = getStore('audit')
  if (filters.action) log = log.filter(e => e.action === filters.action)
  if (filters.userId) log = log.filter(e => e.userId === filters.userId)
  if (filters.store) log = log.filter(e => e.store === filters.store)
  if (filters.limit) log = log.slice(0, filters.limit)
  return log
}

// --- SEED DATA ---
const SEED_DATA = {
  users: [
    { id: 'user_admin', name: 'Maxwell', email: 'admin@javaline.app', password: 'admin123',
      role: 'admin', photo: null, phone: '+1 809-555-0100', position: 'Desarrollador Full Stack',
      bio: 'Creador de Javaline.', notificationEmail: 'admin@javaline.app',
      altEmail: 'maxwell@javaline.app', status: 'active', permissions: ['factura_cliente', 'factura_proveedor', 'caja', 'contabilidad', 'todos'], createdAt: '2026-01-01T00:00:00Z' },
  ],
  invoices: [
    { id: 'FAC-001', type: 'client', documentType: 'factura', date: '2026-05-28', dueDate: '2026-06-28',
      clientId: 'CLI-001', clientName: 'Tech Solutions SRL', clientType: 'company', rnc: '101-23456-7',
      currency: 'DOP', paymentType: 'debit', paymentMethod: 'transfer',
      items: [{productId:'P001',productName:'Laptop Pro 15',qty:1,price:45000,total:45000}],
      subtotal: 45000, tax: 8100, total: 53100,
      status: 'paid', cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-05-28T10:00:00Z' },
    { id: 'FAC-002', type: 'client', documentType: 'factura', date: '2026-06-01', dueDate: '2026-07-01',
      clientId: 'CLI-002', clientName: 'Distribuidora Ortiz', clientType: 'company', rnc: '102-34567-8',
      currency: 'DOP', paymentType: 'credit', paymentMethod: 'transfer',
      items: [{productId:'P002',productName:'Monitor 27" 4K',qty:2,price:22000,total:44000},{productId:'P003',productName:'Teclado Mecánico',qty:5,price:5500,total:27500}],
      subtotal: 71500, tax: 12870, total: 84370,
      status: 'pending', installmentPlan: {totalInstallments:3,amountPerInstallment:28123.33,frequency:'monthly',startDate:'2026-07-01',installments:[{number:1,dueDate:'2026-07-01',amount:28123.33,paid:false},{number:2,dueDate:'2026-08-01',amount:28123.33,paid:false},{number:3,dueDate:'2026-09-01',amount:28123.33,paid:false}]},
      cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-06-01T09:00:00Z' },
    { id: 'FAC-003', type: 'client', documentType: 'factura', date: '2026-05-15', dueDate: '2026-06-15',
      clientId: 'CLI-003', clientName: 'Clínica Central', clientType: 'company', rnc: '103-45678-9',
      currency: 'USD', paymentType: 'debit', paymentMethod: 'transfer',
      items: [{productId:'P005',productName:'Webcam HD Pro',qty:3,price:8500,total:25500}],
      subtotal: 25500, tax: 4590, total: 30090,
      status: 'overdue', cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-05-15T11:00:00Z' },
    { id: 'FAC-004', type: 'client', documentType: 'factura', date: '2026-06-05', dueDate: '2026-07-05',
      clientId: 'CLI-004', clientName: 'Grupo Moya', clientType: 'company', rnc: '104-56789-0',
      currency: 'DOP', paymentType: 'debit', paymentMethod: 'cash',
      items: [{productId:'P004',productName:'Mouse Inalámbrico',qty:10,price:3200,total:32000}],
      subtotal: 32000, tax: 5760, total: 37760,
      status: 'paid', cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-06-05T14:00:00Z' },
    { id: 'FAC-005', type: 'client', documentType: 'factura', date: '2026-06-10', dueDate: '2026-07-10',
      clientId: 'CLI-005', clientName: 'Agencia Nova', clientType: 'company', rnc: '105-67890-1',
      currency: 'DOP', paymentType: 'credit', paymentMethod: 'transfer',
      items: [{productId:'P006',productName:'Audífonos Bluetooth',qty:4,price:6500,total:26000}],
      subtotal: 26000, tax: 4680, total: 30680,
      status: 'pending', installmentPlan: {totalInstallments:2,amountPerInstallment:15340,frequency:'monthly',startDate:'2026-07-10',installments:[{number:1,dueDate:'2026-07-10',amount:15340,paid:false},{number:2,dueDate:'2026-08-10',amount:15340,paid:false}]},
      cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-06-10T08:00:00Z' },
  ],
  currencies: [
    { id: 'CUR-DOP', code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', exchangeRate: 1, isDefault: true, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'CUR-USD', code: 'USD', name: 'Dólar Americano', symbol: 'US$', exchangeRate: 60, isDefault: false, active: true, createdAt: '2026-01-01T00:00:00Z' },
  ],
  accounts: [
    { id: 'ACC-1-01-001', code: '1.01.001', name: 'Caja General', type: 'activo', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-1-01-002', code: '1.01.002', name: 'Banco Comercial', type: 'activo', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-1-01-003', code: '1.01.003', name: 'Cuentas por Cobrar', type: 'activo', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-1-02-001', code: '1.02.001', name: 'Inventario de Mercancías', type: 'activo', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-1-03-001', code: '1.03.001', name: 'Propiedades y Equipos', type: 'activo', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-2-01-001', code: '2.01.001', name: 'Cuentas por Pagar', type: 'pasivo', nature: 'acreedora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-2-01-002', code: '2.01.002', name: 'Impuestos por Pagar', type: 'pasivo', nature: 'acreedora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-2-02-001', code: '2.02.001', name: 'Préstamos Bancarios', type: 'pasivo', nature: 'acreedora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-3-01-001', code: '3.01.001', name: 'Capital Social', type: 'patrimonio', nature: 'acreedora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-3-02-001', code: '3.02.001', name: 'Utilidades Retenidas', type: 'patrimonio', nature: 'acreedora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-4-01-001', code: '4.01.001', name: 'Ingresos por Ventas', type: 'ingreso', nature: 'acreedora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-4-02-001', code: '4.02.001', name: 'Ingresos por Servicios', type: 'ingreso', nature: 'acreedora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-5-01-001', code: '5.01.001', name: 'Costo de Ventas', type: 'costo', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-6-01-001', code: '6.01.001', name: 'Gastos Operativos', type: 'gasto', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-6-02-001', code: '6.02.001', name: 'Gastos de Ventas', type: 'gasto', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'ACC-6-03-001', code: '6.03.001', name: 'Gastos Administrativos', type: 'gasto', nature: 'deudora', level: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
  ],
  taxRates: [
    { id: 'TAX-001', name: 'ITBIS General', rate: 0.18, type: 'vat', active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'TAX-002', name: 'ITBIS Reducido', rate: 0.08, type: 'vat', active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'TAX-003', name: 'Exento', rate: 0, type: 'vat', active: true, createdAt: '2026-01-01T00:00:00Z' },
  ],
  contacts: [
    { name: 'Carlos Méndez', company: 'Tech Solutions', email: 'carlos@techsol.com', phone: '809-555-0101', stage: 'cliente', type: 'company', rnc: '101-23456-7', notes: '' },
    { name: 'Ana Rosario', company: 'Distribuidora Ortiz', email: 'ana@ortiz.com', phone: '809-555-0102', stage: 'negociación', type: 'company', rnc: '102-34567-8', notes: '' },
    { name: 'Luis Peña', company: 'Clínica Central', email: 'luis@clincentral.com', phone: '809-555-0103', stage: 'lead', type: 'company', rnc: '103-45678-9', notes: '' },
    { name: 'Sofía Reyes', company: 'Grupo Moya', email: 'sofia@grupomoya.com', phone: '809-555-0104', stage: 'cliente', type: 'company', rnc: '104-56789-0', notes: '' },
    { name: 'Pedro Jiménez', company: 'Agencia Nova', email: 'pedro@novard.com', phone: '809-555-0105', stage: 'lead', type: 'company', rnc: '105-67890-1', notes: '' },
    { name: 'Laura Castillo', company: 'Distribuidora Ortiz', email: 'laura@ortiz.com', phone: '809-555-0106', stage: 'negociación', type: 'individual', notes: '' },
    { name: 'Roberto Santos', company: 'Tech Solutions', email: 'roberto@techsol.com', phone: '809-555-0107', stage: 'cliente', type: 'individual', notes: '' },
  ],
  employees: [
    { name: 'María García', department: 'Ventas', position: 'Ejecutiva de Ventas', salary: 45000, hireDate: '2024-03-01', status: 'activo' },
    { name: 'Juan Pérez', department: 'TI', position: 'Desarrollador Senior', salary: 65000, hireDate: '2023-08-15', status: 'activo' },
    { name: 'Rosa Martínez', department: 'RRHH', position: 'Coordinadora', salary: 38000, hireDate: '2025-01-10', status: 'activo' },
    { name: 'José López', department: 'Finanzas', position: 'Contador', salary: 42000, hireDate: '2024-06-20', status: 'activo' },
    { name: 'Carmen Díaz', department: 'Marketing', position: 'Especialista Digital', salary: 40000, hireDate: '2025-03-05', status: 'activo' },
    { name: 'David Torres', department: 'Ventas', position: 'Gerente de Ventas', salary: 55000, hireDate: '2023-11-01', status: 'activo' },
  ],
  purchases: [
    { id: 'OC-001', supplier: 'Office Depot', item: 'Equipos de cómputo', qty: 10, total: 280000, status: 'recibido', date: '2026-05-10' },
    { id: 'OC-002', supplier: 'Suplidores Unidos', item: 'Material de oficina', qty: 50, total: 45000, status: 'pendiente', date: '2026-06-01' },
    { id: 'OC-003', supplier: 'TecnoParts', item: 'Servidores', qty: 2, total: 180000, status: 'recibido', date: '2026-04-20' },
    { id: 'OC-004', supplier: 'Papelería Nacional', item: 'Papel y tóner', qty: 100, total: 25000, status: 'pendiente', date: '2026-06-05' },
    { id: 'OC-005', supplier: 'Office Depot', item: 'Sillas ergonómicas', qty: 8, total: 96000, status: 'recibido', date: '2026-05-25' },
  ],
  products: [
    { id: 'P001', name: 'Laptop Pro 15', price: 45000, stock: 12, sales: 34, category: 'Electrónica' },
    { id: 'P002', name: 'Monitor 27" 4K', price: 22000, stock: 8, sales: 18, category: 'Electrónica' },
    { id: 'P003', name: 'Teclado Mecánico', price: 5500, stock: 25, sales: 42, category: 'Accesorios' },
    { id: 'P004', name: 'Mouse Inalámbrico', price: 3200, stock: 30, sales: 56, category: 'Accesorios' },
    { id: 'P005', name: 'Webcam HD Pro', price: 8500, stock: 15, sales: 21, category: 'Electrónica' },
    { id: 'P006', name: 'Audífonos Bluetooth', price: 6500, stock: 3, sales: 28, category: 'Audio' },
  ],
  tasks: [
    { title: 'Diseñar landing page', project: 'Cliente A', priority: 'alta', status: 'todo', assignee: 'Juan' },
    { title: 'Configurar servidor', project: 'Interno', priority: 'alta', status: 'doing', assignee: 'María' },
    { title: 'Revisión de código', project: 'SaaS', priority: 'media', status: 'doing', assignee: 'Juan' },
    { title: 'Pruebas de integración', project: 'Cliente B', priority: 'media', status: 'todo', assignee: 'Rosa' },
    { title: 'Optimización DB', project: 'Interno', priority: 'media', status: 'todo', assignee: 'José' },
    { title: 'Documentación API', project: 'SaaS', priority: 'baja', status: 'done', assignee: 'José' },
    { title: 'Corrección de bugs', project: 'Cliente A', priority: 'alta', status: 'done', assignee: 'María' },
  ],
  meetings: [
    { title: 'Revisión trimestral', date: '2026-06-15', time: '10:00', attendees: 8, room: 'Sala A' },
    { title: 'Demo con cliente', date: '2026-06-16', time: '14:00', attendees: 4, room: 'Sala Virtual' },
    { title: 'Planning sprint', date: '2026-06-17', time: '09:00', attendees: 6, room: 'Sala B' },
    { title: 'Entrevista candidato', date: '2026-06-18', time: '11:30', attendees: 3, room: 'Oficina 3' },
    { title: 'Presentación resultados', date: '2026-06-19', time: '15:00', attendees: 12, room: 'Auditorio' },
  ],
  roles: [
    { name: 'Administrador', users: 2, modules: ['Todos'], permissions: 'total', level: 4 },
    { name: 'Gerente', users: 5, modules: ['Dashboard', 'RRHH', 'Compras', 'Facturación', 'Informes'], permissions: 'alto', level: 3 },
    { name: 'Ventas', users: 8, modules: ['CRM', 'Ventas', 'Agenda', 'Tareas', 'Chat'], permissions: 'medio', level: 2 },
    { name: 'Empleado', users: 15, modules: ['Tareas', 'Agenda', 'Perfil', 'Chat'], permissions: 'básico', level: 1 },
  ],
  chats: [
    { id: 'chat_1', name: 'Ana Rosario', lastMessage: 'Ok, entonces quedamos en eso', time: '10:32', unread: 2, online: true, messages: [
      { from: 'them', text: 'Hola, ¿cómo vamos con la cotización?', time: '09:15' },
      { from: 'me', text: 'Ya casi la tengo lista', time: '09:20' },
      { from: 'them', text: 'Perfecto, me urge para esta semana', time: '09:22' },
      { from: 'me', text: 'Te envío el desglose en la tarde', time: '09:30' },
      { from: 'them', text: 'Ok, entonces quedamos en eso', time: '10:32' },
    ]},
    { id: 'chat_2', name: 'Carlos Méndez', lastMessage: 'Recibí el pago, gracias', time: 'Ayer', unread: 0, online: false, messages: [
      { from: 'them', text: 'Buenos días, ya transferí el primer pago', time: 'Ayer 08:00' },
      { from: 'me', text: 'Perfecto, lo verifico y te confirmo', time: 'Ayer 08:15' },
      { from: 'them', text: 'Recibí el pago, gracias', time: 'Ayer 16:42' },
    ]},
    { id: 'chat_3', name: 'Sofía Reyes', lastMessage: '¿Puedes agendar la reunión?', time: 'Lun', unread: 1, online: true, messages: [
      { from: 'them', text: 'Hola, necesitamos coordinar la capacitación', time: 'Lun 14:00' },
      { from: 'me', text: 'Claro, ¿qué día te queda bien?', time: 'Lun 14:10' },
      { from: 'them', text: '¿Puedes agendar la reunión?', time: 'Lun 14:15' },
    ]},
  ],
}

function seedAll(force = false) {
  // Hash seed passwords with bcrypt
  const seedCopy = JSON.parse(JSON.stringify(SEED_DATA))
  if (seedCopy.users) {
    seedCopy.users = seedCopy.users.map(u => ({
      ...u,
      password: bcrypt.hashSync(u.password, 12),
    }))
  }
  Object.entries(seedCopy).forEach(([store, data]) => {
    const key = `${DB_PREFIX}${store}`
    if (!localStorage.getItem(key) || JSON.parse(localStorage.getItem(key)).length === 0) {
      localStorage.setItem(key, JSON.stringify(data))
    }
  })
  const existingProducts = getStore('products')
  if (existingProducts.length > 0 && !existingProducts[0].id) {
    setStore('products', SEED_DATA.products)
  }
  const existingContacts = getStore('contacts')
  if (existingContacts.length > 0 && !existingContacts[0].id) {
    existingContacts.forEach((c, i) => { c.id = `CLI-${String(i + 1).padStart(3, '0')}`; c.createdAt = new Date().toISOString(); c.updatedAt = new Date().toISOString() })
    setStore('contacts', existingContacts)
  }
  const existingUsers = getStore('users')
  if (existingUsers.length > 0 && !existingUsers[0].permissions) {
    existingUsers.forEach(u => {
      u.permissions = u.role === 'admin' ? ['factura_cliente', 'factura_proveedor', 'caja', 'contabilidad', 'todos'] : ['factura_cliente']
      u.updatedAt = new Date().toISOString()
    })
    setStore('users', existingUsers)
  }
  if (force) {
    const forceCopy = JSON.parse(JSON.stringify(SEED_DATA))
    if (forceCopy.users) {
      forceCopy.users = forceCopy.users.map(u => ({
        ...u,
        password: bcrypt.hashSync(u.password, 12),
      }))
    }
    Object.entries(forceCopy).forEach(([store, data]) => {
      const key = `${DB_PREFIX}${store}`
      localStorage.setItem(key, JSON.stringify(data))
    })
  }
  addAudit({ action: 'system_seed', store: 'system', detail: 'Datos iniciales cargados', userId: 'system' })
}

init()
seedAll()

export default {
  getById, getAll, query, insert, update, remove, clear,
  addAudit, getAudit, STORES, init, seedAll,
}
