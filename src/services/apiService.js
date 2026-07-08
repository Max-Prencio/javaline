/**
 * API Service — Abstraction layer for Javaline backend.
 *
 * CURRENT: Uses localStorage (client-side only, for development/demo).
 * FUTURE:  Switch provider to 'aws' and point API_BASE_URL at your backend.
 *
 * AWS Migration Steps:
 * 1. Deploy backend (Node.js/Lambda) with API Gateway
 * 2. Set up PostgreSQL on RDS
 * 3. Configure Cognito for auth (replace bcrypt + JWT)
 * 4. Update API_BASE_URL to your API Gateway URL
 * 5. Change PROVIDER to 'aws'
 * 6. Each service function will automatically call the REST API
 */

const CONFIG = {
  PROVIDER: 'local', // 'local' | 'aws'
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://api.javaline.app/v1',
  AWS_REGION: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  S3_BUCKET: import.meta.env.VITE_S3_BUCKET || 'javaline-files',
  RDS_HOST: import.meta.env.VITE_RDS_HOST || '',
  RDS_DB_NAME: import.meta.env.VITE_RDS_DB_NAME || 'javaline',
  ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY || '',
}

const isAws = () => CONFIG.PROVIDER === 'aws'

function getToken() {
  try {
    const session = JSON.parse(localStorage.getItem('javaline_session') || '{}')
    return session.token || ''
  } catch { return '' }
}

async function apiFetch(endpoint, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de conexión' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  return res.json()
}

function localTimeout(ms = 200) {
  return new Promise(r => setTimeout(r, ms))
}

const apiService = {
  // --- CONFIGURATION ---
  getConfig: () => ({ ...CONFIG }),
  isAwsReady: () => isAws(),
  getBaseUrl: () => CONFIG.API_BASE_URL,

  // --- GENERIC CRUD (used by entityService when on AWS) ---
  crud: (resource) => ({
    async list(filters = {}) {
      if (!isAws()) { await localTimeout(); return import('./db').then(m => m.default.getAll(resource)) }
      const params = new URLSearchParams(filters)
      return apiFetch(`/${resource}?${params}`)
    },
    async getById(id) {
      if (!isAws()) { await localTimeout(); return import('./db').then(m => m.default.getById(resource, id)) }
      return apiFetch(`/${resource}/${id}`)
    },
    async create(data) {
      if (!isAws()) { await localTimeout(400); return import('./db').then(m => m.default.insert(resource, data)) }
      return apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) })
    },
    async update(id, data) {
      if (!isAws()) { await localTimeout(300); return import('./db').then(m => m.default.update(resource, id, data)) }
      return apiFetch(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
    async remove(id) {
      if (!isAws()) { await localTimeout(300); return import('./db').then(m => m.default.remove(resource, id)) }
      return apiFetch(`/${resource}/${id}`, { method: 'DELETE' })
    },
  }),

  // --- AUTH (AWS Cognito ready) ---
  auth: {
    async login(email, password) {
      if (!isAws()) {
        return import('./authService').then(m => m.default.login(email, password))
      }
      return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    },
    async register(data) {
      if (!isAws()) {
        return import('./authService').then(m => m.default.register(data))
      }
      return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) })
    },
    async refreshToken() {
      if (!isAws()) return true
      const token = getToken()
      return apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ token }) })
    },
  },

  // --- FILE UPLOAD (AWS S3 ready) ---
  upload: {
    async uploadFile(file, folder = 'general') {
      if (!isAws()) {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve({ url: reader.result, name: file.name })
          reader.readAsDataURL(file)
        })
      }
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      return apiFetch('/upload', { method: 'POST', body: formData, headers: {} })
    },
    getFileUrl(key) {
      if (!isAws()) return key
      return `https://${CONFIG.S3_BUCKET}.s3.${CONFIG.AWS_REGION}.amazonaws.com/${key}`
    },
  },

  // --- DATABASE (AWS RDS ready) ---
  db: {
    async query(sql, params = []) {
      if (!isAws()) {
        await localTimeout()
        console.warn('[API] SQL queries not available in local mode')
        return []
      }
      return apiFetch('/db/query', { method: 'POST', body: JSON.stringify({ sql, params }) })
    },
    async backup() {
      if (!isAws()) {
        await localTimeout(1000)
        const db = await import('./db')
        const data = {}
        db.default.STORES.forEach(store => { data[store] = db.default.getAll(store) })
        return data
      }
      return apiFetch('/db/backup')
    },
  },

  // --- ENCRYPTION (AWS KMS ready) ---
  encrypt: {
    async encrypt(text) {
      if (!isAws()) {
        return import('./securityService').then(m => m.default.encrypt(text))
      }
      return apiFetch('/encrypt', { method: 'POST', body: JSON.stringify({ text }) })
    },
    async decrypt(text) {
      if (!isAws()) {
        return import('./securityService').then(m => m.default.decrypt(text))
      }
      return apiFetch('/decrypt', { method: 'POST', body: JSON.stringify({ text }) })
    },
  },

  // --- HEALTH CHECK ---
  async healthCheck() {
    if (!isAws()) return { status: 'local', mode: 'development', timestamp: new Date().toISOString() }
    return apiFetch('/health')
  },
}

export default apiService
