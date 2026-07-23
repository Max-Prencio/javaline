import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} style={{ color: color || 'var(--accent)' }} />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <span style={{ fontSize: 24, fontWeight: 700, color: color || 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</span>
    </motion.div>
  )
}
