const IS_DEV = import.meta.env.DEV
const IS_PROD = import.meta.env.PROD

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const MIN_LEVEL = IS_PROD ? LEVELS.warn : LEVELS.debug

function sanitize(data) {
  if (!IS_PROD || data === undefined) return data
  if (data instanceof Error) return { name: data.name, message: data.message }
  return data
}

function entry(level, ctx, msg, data) {
  if (LEVELS[level] < MIN_LEVEL) return

  const record = { level, time: new Date().toISOString(), ctx, msg }
  if (data !== undefined) record.data = sanitize(data)

  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  if (IS_DEV) {
    fn(`[${record.time}] ${level.toUpperCase()} [${ctx}] ${msg}`, data ?? '')
  } else {
    fn(JSON.stringify(record))
  }
}

const logger = {
  debug: (ctx, msg, data) => entry('debug', ctx, msg, data),
  info:  (ctx, msg, data) => entry('info',  ctx, msg, data),
  warn:  (ctx, msg, data) => entry('warn',  ctx, msg, data),
  error: (ctx, msg, data) => entry('error', ctx, msg, data),
  child: (ctx) => ({
    debug: (msg, data) => entry('debug', ctx, msg, data),
    info:  (msg, data) => entry('info',  ctx, msg, data),
    warn:  (msg, data) => entry('warn',  ctx, msg, data),
    error: (msg, data) => entry('error', ctx, msg, data),
  }),
}

export default logger
