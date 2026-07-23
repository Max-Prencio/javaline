import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiCalendar, FiPlus, FiX, FiClock, FiUsers, FiMapPin } from 'react-icons/fi'
import { meetingService } from '../services/entityService'
import { useAuth } from '../contexts/AuthContext'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const weekStart = new Date(2026, 5, 15)
const WEEK = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(weekStart)
  d.setDate(weekStart.getDate() + i)
  return d
})

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 },
  }),
}

export default function Scheduling() {
  const [meetings, setMeetings] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', attendees: '', room: '' })
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const userId = user?.userId || user?.id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await meetingService.list()
      setMeetings(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.date) return
    await meetingService.create({ ...form, attendees: Number(form.attendees) || 0 }, userId)
    setOpen(false)
    setForm({ title: '', date: '', time: '', attendees: '', room: '' })
    load()
  }

  if (loading) return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div className="spinner" /></div>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FiCalendar className="text-aqua-400" />
            Agenda
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona eventos, reuniones y calendario semanal</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-aqua-500 hover:bg-aqua-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <FiPlus size={15} />
          Nuevo Evento
        </button>
      </div>

      <div className="bg-dark-800 border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/[0.04]">
          {DAYS.map((d) => (
            <div
              key={d}
              className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 border-r last:border-r-0 border-white/[0.04]"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {WEEK.map((day, i) => {
            const dayStr = day.toISOString().slice(0, 10)
            const dayMeetings = meetings.filter((m) => m.date === dayStr)
            return (
              <div
                key={i}
                className="min-h-[90px] p-2 border-r last:border-r-0 border-b border-white/[0.04]"
              >
                <span className="text-xs text-gray-500">{day.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {dayMeetings.map((m) => (
                    <div
                      key={m.title}
                      className="text-[10px] leading-tight px-1.5 py-1 rounded bg-aqua-500/10 text-aqua-300 border-l-2 border-aqua-400 truncate"
                      title={m.title}
                    >
                      {m.time} {m.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Próximos Eventos</h2>
        <div className="space-y-3">
          {meetings.map((m, i) => (
            <motion.div
              key={m.title + m.date}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-dark-800 border border-aqua-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><FiCalendar size={12} />{m.date}</span>
                  <span className="flex items-center gap-1"><FiClock size={12} />{m.time}</span>
                  <span className="flex items-center gap-1"><FiUsers size={12} />{m.attendees} asistentes</span>
                  <span className="flex items-center gap-1"><FiMapPin size={12} />{m.room}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-md crystal border border-white/[0.08] rounded-2xl p-6"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>

              <h2 className="text-lg font-bold text-white mb-1">Nuevo Evento</h2>
              <p className="text-sm text-gray-500 mb-5">Agenda una reunión o evento en el calendario</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Título</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Nombre del evento"
                    className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/[0.06] rounded-lg text-white placeholder-gray-600 outline-none focus:border-aqua-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fecha</label>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/[0.06] rounded-lg text-white outline-none focus:border-aqua-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hora</label>
                  <input
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/[0.06] rounded-lg text-white outline-none focus:border-aqua-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Asistentes</label>
                  <input
                    name="attendees"
                    type="number"
                    min="1"
                    value={form.attendees}
                    onChange={handleChange}
                    placeholder="Número de asistentes"
                    className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/[0.06] rounded-lg text-white placeholder-gray-600 outline-none focus:border-aqua-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sala / Ubicación</label>
                  <input
                    name="room"
                    value={form.room}
                    onChange={handleChange}
                    placeholder="Sala, oficina o enlace virtual"
                    className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/[0.06] rounded-lg text-white placeholder-gray-600 outline-none focus:border-aqua-500/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-aqua-500 hover:bg-aqua-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Guardar Evento
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
