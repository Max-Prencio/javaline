export const INVOICES = [
  { id: 'INV-001', client: 'Tech Solutions SRL', amount: 45000, status: 'pagada', date: '2026-05-28' },
  { id: 'INV-002', client: 'Distribuidora Ortiz', amount: 120000, status: 'pendiente', date: '2026-06-01' },
  { id: 'INV-003', client: 'Clínica Central', amount: 85000, status: 'vencida', date: '2026-05-15' },
  { id: 'INV-004', client: 'Grupo Moya', amount: 32000, status: 'pagada', date: '2026-06-05' },
  { id: 'INV-005', client: 'Agencia Nova', amount: 67000, status: 'pendiente', date: '2026-06-10' },
  { id: 'INV-006', client: 'Distribuidora Ortiz', amount: 94000, status: 'pagada', date: '2026-06-12' },
  { id: 'INV-007', client: 'Tech Solutions SRL', amount: 28000, status: 'vencida', date: '2026-05-20' },
  { id: 'INV-008', client: 'Grupo Moya', amount: 150000, status: 'pendiente', date: '2026-06-15' },
]

export const CONTACTS = [
  { name: 'Carlos Méndez', company: 'Tech Solutions', email: 'carlos@techsol.com', phone: '809-555-0101', stage: 'cliente' },
  { name: 'Ana Rosario', company: 'Distribuidora Ortiz', email: 'ana@ortiz.com', phone: '809-555-0102', stage: 'negociación' },
  { name: 'Luis Peña', company: 'Clínica Central', email: 'luis@clincentral.com', phone: '809-555-0103', stage: 'lead' },
  { name: 'Sofía Reyes', company: 'Grupo Moya', email: 'sofia@grupomoya.com', phone: '809-555-0104', stage: 'cliente' },
  { name: 'Pedro Jiménez', company: 'Agencia Nova', email: 'pedro@novard.com', phone: '809-555-0105', stage: 'lead' },
  { name: 'Laura Castillo', company: 'Distribuidora Ortiz', email: 'laura@ortiz.com', phone: '809-555-0106', stage: 'negociación' },
  { name: 'Roberto Santos', company: 'Tech Solutions', email: 'roberto@techsol.com', phone: '809-555-0107', stage: 'cliente' },
]

export const EMPLOYEES = [
  { name: 'María García', department: 'Ventas', position: 'Ejecutiva de Ventas', salary: 45000, hireDate: '2024-03-01' },
  { name: 'Juan Pérez', department: 'TI', position: 'Desarrollador Senior', salary: 65000, hireDate: '2023-08-15' },
  { name: 'Rosa Martínez', department: 'RRHH', position: 'Coordinadora', salary: 38000, hireDate: '2025-01-10' },
  { name: 'José López', department: 'Finanzas', position: 'Contador', salary: 42000, hireDate: '2024-06-20' },
  { name: 'Carmen Díaz', department: 'Marketing', position: 'Especialista Digital', salary: 40000, hireDate: '2025-03-05' },
  { name: 'David Torres', department: 'Ventas', position: 'Gerente de Ventas', salary: 55000, hireDate: '2023-11-01' },
]

export const PURCHASES = [
  { id: 'OC-001', supplier: 'Office Depot', item: 'Equipos de cómputo', qty: 10, total: 280000, status: 'recibido' },
  { id: 'OC-002', supplier: 'Suplidores Unidos', item: 'Material de oficina', qty: 50, total: 45000, status: 'pendiente' },
  { id: 'OC-003', supplier: 'TecnoParts', item: 'Servidores', qty: 2, total: 180000, status: 'recibido' },
  { id: 'OC-004', supplier: 'Papelería Nacional', item: 'Papel y tóner', qty: 100, total: 25000, status: 'pendiente' },
  { id: 'OC-005', supplier: 'Office Depot', item: 'Sillas ergonómicas', qty: 8, total: 96000, status: 'recibido' },
]

export const MEETINGS = [
  { title: 'Revisión trimestral', date: '2026-06-15', time: '10:00', attendees: 8, room: 'Sala A' },
  { title: 'Demo con cliente', date: '2026-06-16', time: '14:00', attendees: 4, room: 'Sala Virtual' },
  { title: 'Planning sprint', date: '2026-06-17', time: '09:00', attendees: 6, room: 'Sala B' },
  { title: 'Entrevista candidato', date: '2026-06-18', time: '11:30', attendees: 3, room: 'Oficina 3' },
  { title: 'Presentación resultados', date: '2026-06-19', time: '15:00', attendees: 12, room: 'Auditorio' },
]

