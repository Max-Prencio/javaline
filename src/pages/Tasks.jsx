import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckSquare, FiPlus, FiX, FiUser, FiFlag, FiSearch } from 'react-icons/fi'
import { taskService } from '../services/entityService'

const COLUMNS = [
  { key: 'todo', label: 'Por Hacer', bg: 'var(--bg-elevated)' },
  { key: 'doing', label: 'En Proceso', bg: 'var(--accent-subtle)' },
  { key: 'done', label: 'Completadas', bg: 'var(--bg-card)' },
]

const PRIORITY = {
  alta: { bg: 'var(--danger)', color: 'white', icon: FiFlag },
  media: { bg: 'var(--warning)', color: 'white', icon: FiFlag },
  baja: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', icon: FiFlag },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
}

const defaultForm = { title: '', project: '', priority: 'media', assignee: '', status: 'todo' }

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '4px',
}

function TaskCard({ task }) {
  const PriorityIcon = PRIORITY[task.priority].icon
  return (
    <motion.div
      layout
      variants={itemAnim}
      style={{
        background: 'var(--bg-card)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid var(--border)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
          {task.title}
        </h4>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            background: PRIORITY[task.priority].bg,
            color: PRIORITY[task.priority].color,
            whiteSpace: 'nowrap',
          }}
        >
          <PriorityIcon style={{ width: '12px', height: '12px' }} />
          {task.priority}
        </span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{task.project}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <FiUser style={{ width: '12px', height: '12px' }} />
        {task.assignee}
      </div>
    </motion.div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [search, setSearch] = useState('')

  const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId

  const load = useCallback(async () => {
    const data = await taskService.list()
    setTasks(data)
  }, [])

  useEffect(() => { load() }, [load])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await taskService.create(form, userId)
    setForm(defaultForm)
    setOpen(false)
    load()
  }

  const filtered = tasks.filter((t) =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.project.toLowerCase().includes(search.toLowerCase()) ||
    t.assignee.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={itemAnim} className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Tareas
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Gestiona tus tareas y proyectos
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--accent-gradient)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <FiPlus style={{ width: '16px', height: '16px' }} />
          Nueva Tarea
        </button>
      </motion.div>

      <motion.div variants={itemAnim} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              width: '16px',
              height: '16px',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, proyecto o asignado..."
            style={{
              ...inputStyle,
              padding: '10px 12px 10px 36px',
            }}
          />
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.key)
          return (
            <div
              key={col.key}
              style={{
                background: col.bg,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                  {col.label}
                </h3>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                  }}
                >
                  {colTasks.length}
                </span>
              </div>
              <AnimatePresence>
                {colTasks.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </AnimatePresence>
              {colTasks.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' }}>
                  Sin tareas
                </p>
              )}
            </div>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(24px)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                width: '100%',
                maxWidth: '448px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Nueva Tarea
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    padding: '4px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <FiX style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Título</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Proyecto</label>
                  <input
                    name="project"
                    value={form.project}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Prioridad</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="todo">Por Hacer</option>
                      <option value="doing">En Proceso</option>
                      <option value="done">Completadas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Asignado</label>
                  <input
                    name="assignee"
                    value={form.assignee}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Crear Tarea
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
