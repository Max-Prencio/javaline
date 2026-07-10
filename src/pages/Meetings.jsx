import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiVideo, FiPlus, FiX, FiClock, FiUsers, FiMapPin, FiCalendar } from 'react-icons/fi'
import { meetingService } from '../services/entityService'

const today = new Date().toISOString().slice(0, 10)

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Meetings() {
  const [meetings, setMeetings] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', attendees: '', room: '' })

  const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').id

  const load = useCallback(async () => {
    const data = await meetingService.list()
    setMeetings(data)
  }, [])

  useEffect(() => { load() }, [load])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.date) return
    await meetingService.create({ ...form, attendees: Number(form.attendees) || 1 }, userId)
    setOpen(false)
    setForm({ title: '', date: '', time: '', attendees: '', room: '' })
    load()
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FiVideo className="text-aqua-400" />
            Reuniones
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Programa y gestiona todas tus reuniones</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-aqua-500 hover:bg-aqua-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <FiPlus size={15} />
          Programar Reunión
        </button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {meetings.map((m) => {
          const isToday = m.date === today
          return (
            <motion.div
              key={`${m.title}-${m.date}-${m.time}`}
              variants={item}
              className="relative overflow-hidden rounded-xl bg-dark-800 border border-white/[0.04] p-5 group hover:border-aqua-500/30 transition-all hover:shadow-lg hover:shadow-aqua-500/5"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-aqua-500/30 group-hover:bg-aqua-500/60 transition-colors" />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-aqua-500/10 border border-aqua-500/20 flex items-center justify-center">
                    <FiVideo size={16} className="text-aqua-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      {m.title}
                      {isToday && (
                        <span className="w-2 h-2 rounded-full bg-teal-400 inline-block flex-shrink-0" />
                      )}
                    </h3>
                    {isToday && (
                      <span className="text-[10px] text-teal-400 font-medium">Hoy</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pl-11">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FiCalendar size={13} className="text-gray-500" />
                  {m.date}
                  <span className="text-gray-600">|</span>
                  <FiClock size={13} className="text-gray-500" />
                  {m.time}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FiUsers size={13} className="text-gray-500" />
                  {m.attendees} asistentes
                  <span className="text-gray-600">|</span>
                  <FiMapPin size={13} className="text-gray-500" />
                  {m.room}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

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

              <h2 className="text-lg font-bold text-white mb-1">Programar Reunión</h2>
              <p className="text-sm text-gray-500 mb-5">Completa los detalles para agendar una nueva reunión</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Título</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Título de la reunión"
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
                    placeholder="Sala o ubicación"
                    className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/[0.06] rounded-lg text-white placeholder-gray-600 outline-none focus:border-aqua-500/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-aqua-500 hover:bg-aqua-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Guardar Reunión
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