export const PRODUCTS = [
  { name: 'Laptop Pro 15', price: 45000, stock: 12, sales: 34, category: 'Electrónica' },
  { name: 'Monitor 27" 4K', price: 22000, stock: 8, sales: 18, category: 'Electrónica' },
  { name: 'Teclado Mecánico', price: 5500, stock: 25, sales: 42, category: 'Accesorios' },
  { name: 'Mouse Inalámbrico', price: 3200, stock: 30, sales: 56, category: 'Accesorios' },
  { name: 'Webcam HD Pro', price: 8500, stock: 15, sales: 21, category: 'Electrónica' },
  { name: 'Audífonos Bluetooth', price: 6500, stock: 3, sales: 28, category: 'Audio' },
]

export const TASKS = [
  { title: 'Diseñar landing page', project: 'Cliente A', priority: 'alta', status: 'todo', assignee: 'Juan' },
  { title: 'Configurar servidor', project: 'Interno', priority: 'alta', status: 'doing', assignee: 'María' },
  { title: 'Revisión de código', project: 'SaaS', priority: 'media', status: 'doing', assignee: 'Juan' },
  { title: 'Pruebas de integración', project: 'Cliente B', priority: 'media', status: 'todo', assignee: 'Rosa' },
  { title: 'Documentación API', project: 'SaaS', priority: 'baja', status: 'done', assignee: 'José' },
  { title: 'Corrección de bugs', project: 'Cliente A', priority: 'alta', status: 'done', assignee: 'María' },
  { title: 'Optimización DB', project: 'Interno', priority: 'media', status: 'todo', assignee: 'José' },
]

export const ROLES = [
  { name: 'Administrador', users: 2, modules: ['Todos'], permissions: 'total' },
  { name: 'Gerente', users: 5, modules: ['Dashboard', 'RRHH', 'Compras', 'Facturación'], permissions: 'alto' },
  { name: 'Ventas', users: 8, modules: ['CRM', 'Ventas', 'Agenda', 'Tareas'], permissions: 'medio' },
  { name: 'Empleado', users: 15, modules: ['Tareas', 'Agenda', 'Perfil'], permissions: 'básico' },
]

export const CHATS = [
  {
    id: 1, name: 'Ana Rosario', avatar: null, lastMessage: 'Ok, entonces quedamos en eso', time: '10:32',
    unread: 2, online: true, messages: [
      { from: 'them', text: 'Hola, ¿cómo vamos con la cotización?', time: '09:15' },
      { from: 'me', text: 'Ya casi la tengo lista, solo reviso los últimos detalles', time: '09:20' },
      { from: 'them', text: 'Perfecto, me urge para esta semana', time: '09:22' },
      { from: 'me', text: 'Te envío el desglose en la tarde', time: '09:30' },
      { from: 'them', text: 'Ok, entonces quedamos en eso', time: '10:32' },
    ]
  },
  {
    id: 2, name: 'Carlos Méndez', avatar: null, lastMessage: 'Recibí el pago, gracias', time: 'Ayer',
    unread: 0, online: false, messages: [
      { from: 'them', text: 'Buenos días, ya transferí el primer pago', time: 'Ayer 08:00' },
      { from: 'me', text: 'Perfecto, lo verifico y te confirmo', time: 'Ayer 08:15' },
      { from: 'them', text: 'Recibí el pago, gracias', time: 'Ayer 16:42' },
    ]
  },
  {
    id: 3, name: 'Sofía Reyes', avatar: null, lastMessage: '¿Puedes agendar la reunión?', time: 'Lun',
    unread: 1, online: true, messages: [
      { from: 'them', text: 'Hola, necesitamos coordinar la capacitación', time: 'Lun 14:00' },
      { from: 'me', text: 'Claro, ¿qué día te queda bien?', time: 'Lun 14:10' },
      { from: 'them', text: '¿Puedes agendar la reunión?', time: 'Lun 14:15' },
    ]
  },
  {
    id: 4, name: 'Soporte Técnico', avatar: null, lastMessage: 'Ticket #452 resuelto ✅', time: 'Mar',
    unread: 0, online: false, messages: [
      { from: 'them', text: 'Reportamos incidencia en el servidor', time: 'Mar 09:00' },
      { from: 'me', text: 'Ya lo estamos revisando', time: 'Mar 09:05' },
      { from: 'them', text: 'Ticket #452 resuelto ✅', time: 'Mar 11:30' },
    ]
  },
]

export const MONTHLY_REVENUE = [
  { month: 'Ene', ingresos: 320000, gastos: 180000, facturas: 12 },
  { month: 'Feb', ingresos: 280000, gastos: 165000, facturas: 10 },
  { month: 'Mar', ingresos: 450000, gastos: 210000, facturas: 15 },
  { month: 'Abr', ingresos: 380000, gastos: 195000, facturas: 13 },
  { month: 'May', ingresos: 520000, gastos: 240000, facturas: 18 },
  { month: 'Jun', ingresos: 610000, gastos: 275000, facturas: 20 },
]
