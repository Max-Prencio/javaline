import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiUsers, FiPlus, FiX, FiMail, FiPhone, FiUser, FiSearch } from 'react-icons/fi'
import { CONTACTS } from '../data/seed'

const STAGES = [
  { key: 'lead', label: 'Leads', borderColor: 'var(--accent)' },
  { key: 'negociación', label: 'Negociación', borderColor: 'var(--warning)' },
  { key: 'cliente', label: 'Clientes', borderColor: 'var(--success)' },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 },
  }),
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

export default function CRM() {
  const [contacts, setContacts] = useState(CONTACTS)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', stage: 'lead' })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    setContacts([...contacts, { ...form, id: Date.now().toString() }])
    setOpen(false)
    setForm({ name: '', company: '', email: '', phone: '', stage: 'lead' })
  }

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUsers style={{ color: 'var(--accent)' }} />
            CRM
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Gestiona tus relaciones con clientes y leads comerciales</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch
              size={14}
              style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Buscar contactos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '' }}
              style={{
                padding: '8px 12px 8px 32px', fontSize: '0.875rem',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)',
                outline: 'none', width: '200px', transition: 'border-color 0.2s',
              }}
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: 'var(--accent)',
              color: '#fff', fontSize: '0.875rem', fontWeight: 500,
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <FiPlus size={15} />
            Añadir Contacto
          </button>
        </div>
      </div>

      <div className="crm-grid">
        {STAGES.map(({ key, label, borderColor }) => {
          const items = filteredContacts.filter((c) => c.stage === key)
          return (
            <div
              key={key}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                <span
                  style={{
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    background: 'var(--bg-primary)',
                    padding: '2px 8px', borderRadius: '9999px',
                  }}
                >
                  {items.length}
                </span>
              </div>
              <motion.div
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {items.length > 0 ? items.map((c, i) => (
                  <motion.div
                    key={c.id || c.email || i}
                    custom={i}
                    variants={cardVariants}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '12px',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: 'var(--bg-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <FiUser size={12} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{c.company}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMail size={11} />{c.email}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiPhone size={11} />{c.phone}</span>
                    </div>
                  </motion.div>
                )) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Sin contactos</p>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                position: 'relative', width: '100%', maxWidth: '448px',
                background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
                border: '1px solid var(--border)', borderRadius: '16px', padding: '24px',
              }}
            >
              <button
                onClick={() => setOpen(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px', padding: '4px',
                  color: 'var(--text-muted)', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <FiX size={18} />
              </button>

              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Nuevo Contacto</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Añade un contacto al pipeline comercial</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'name', label: 'Nombre', placeholder: 'Nombre completo', type: 'text' },
                  { name: 'company', label: 'Empresa', placeholder: 'Nombre de la empresa', type: 'text' },
                  { name: 'email', label: 'Email', placeholder: 'correo@ejemplo.com', type: 'email' },
                  { name: 'phone', label: 'Teléfono', placeholder: '809-555-0000', type: 'text' },
                ].map(({ name, label, placeholder, type }) => (
                  <div key={name}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</label>
                    <input
                      name={name}
                      type={type}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '' }}
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: '0.875rem',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--text-primary)',
                        outline: 'none', transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Etapa</label>
                  <select
                    name="stage"
                    value={form.stage}
                    onChange={handleChange}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '' }}
                    style={{
                      width: '100%', padding: '8px 12px', fontSize: '0.875rem',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-primary)',
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                  >
                    <option value="lead">Lead</option>
                    <option value="negociación">Negociación</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>
                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '10px 0',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: '0.875rem', fontWeight: 500,
                    borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Guardar Contacto
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .crm-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 768px) { .crm-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </div>
  )
}
