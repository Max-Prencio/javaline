import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import securityService from '../services/securityService'

export default function Register() {
  const { register, error } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!form.name || !form.email || !form.password) { setLocalError('Completa todos los campos'); return }
    if (form.password !== form.confirm) { setLocalError('Las contraseñas no coinciden'); return }
    const pwCheck = securityService.validatePassword(form.password)
    if (!pwCheck.valid) { setLocalError(pwCheck.errors[0]); return }
    setLoading(true)
    const ok = await register({ name: form.name, email: form.email, password: form.password })
    if (ok) navigate('/')
    setLoading(false)
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgOrb1} /><div style={styles.bgOrb2} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
        <div style={styles.header}>
          <Link to="/login" style={styles.backLink}>← Volver</Link>
          <h1 style={styles.logo}><span style={styles.logoJ}>Javali</span><span style={styles.logoNe}>ne</span></h1>
          <p style={styles.subtitle}>Crea tu cuenta gratuita</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {(localError || error) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.error}>
              {localError || error}
            </motion.div>
          )}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre</label>
            <div style={styles.inputWrap}>
              <FiUser style={styles.inputIcon} />
              <input placeholder="Tu nombre" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={styles.input} autoFocus />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo</label>
            <div style={styles.inputWrap}>
              <FiMail style={styles.inputIcon} />
              <input type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={styles.input} />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrap}>
              <FiLock style={styles.inputIcon} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={styles.input} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirmar Contraseña</label>
            <div style={styles.inputWrap}>
              <FiLock style={styles.inputIcon} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Repite la contraseña" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} style={styles.input} />
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}}>
            {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
            <FiArrowRight />
          </motion.button>
        </form>
        <p style={styles.footer}>
          ¿Ya tienes cuenta? <Link to="/login" style={styles.footerLink}>Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0806', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" },
  bgOrb1: { position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', top: -200, right: -150, pointerEvents: 'none' },
  bgOrb2: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', bottom: -180, left: -120, pointerEvents: 'none' },
  card: { position: 'relative', width: 420, padding: '48px 40px 40px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
  header: { textAlign: 'center', marginBottom: 28 },
  backLink: { position: 'absolute', top: 20, left: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'none' },
  logo: { fontSize: 28, fontWeight: 700, margin: 0 },
  logoJ: { color: '#e4e8f1' },
  logoNe: { background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '8px 0 0' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  error: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: 'rgba(255,255,255,0.3)', fontSize: 18, pointerEvents: 'none' },
  input: { width: '100%', padding: '13px 14px 13px 44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e4e8f1', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, display: 'flex' },
  submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 24 },
  footerLink: { color: '#f59e0b', textDecoration: 'none' },
}
