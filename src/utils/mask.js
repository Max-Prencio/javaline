/**
 * Data masking utilities for sensitive fields.
 * Show partial data by default — require explicit action to reveal.
 */

export function maskSalary(value) {
  if (!value && value !== 0) return '•••••'
  const str = String(Number(value).toLocaleString('es-DO'))
  return `${'•'.repeat(Math.max(1, str.length - 3))}${str.slice(-3)}`
}

export function maskRNC(rnc) {
  if (!rnc) return '•••-•••••-•'
  const clean = String(rnc).replace(/\D/g, '')
  if (clean.length < 4) return '•••-•••••-•'
  return `•••-${clean.slice(3, 6) || '•••'}••-${clean.slice(-1)}`
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return '•••@•••.com'
  const [user, domain] = email.split('@')
  const visibleUser = user.length > 2 ? user.slice(0, 2) + '•'.repeat(user.length - 2) : '••'
  const domainParts = domain.split('.')
  const visibleDomain = domainParts[0].slice(0, 1) + '••.' + domainParts.slice(1).join('.')
  return `${visibleUser}@${visibleDomain}`
}

export function maskPhone(phone) {
  if (!phone) return '•••-•••-••••'
  const clean = String(phone).replace(/\D/g, '')
  if (clean.length < 7) return '•'.repeat(clean.length)
  return `${clean.slice(0, 3)}-•••-${clean.slice(-4)}`
}

export function maskAccount(account) {
  if (!account) return '••••'
  const str = String(account)
  return '•'.repeat(Math.max(0, str.length - 4)) + str.slice(-4)
}
