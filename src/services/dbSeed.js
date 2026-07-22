import bcrypt from 'bcryptjs'
import { getStore, setStore, addAudit } from './dbStore.js'
import { DB_VERSION, DB_VERSION_KEY, runMigrations } from './dbMigrations.js'

const SEED_DATA = {
  users: [
    {
      id: 'user_admin', name: 'Maxwell', email: 'admin@javaline.app', password: '',
      role: 'admin', photo: null, phone: '+1 809-555-0100', position: 'Desarrollador Full Stack',
      bio: 'Creador de Javaline.', notificationEmail: 'admin@javaline.app',
      altEmail: 'maxwell@javaline.app', status: 'active',
      permissions: ['factura_cliente', 'factura_proveedor', 'caja', 'contabilidad', 'todos'],
      createdAt: '2026-01-01T00:00:00Z', mustChangePassword: true,
    },
  ],
  invoices: [
    { id: 'FAC-001', type: 'client', documentType: 'factura', date: '2026-05-28', dueDate: '2026-06-28', clientId: 'CLI-001', clientName: 'Tech Solutions SRL', clientType: 'company', rnc: '101-23456-7', currency: 'DOP', paymentType: 'debit', paymentMethod: 'transfer', items: [{ productId: 'P001', productName: 'Laptop Pro 15', qty: 1, price: 45000, total: 45000 }], subtotal: 45000, tax: 8100, total: 53100, status: 'paid', cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-05-28T10:00:00Z' },
    { id: 'FAC-002', type: 'client', documentType: 'factura', date: '2026-06-01', dueDate: '2026-07-01', clientId: 'CLI-002', clientName: 'Distribuidora Ortiz', clientType: 'company', rnc: '102-34567-8', currency: 'DOP', paymentType: 'credit', paymentMethod: 'transfer', items: [{ productId: 'P002', productName: 'Monitor 27" 4K', qty: 2, price: 22000, total: 44000 }, { productId: 'P003', productName: 'Teclado Mecánico', qty: 5, price: 5500, total: 27500 }], subtotal: 71500, tax: 12870, total: 84370, status: 'pending', cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-06-01T09:00:00Z' },
    { id: 'FAC-003', type: 'client', documentType: 'factura', date: '2026-05-15', dueDate: '2026-06-15', clientId: 'CLI-003', clientName: 'Clínica Central', clientType: 'company', rnc: '103-45678-9', currency: 'USD', paymentType: 'debit', paymentMethod: 'transfer', items: [{ productId: 'P005', productName: 'Webcam HD Pro', qty: 3, price: 8500, total: 25500 }], subtotal: 25500, tax: 4590, total: 30090, status: 'overdue', cashRegisterId: null, createdBy: 'user_admin', createdAt: '2026-05-15T11:00:00Z' },
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
    { id: 'CLI-001', name: 'Carlos Méndez', company: 'Tech Solutions', email: 'carlos@techsol.com', phone: '809-555-0101', stage: 'cliente', type: 'company', rnc: '101-23456-7', notes: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'CLI-002', name: 'Ana Rosario', company: 'Distribuidora Ortiz', email: 'ana@ortiz.com', phone: '809-555-0102', stage: 'negociación', type: 'company', rnc: '102-34567-8', notes: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'CLI-003', name: 'Luis Peña', company: 'Clínica Central', email: 'luis@clincentral.com', phone: '809-555-0103', stage: 'lead', type: 'company', rnc: '103-45678-9', notes: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'CLI-004', name: 'Sofía Reyes', company: 'Grupo Moya', email: 'sofia@grupomoya.com', phone: '809-555-0104', stage: 'cliente', type: 'company', rnc: '104-56789-0', notes: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'CLI-005', name: 'Pedro Jiménez', company: 'Agencia Nova', email: 'pedro@novard.com', phone: '809-555-0105', stage: 'lead', type: 'company', rnc: '105-67890-1', notes: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
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
  ],
  meetings: [
    { title: 'Revisión trimestral', date: '2026-06-15', time: '10:00', attendees: 8, room: 'Sala A' },
    { title: 'Demo con cliente', date: '2026-06-16', time: '14:00', attendees: 4, room: 'Sala Virtual' },
    { title: 'Planning sprint', date: '2026-06-17', time: '09:00', attendees: 6, room: 'Sala B' },
  ],
  roles: [
    { name: 'Administrador', users: 2, modules: ['Todos'], permissions: 'total', level: 4 },
    { name: 'Gerente', users: 5, modules: ['Dashboard', 'RRHH', 'Compras', 'Facturación', 'Informes'], permissions: 'alto', level: 3 },
    { name: 'Ventas', users: 8, modules: ['CRM', 'Ventas', 'Agenda', 'Tareas', 'Chat'], permissions: 'medio', level: 2 },
    { name: 'Empleado', users: 15, modules: ['Tareas', 'Agenda', 'Perfil', 'Chat'], permissions: 'básico', level: 1 },
  ],
  inventory: [
    { id: 'INV-001', name: 'Laptop Pro 15', sku: 'LPT-001', category: 'Electrónica', stock: 12, minStock: 5, price: 45000, cost: 35000, location: 'Almacén A', unit: 'unidad', active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'INV-002', name: 'Monitor 27" 4K', sku: 'MON-001', category: 'Electrónica', stock: 8, minStock: 3, price: 22000, cost: 17000, location: 'Almacén A', unit: 'unidad', active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'INV-003', name: 'Teclado Mecánico', sku: 'TCL-001', category: 'Accesorios', stock: 25, minStock: 10, price: 5500, cost: 3200, location: 'Almacén B', unit: 'unidad', active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'INV-004', name: 'Mouse Inalámbrico', sku: 'MOU-001', category: 'Accesorios', stock: 30, minStock: 15, price: 3200, cost: 1800, location: 'Almacén B', unit: 'unidad', active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'INV-005', name: 'Webcam HD Pro', sku: 'WBC-001', category: 'Electrónica', stock: 15, minStock: 5, price: 8500, cost: 5500, location: 'Almacén A', unit: 'unidad', active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'INV-006', name: 'Audífonos Bluetooth', sku: 'AUD-001', category: 'Audio', stock: 3, minStock: 10, price: 6500, cost: 3800, location: 'Almacén B', unit: 'unidad', active: true, createdAt: '2026-01-01T00:00:00Z' },
  ],
  stockMovements: [
    { id: 'MOV-001', productId: 'INV-006', productName: 'Audífonos Bluetooth', sku: 'AUD-001', quantity: -2, type: 'out', reason: 'Venta a cliente', beforeStock: 5, afterStock: 3, userId: 'user_admin', date: '2026-06-10T10:00:00Z' },
    { id: 'MOV-002', productId: 'INV-007', productName: 'Silla Ergonómica', sku: 'SIL-001', quantity: 8, type: 'in', reason: 'Recepción OC-005', beforeStock: 0, afterStock: 8, userId: 'user_admin', date: '2026-05-25T14:00:00Z' },
  ],
  ncf_sequences: [
    { id: 'NCF-B01', type: 'B01', name: 'Crédito Fiscal', sequence: 1, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'NCF-B02', type: 'B02', name: 'Consumidor Final', sequence: 1, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'NCF-B04', type: 'B04', name: 'Nota de Crédito', sequence: 1, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'NCF-B14', type: 'B14', name: 'Régimen Especial', sequence: 1, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'NCF-B15', type: 'B15', name: 'Gubernamental', sequence: 1, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'NCF-B34', type: 'B34', name: 'Nota de Débito', sequence: 1, active: true, createdAt: '2026-01-01T00:00:00Z' },
  ],
}

export function seedAll(force = false) {
  const seedCopy = JSON.parse(JSON.stringify(SEED_DATA))
  if (seedCopy.users) {
    seedCopy.users = seedCopy.users.map(u => {
      if (u.mustChangePassword) {
        const tempPw = crypto.randomUUID()
        try { sessionStorage.setItem('javaline_first_login_pw', tempPw) } catch {}
        return { ...u, password: bcrypt.hashSync(tempPw, 10) }
      }
      return { ...u, password: u.password ? bcrypt.hashSync(u.password, 10) : '' }
    })
  }

  if (force) {
    Object.entries(seedCopy).forEach(([store, data]) => setStore(store, data))
    localStorage.setItem(DB_VERSION_KEY, String(DB_VERSION))
    addAudit({ action: 'system_reset', store: 'system', detail: 'Base de datos reiniciada', userId: 'system' })
    return
  }

  let seeded = false
  Object.entries(seedCopy).forEach(([store, data]) => {
    if (getStore(store).length === 0) {
      setStore(store, data)
      seeded = true
    }
  })

  if (seeded) {
    localStorage.setItem(DB_VERSION_KEY, String(DB_VERSION))
    addAudit({ action: 'system_seed', store: 'system', detail: 'Datos iniciales cargados', userId: 'system' })
  }

  runMigrations()
}
