const STORE = 'paperSizes'
const CONFIG_STORE = 'paperConfigs'
const PREFIX = 'PAPER'

function delay(ms = 100) { return new Promise(r => setTimeout(r, ms)) }

const PRESETS = [
  { id: `${PREFIX}-A4`,       name: 'A4',                width: 210,   height: 297,   unit: 'mm', category: 'standard', icon: '📄' },
  { id: `${PREFIX}-A5`,       name: 'A5',                width: 148,   height: 210,   unit: 'mm', category: 'standard', icon: '📄' },
  { id: `${PREFIX}-A6`,       name: 'A6',                width: 105,   height: 148,   unit: 'mm', category: 'standard', icon: '📄' },
  { id: `${PREFIX}-LETTER`,   name: 'Carta (Letter)',    width: 215.9, height: 279.4, unit: 'mm', category: 'standard', icon: '📄' },
  { id: `${PREFIX}-LEGAL`,    name: 'Oficio (Legal)',    width: 215.9, height: 355.6, unit: 'mm', category: 'standard', icon: '📄' },
  { id: `${PREFIX}-TABLOID`,  name: 'Tabloid',           width: 279.4, height: 431.8, unit: 'mm', category: 'standard', icon: '📄' },
  { id: `${PREFIX}-TH80`,     name: 'Térmica 80mm',      width: 80,    height: 297,   unit: 'mm', category: 'thermal',  icon: '🧾' },
  { id: `${PREFIX}-TH58`,     name: 'Térmica 58mm',      width: 58,    height: 200,   unit: 'mm', category: 'thermal',  icon: '🧾' },
  { id: `${PREFIX}-TH76`,     name: 'Ticket 76mm',       width: 76,    height: 150,   unit: 'mm', category: 'thermal',  icon: '🧾' },
  { id: `${PREFIX}-TH50`,     name: 'Ticket 50mm',       width: 50,    height: 100,   unit: 'mm', category: 'thermal',  icon: '🧾' },
  { id: `${PREFIX}-ENV10`,    name: 'Sobre #10',         width: 104.8, height: 241.3, unit: 'mm', category: 'envelope', icon: '✉️' },
  { id: `${PREFIX}-ENVDL`,    name: 'Sobre DL',          width: 110,   height: 220,   unit: 'mm', category: 'envelope', icon: '✉️' },
]

const DEFAULT_CONFIGS = [
  { reportType: 'customer_invoice', paperSizeId: `${PREFIX}-LETTER`, label: 'Factura Cliente' },
  { reportType: 'supplier_invoice',  paperSizeId: `${PREFIX}-LETTER`, label: 'Factura Proveedor' },
  { reportType: 'cash_closing',      paperSizeId: `${PREFIX}-A4`,     label: 'Cuadre de Caja' },
  { reportType: 'report',            paperSizeId: `${PREFIX}-A4`,     label: 'Informe General' },
  { reportType: 'purchase_order',    paperSizeId: `${PREFIX}-A4`,     label: 'Orden de Compra' },
  { reportType: 'thermal_receipt',   paperSizeId: `${PREFIX}-TH80`,   label: 'Recibo Térmico' },
]

function load(key, defaults) {
  try {
    const raw = localStorage.getItem(`javaline_${key}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return defaults
}

function save(key, data) {
  localStorage.setItem(`javaline_${key}`, JSON.stringify(data))
}

export default {
  async list() {
    await delay()
    return load(STORE, PRESETS)
  },

  async search(query) {
    await delay()
    const all = load(STORE, PRESETS)
    if (!query) return all
    const q = query.toLowerCase()
    return all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      `${p.width}x${p.height}`.includes(q)
    )
  },

  async create(data) {
    await delay()
    const all = load(STORE, PRESETS)
    const nums = all
      .map(p => { const m = p.id.match(new RegExp(`^${PREFIX}-CUSTOM-(\\d+)$`)); return m ? parseInt(m[1]) : 0 })
      .filter(n => !isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    const id = `${PREFIX}-CUSTOM-${String(max + 1).padStart(3, '0')}`
    const item = { id, ...data, unit: data.unit || 'mm', category: data.category || 'custom', icon: data.icon || '📐' }
    all.push(item)
    save(STORE, all)
    return item
  },

  async update(id, data) {
    await delay()
    const all = load(STORE, PRESETS)
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Formato no encontrado')
    all[idx] = { ...all[idx], ...data }
    save(STORE, all)
    return all[idx]
  },

  async remove(id) {
    await delay()
    if (id.startsWith(`${PREFIX}-`) && !id.includes('CUSTOM')) throw new Error('No se puede eliminar un formato predefinido')
    const all = load(STORE, PRESETS)
    save(STORE, all.filter(p => p.id !== id))
  },

  async getConfigs() {
    await delay()
    return load(CONFIG_STORE, DEFAULT_CONFIGS)
  },

  async setConfig(reportType, paperSizeId) {
    await delay()
    const configs = load(CONFIG_STORE, DEFAULT_CONFIGS)
    const idx = configs.findIndex(c => c.reportType === reportType)
    if (idx >= 0) {
      configs[idx].paperSizeId = paperSizeId
    } else {
      const def = DEFAULT_CONFIGS.find(d => d.reportType === reportType)
      configs.push({ reportType, paperSizeId, label: def?.label || reportType })
    }
    save(CONFIG_STORE, configs)
  },

  async getPaperSizeFor(reportType) {
    await delay()
    const configs = load(CONFIG_STORE, DEFAULT_CONFIGS)
    const sizes = load(STORE, PRESETS)
    const config = configs.find(c => c.reportType === reportType)
    if (!config) return sizes.find(s => s.id === `${PREFIX}-A4`) || sizes[0]
    return sizes.find(s => s.id === config.paperSizeId) || sizes.find(s => s.id === `${PREFIX}-A4`) || sizes[0]
  },

  PRESETS,
  DEFAULT_CONFIGS,
}
