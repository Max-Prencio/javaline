export class ApiError extends Error {
  constructor(message, status = 0, detail = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }

  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isNotFound() { return this.status === 404 }
  get isValidation() { return this.status === 400 }
  get isServerError() { return this.status >= 500 }
  get isNetworkError() { return this.status === 0 }
}

export function parseApiError(err) {
  if (err instanceof ApiError) return err
  if (err?.response) {
    const { status, data } = err.response
    const message = data?.detail || data?.title || data?.message || `Error ${status}`
    return new ApiError(message, status, JSON.stringify(data))
  }
  if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
    return new ApiError('Sin conexión con el servidor', 0, err.message)
  }
  return new ApiError(err?.message || 'Error desconocido', 0, '')
}
