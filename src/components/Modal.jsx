import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'

export default function Modal({ open, onClose, title, icon: Icon, wide, children }) {
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onClose}>
        <motion.div key="mdl" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: '90%', maxWidth: wide ? 700 : 520, border: '1px solid var(--border)', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {Icon && <Icon size={18} style={{ color: 'var(--accent)' }} />}
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
            </div>
            <motion.button whileHover={{ rotate: 90 }} onClick={onClose}
              style={{ display: 'flex', padding: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <FiX size={16} />
            </motion.button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
