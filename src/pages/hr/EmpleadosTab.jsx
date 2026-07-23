import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheck, FiBriefcase,
  FiFileText, FiCalendar, FiUsers, FiUserCheck, FiLink,
} from 'react-icons/fi'
import api from '../../services/apiClient'
import DatePicker from '../../components/DatePicker'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { SalaryField, EmptyState, FormField, inputStyle, btnPrimary, btnOutline, btnDanger, cardStyle, item } from './shared.jsx'
import { formatDate } from '../../utils/format'

/* ═══════════════════════════════════════════════════════════════
   EMPLEADOS TAB
   ═══════════════════════════════════════════════════════════════ */
function EmpleadosTab({ employees, departments, reload }) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmp, setEditEmp] = useState(null)
  const emptyForm = {
    name: '', email: '', phone: '', department: '', position: '', salary: '',
    salary_type: 'mensual', hire_date: '', contract_end_date: '', contract_type: 'indefinido',
    status: 'activo', rnc: '', tss_number: '', ars: '', afp: '', bank_account: '',
    emergency_contact: '', emergency_phone: '', punch_enabled: false,
  }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !search || (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(search.toLowerCase()) || (e.position || '').toLowerCase().includes(search.toLowerCase())
      const matchDept = !deptFilter || e.department === deptFilter
      const matchStatus = !statusFilter || e.status === statusFilter
      return matchSearch && matchDept && matchStatus
    })
  }, [employees, search, deptFilter, statusFilter])

  const openCreate = () => { setEditEmp(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (emp) => {
    setEditEmp(emp)
    setForm({
      name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
      department: emp.department || '', position: emp.position || '',
      salary: emp.salary || '', salary_type: emp.salary_type || 'mensual',
      hire_date: emp.hire_date || '', contract_end_date: emp.contract_end_date || '',
      contract_type: emp.contract_type || 'indefinido', status: emp.status || 'activo',
      rnc: emp.rnc || '', tss_number: emp.tss_number || '', ars: emp.ars || '',
      afp: emp.afp || '', bank_account: emp.bank_account || '',
      emergency_contact: emp.emergency_contact || '', emergency_phone: emp.emergency_phone || '',
      punch_enabled: emp.punch_enabled || false,
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = { ...form, salary: Number(form.salary) || 0 }
    try {
      if (editEmp) {
        await api.put(`/hr/employees/${editEmp.id}`, payload)
      } else {
        await api.post('/hr/employees', payload)
      }
      setModalOpen(false); reload()
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este empleado?')) return
    try { await api.delete(`/hr/employees/${id}`); reload() } catch (e) { alert(e.message) }
  }

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input placeholder="Buscar empleados..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '10px 14px', minWidth: 140 }}>
          <option value="">Todos los deptos.</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '10px 14px', minWidth: 120 }}>
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openCreate} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Empleado
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(emp => (
          <motion.div key={emp.id || emp.name} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12, padding: 18, transition: 'border-color 0.2s', cursor: 'default' }}
            whileHover={{ borderColor: 'var(--accent-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden' }}>
                {emp.photo_url ? <img src={emp.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (emp.name || '?')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{emp.position || '—'}</p>
              </div>
              <Badge status={emp.status || 'activo'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBriefcase size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>{emp.department || '—'}</span>
              </div>
              {emp.contract_type && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiFileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ textTransform: 'capitalize' }}>{emp.contract_type}</span>
              </div>}
              <SalaryField salary={emp.salary} salaryType={emp.salary_type} />
              {emp.hire_date && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCalendar size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>Ingreso: {formatDate(emp.hire_date)}</span>
              </div>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
              <button onClick={() => openEdit(emp)} style={{ ...btnOutline, flex: 1, fontSize: 11, padding: '7px 12px' }}>
                <FiEdit2 size={12} /> Editar
              </button>
              <button onClick={() => handleDelete(emp.id)} style={{ ...btnDanger, fontSize: 11, padding: '7px 12px' }}>
                <FiTrash2 size={12} />
              </button>
              {emp.user_id && (
                <button onClick={() => navigate(`/profile/${emp.user_id}`)} style={{ ...btnOutline, fontSize: 11, padding: '7px 12px' }}>
                  <FiLink size={12} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon={FiUsers} text="No se encontraron empleados" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editEmp ? 'Editar Empleado' : 'Nuevo Empleado'} icon={FiUserCheck} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Nombre completo"><input value={form.name} onChange={set('name')} required style={inputStyle} /></FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={set('email')} style={inputStyle} /></FormField>
            <FormField label="Teléfono"><input value={form.phone} onChange={set('phone')} style={inputStyle} /></FormField>
            <FormField label="Departamento">
              <select value={form.department} onChange={set('department')} style={inputStyle}>
                <option value="">Seleccionar...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                <option value="Administración">Administración</option>
                <option value="Ventas">Ventas</option>
                <option value="TI">TI</option>
                <option value="RRHH">RRHH</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Finanzas">Finanzas</option>
              </select>
            </FormField>
            <FormField label="Cargo"><input value={form.position} onChange={set('position')} style={inputStyle} /></FormField>
            <FormField label="Salario (RD$)"><input type="number" value={form.salary} onChange={set('salary')} style={inputStyle} /></FormField>
            <FormField label="Tipo de Salario">
              <select value={form.salary_type} onChange={set('salary_type')} style={inputStyle}>
                <option value="mensual">Mensual</option>
                <option value="quincenal">Quincenal</option>
                <option value="semanal">Semanal</option>
                <option value="diario">Diario</option>
              </select>
            </FormField>
            <DatePicker label="Fecha de Ingreso" value={form.hire_date} onChange={v => setForm({ ...form, hire_date: v })} />
            <DatePicker label="Fin de Contrato" value={form.contract_end_date} onChange={v => setForm({ ...form, contract_end_date: v })} />
            <FormField label="Tipo de Contrato">
              <select value={form.contract_type} onChange={set('contract_type')} style={inputStyle}>
                <option value="indefinido">Indefinido</option>
                <option value="temporal">Temporal</option>
                <option value="por_obras">Por Obras</option>
                <option value="prueba">Prueba</option>
              </select>
            </FormField>
            <FormField label="Estado">
              <select value={form.status} onChange={set('status')} style={inputStyle}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </FormField>
            <FormField label="RNC"><input value={form.rnc} onChange={set('rnc')} style={inputStyle} /></FormField>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>Información Legal y Bancaria</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <FormField label="# TSS/ISR"><input value={form.tss_number} onChange={set('tss_number')} style={inputStyle} /></FormField>
              <FormField label="ARS"><input value={form.ars} onChange={set('ars')} style={inputStyle} /></FormField>
              <FormField label="AFP"><input value={form.afp} onChange={set('afp')} style={inputStyle} /></FormField>
              <FormField label="# Cuenta Bancaria"><input value={form.bank_account} onChange={set('bank_account')} style={inputStyle} /></FormField>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>Contacto de Emergencia</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Nombre"><input value={form.emergency_contact} onChange={set('emergency_contact')} style={inputStyle} /></FormField>
              <FormField label="Teléfono"><input value={form.emergency_phone} onChange={set('emergency_phone')} style={inputStyle} /></FormField>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={form.punch_enabled} onChange={set('punch_enabled')} id="punch" style={{ accentColor: 'var(--accent)' }} />
            <label htmlFor="punch" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Habilitar reloj de control de asistencia</label>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ ...btnOutline }}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}>
              <FiCheck size={15} /> {editEmp ? 'Guardar Cambios' : 'Crear Empleado'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default EmpleadosTab
