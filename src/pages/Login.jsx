import { useState } from 'react'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const { login, verifyTwoFactor, error: authError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 2FA state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorEmail, setTwoFactorEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    const result = await login(email, password)
    if (result === true) {
      navigate('/')
    } else if (result?.twoFactorRequired) {
      setTwoFactorRequired(true)
      setTwoFactorEmail(email)
    } else {
      setError(authError || 'Credenciales inválidas')
    }
    setLoading(false)
  }

  const handleTwoFactor = async (e) => {
    e.preventDefault()
    setError('')
    if (!twoFactorCode) { setError('Ingresa el código 2FA'); return }
    setLoading(true)
    const ok = await verifyTwoFactor(twoFactorEmail, twoFactorCode)
    if (ok) navigate('/')
    else setError(authError || 'Código inválido')
    setLoading(false)
  }

  if (twoFactorRequired) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.bgOrb1} /><div style={styles.bgOrb2} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
          <div style={styles.header}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #f59e0b20, #f9731620)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiShield size={28} color="#f59e0b" />
              </div>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '12px 0 0', color: '#e4e8f1' }}>Verificación en dos pasos</h1>
            <p style={styles.subtitle}>Ingresa el código de verificación enviado a tu correo</p>
          </div>
          <form onSubmit={handleTwoFactor} style={styles.form}>
            {(error || authError) && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={styles.error}>
                {error || authError}
              </motion.div>
            )}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Código 2FA</label>
              <div style={styles.inputWrap}>
                <FiShield style={{ ...styles.inputIcon, color: 'rgba(255,255,255,0.3)' }} />
                <input type="text" placeholder="000000" value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ ...styles.input, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: "'JetBrains Mono', monospace" }} autoFocus />
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verificando…' : 'Verificar'}
              <FiArrowRight style={styles.arrowIcon} />
            </motion.button>
            <button type="button" onClick={() => { setTwoFactorRequired(false); setTwoFactorCode('') }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
              Volver al inicio de sesión
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={styles.card}>
        <div style={styles.header}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <img src="/logo.png" alt="Javaline" style={{height: 72, filter: 'drop-shadow(0 0 24px rgba(245,158,11,0.5))'}} />
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: '8px 0 0', letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #f59e0b, #f97316, #fbbf24, #f59e0b)',
            backgroundSize: '300% 300%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'gradientShift 4s ease infinite',
          }}>Javaline</h1>
          <p style={styles.subtitle}>Inicia sesión en tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {(error || authError) && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={styles.error}>
              {error || authError}
            </motion.div>
          )}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo</label>
            <div style={styles.inputWrap}>
              <FiMail style={styles.inputIcon} />
              <input type="email" placeholder="tu@correo.com" value={email}
                onChange={(e) => setEmail(e.target.value)} style={styles.input} autoFocus />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrap}>
              <FiLock style={styles.inputIcon} />
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} style={styles.input} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn} tabIndex={-1}>
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}}>
            {loading ? 'Entrando…' : 'Entrar'}
            <FiArrowRight style={styles.arrowIcon} />
          </motion.button>
        </form>
        <div style={{textAlign: 'center', marginTop: 16}}>
          <Link to="/register" style={{color: '#f59e0b', fontSize: 13, textDecoration: 'none'}}>
            ¿No tienes cuenta? Créala aquí
          </Link>
        </div>
        <div style={styles.demoBox}>
          <span style={styles.demoLabel}>Demo</span>
          <code style={styles.demoCode}>admin@javaline.com / admin123</code>
        </div>
        <p style={styles.footer}>Javaline — Plataforma de gestión empresarial</p>
      </motion.div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0a0806', position: 'relative', overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  bgOrb1: {
    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
    top: -200, right: -150, pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
    bottom: -180, left: -120, pointerEvents: 'none',
  },
  card: {
    position: 'relative', width: 420, padding: '48px 40px 40px',
    background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  header: { textAlign: 'center', marginBottom: 32 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '8px 0 0' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  error: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: 'rgba(255,255,255,0.3)', fontSize: 18, pointerEvents: 'none' },
  input: {
    width: '100%', padding: '14px 14px 14px 44px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e4e8f1',
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  },
  eyeBtn: { position: 'absolute', right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, display: 'flex' },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
    padding: '14px 0', background: 'linear-gradient(135deg, #f59e0b, #f97316)',
    border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', letterSpacing: '0.3px', marginTop: 4,
  },
  arrowIcon: { fontSize: 18 },
  demoBox: { marginTop: 28, padding: '12px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, textAlign: 'center' },
  demoLabel: { color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 },
  demoCode: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 24 },
}
