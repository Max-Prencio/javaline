// VITE_API_URL must be set in Vercel environment variables to point at the deployed backend.
// Example: https://javaline-api.railway.app
// When not set (local dev), defaults to '' so requests go to the same origin (vite proxy or local uvicorn).
const API_BASE = import.meta.env.VITE_API_URL || ''

function getToken() {
  try {
    return localStorage.getItem('javaline_token') || null
  } catch {
    return null
  }
}

async function request(method, path, body = null, opts = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const isFormData = body instanceof FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...headers, ...opts.headers },
    body: isFormData ? body : (body ? JSON.stringify(body) : null),
  })

  if (!res.ok) {
    let detail = `Error ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || (err.message) || detail
      if (Array.isArray(detail)) detail = detail.map(d => d.msg).join(', ')
    } catch {}
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body, opts) => request('POST', path, body, opts),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
  setToken: (token) => localStorage.setItem('javaline_token', token),
  clearToken: () => localStorage.removeItem('javaline_token'),
}

export default api
