const API_BASE = import.meta.env.VITE_API_URL || ''

async function request(method, path, body = null, opts = {}) {
  const headers = {}
  const isFormData = body instanceof FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...headers, ...opts.headers },
    body: isFormData ? body : (body ? JSON.stringify(body) : null),
    credentials: 'include',
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
  clearToken: () => {},
}

export default api
