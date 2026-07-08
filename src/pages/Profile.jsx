import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiCamera, FiUser, FiMail, FiPhone, FiEdit2, FiCheck, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, updateProfile, updatePhoto } = useAuth()
  const fileInputRef = useRef()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || '',
    bio: user?.bio || '',
    notificationEmail: user?.notificationEmail || '',
    altEmail: user?.altEmail || '',
  })

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      setSaving(true)
      const ok = await updatePhoto(ev.target.result)
      setFeedback({ type: ok ? 'success' : 'error', message: ok ? 'Foto actualizada' : 'Error al actualizar foto' })
      setTimeout(() => setFeedback(null), 3000)
      setSaving(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFeedback({ type: 'error', message: 'El nombre es requerido' }); setTimeout(() => setFeedback(null), 3000); return }
    setSaving(true)
    const ok = await updateProfile(form)
    if (ok) setEditing(false)
    setFeedback({ type: ok ? 'success' : 'error', message: ok ? 'Perfil actualizado correctamente' : 'Error al guardar' })
    setTimeout(() => setFeedback(null), 3000)
    setSaving(false)
  }

  const Box = ({ children, className = '' }) => (
    <div className={`rounded-xl p-5 ${className}`}
      style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
      {children}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>Mi Perfil</motion.h1>

      {feedback && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{
            background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
          {feedback.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
          {feedback.message}
        </motion.div>
      )}

      <Box>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden"
              style={{background: 'var(--accent-subtle)', border: '2px solid var(--accent-border)'}}>
              {user?.photo ? (
                <img src={user.photo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiUser size={36} style={{color: 'var(--accent)'}} />
                </div>
              )}
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{background: 'var(--accent)', color: '#fff'}}>
              <FiCamera size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold" style={{color: 'var(--text-primary)'}}>
                {editing ? (
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="bg-transparent border-b-2 outline-none w-full pb-0.5"
                    style={{borderColor: 'var(--accent)', color: 'var(--text-primary)'}} />
                ) : user?.name}
              </h2>
              <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{background: editing ? 'var(--accent)' : 'var(--accent-subtle)', color: editing ? '#fff' : 'var(--accent)', opacity: saving ? 0.6 : 1}}>
                {editing ? <><FiSave size={14} /> {saving ? 'Guardando…' : 'Guardar'}</> : <><FiEdit2 size={14} /> Editar</>}
              </button>
            </div>
            <p className="text-sm mt-1" style={{color: 'var(--text-secondary)'}}>
              {editing ? (
                <input value={form.position} onChange={e => setForm({...form, position: e.target.value})}
                  className="bg-transparent border-b outline-none"
                  style={{borderColor: 'var(--border)', color: 'var(--text-secondary)'}} />
              ) : user?.position}
            </p>
            {editing ? (
              <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                className="w-full mt-3 rounded-lg p-3 text-sm outline-none resize-none"
                style={{background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)'}}
                rows={3} />
            ) : (
              <p className="text-sm mt-3" style={{color: 'var(--text-muted)'}}>{user?.bio}</p>
            )}
          </div>
        </div>
      </Box>

      <Box>
        <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Datos Personales</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: FiMail, label: 'Correo principal', value: form.email, key: 'email' },
            { icon: FiPhone, label: 'Teléfono', value: form.phone, key: 'phone' },
          ].map(({ icon: Icon, label, value, key }) => (
            <div key={key} className="flex items-center gap-3 p-3 rounded-lg" style={{background: 'var(--bg-secondary)'}}>
              <Icon size={16} style={{color: 'var(--accent)'}} />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{color: 'var(--text-muted)'}}>{label}</p>
                {editing ? (
                  <input value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    className="bg-transparent border-b text-sm outline-none"
                    style={{borderColor: 'var(--border)', color: 'var(--text-primary)'}} />
                ) : (
                  <p className="text-sm" style={{color: 'var(--text-primary)'}}>{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Box>

      <Box>
        <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--text-primary)'}}>
          Notificaciones por Correo
        </h3>
        <p className="text-xs mb-4" style={{color: 'var(--text-muted)'}}>
          Selecciona a qué correo deseas recibir las notificaciones del sistema.
        </p>
        {[
          { label: 'Principal', value: form.notificationEmail, key: 'notificationEmail', desc: 'admin@javaline.app' },
          { label: 'Alternativo', value: form.altEmail, key: 'altEmail', desc: 'maxwell@javaline.app' },
        ].map(({ label, value, key, desc }) => (
          <label key={key}
            className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all"
            style={{background: key === 'notificationEmail' && !editing ? 'var(--accent-subtle)' : 'var(--bg-secondary)'}}>
            <input type="radio" name="notifEmail" checked={form.notificationEmail === value}
              onChange={() => setForm({...form, notificationEmail: value})}
              className="accent-amber-500" disabled={!editing} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{color: 'var(--text-primary)'}}>{label}</p>
              {editing ? (
                <input value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                  className="bg-transparent border-b text-xs outline-none w-full"
                  style={{borderColor: 'var(--border)', color: 'var(--text-muted)'}} />
              ) : (
                <p className="text-xs" style={{color: 'var(--text-muted)'}}>{desc}</p>
              )}
            </div>
          </label>
        ))}
      </Box>
    </div>
  )
}
