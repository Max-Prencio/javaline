import paperSizeService from '../services/paperSizeService'

let _logoDataUrl = null

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 40" width="180" height="40">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#f97316"/>
  </linearGradient></defs>
  <text x="0" y="32" font-family="'Inter','Segoe UI',sans-serif" font-size="28" font-weight="800" fill="url(#g)" letter-spacing="2">JAVALINE</text>
</svg>`

export async function preloadLogo() {
  if (_logoDataUrl) return _logoDataUrl
  try {
    const resp = await fetch('/logo.png')
    if (!resp.ok) throw new Error('Not found')
    const blob = await resp.blob()
    _logoDataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    _logoDataUrl = null
  }
  return _logoDataUrl
}

function getLogoHtml() {
  if (_logoDataUrl) {
    return `<img src="${_logoDataUrl}" alt="Javaline" style="height:36px;display:block;margin:0 auto 4px" />`
  }
  return `<div style="text-align:center;margin-bottom:4px">${LOGO_SVG}</div>`
}

function paperSizeCss(ps, margin) {
  if (!ps) return `@page{margin:${margin}}`
  const w = ps.width; const h = ps.height
  if (!w || !h) return `@page{margin:${margin}}`
  const u = ps.unit || 'mm'
  const m = ps.category === 'thermal' ? '5mm 4mm' : margin
  return `@page{size:${w}${u} ${h}${u};margin:${m}}`
}

async function getPaperSize(reportType) {
  try { return await paperSizeService.getPaperSizeFor(reportType) } catch { return null }
}

function buildDoc(innerHtml, title, pageCss, extraStyle) {
  return [
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>`,
    pageCss,
    `*{box-sizing:border-box}`,
    `body{font-family:'Inter','Segoe UI',sans-serif;padding:0;margin:0;color:#1a1a2e;font-size:12px;line-height:1.5}`,
    `@media print{html,body{height:100%}.no-print{display:none!important}}`,
    `.javaline-logo{text-align:center;padding:12px 0 8px;border-bottom:2px solid #f59e0b;margin-bottom:16px}`,
    `.javaline-footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}`,
    extraStyle || '',
    `</style></head><body>`,
    `<div class="javaline-logo">${getLogoHtml()}</div>`,
    innerHtml,
    `<div class="javaline-footer">javaline.app — Generado por Javaline Sistema de Gestión</div>`,
    `</body></html>`,
  ].join('\n')
}

export async function printHtmlAsync(html, title = 'Documento', options = {}) {
  const { reportType, paperSize, margin } = options
  if (!_logoDataUrl) await preloadLogo()
  const ps = paperSize || (reportType ? await getPaperSize(reportType) : null)
  const fullHtml = buildDoc(html, title, paperSizeCss(ps, margin))
  printIframe(fullHtml, title)
}

export function printHtml(html, title = 'Documento', options = {}) {
  printHtmlAsync(html, title, options)
}

function printIframe(html, title) {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.title = title
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow.document
  doc.open(); doc.write(html); doc.close()
  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 1000)
  }, 600)
}

export async function invoicePrintHtml(inv, formatMoney) {
  await preloadLogo()
  const logoHtml = getLogoHtml()
  let ps
  try { ps = await paperSizeService.getPaperSizeFor(inv.type === 'supplier' ? 'supplier_invoice' : 'customer_invoice') } catch {}
  const taxLabel = inv.taxLabel || 'ITBIS'

  const body = [
    `<div style="text-align:center;margin-bottom:12px"><h1 style="font-size:20px;margin:0;letter-spacing:2px;font-family:'Courier New',monospace">${inv.id}</h1><p style="font-size:11px;color:#6b5a4a;margin:4px 0 0">${inv.clientName}</p></div>`,
    `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:11px;font-family:'Courier New',monospace;line-height:1.6">`,
    `<div><strong>RNC:</strong> ${inv.rnc || 'N/A'}<br><strong>Dirección:</strong> Santo Domingo, RD</div>`,
    `<div style="text-align:right"><strong>Fecha:</strong> ${inv.date}<br><strong>Vence:</strong> ${inv.dueDate || 'N/A'}<br><strong>Moneda:</strong> ${inv.currency || 'DOP'}<br><strong>Pago:</strong> ${inv.paymentType === 'credit' ? `Crédito (${inv.installmentPlan?.totalInstallments || 0} cuotas)` : 'Contado'} / ${inv.paymentMethod || 'N/A'}</div></div>`,
    `<table style="width:100%;border-collapse:collapse;margin:10px 0;font-family:'Courier New',monospace;font-size:11px"><thead><tr>`,
    `<th style="text-align:left;border-bottom:2px solid #1a1410;padding:5px 4px;font-size:10px;text-transform:uppercase">Producto</th>`,
    `<th style="text-align:right;border-bottom:2px solid #1a1410;padding:5px 4px;font-size:10px;text-transform:uppercase">Cant</th>`,
    `<th style="text-align:right;border-bottom:2px solid #1a1410;padding:5px 4px;font-size:10px;text-transform:uppercase">Precio</th>`,
    `<th style="text-align:right;border-bottom:2px solid #1a1410;padding:5px 4px;font-size:10px;text-transform:uppercase">Total</th>`,
    `</tr></thead><tbody>`,
    ...(inv.items || []).map(it => `<tr><td style="padding:4px;border-bottom:1px solid #e0d8d0">${it.productName}</td><td style="padding:4px;border-bottom:1px solid #e0d8d0;text-align:right">${it.qty}</td><td style="padding:4px;border-bottom:1px solid #e0d8d0;text-align:right">$${formatMoney(it.price)}</td><td style="padding:4px;border-bottom:1px solid #e0d8d0;text-align:right">$${formatMoney(it.total)}</td></tr>`),
    `</tbody></table>`,
    `<table style="width:auto;margin-left:auto;min-width:240px;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11px"><tbody>`,
    `<tr><td style="padding:3px 4px;border-bottom:1px solid #e0d8d0">Subtotal</td><td style="padding:3px 4px;border-bottom:1px solid #e0d8d0;text-align:right">$${formatMoney(inv.subtotal)}</td></tr>`,
    ...(inv.discountAmount > 0 ? [`<tr style="color:#cc3333"><td style="padding:3px 4px;border-bottom:1px solid #e0d8d0">Descuento${inv.discountType === 'percentage' ? ` (${inv.discount}%)` : ''}</td><td style="padding:3px 4px;border-bottom:1px solid #e0d8d0;text-align:right">-$${formatMoney(inv.discountAmount)}</td></tr>`] : []),
    `<tr><td style="padding:3px 4px;border-bottom:1px solid #e0d8d0">${taxLabel}</td><td style="padding:3px 4px;border-bottom:1px solid #e0d8d0;text-align:right">$${formatMoney(inv.tax)}</td></tr>`,
    `<tr style="font-weight:700"><td style="padding:6px 4px;border-top:2px solid #1a1410;border-bottom:none">TOTAL</td><td style="padding:6px 4px;border-top:2px solid #1a1410;border-bottom:none;text-align:right;font-size:12px">$${formatMoney(inv.total)}</td></tr>`,
    `</tbody></table>`,
    ...(inv.installmentPlan?.installments?.length ? [
      `<div style="margin-top:16px;font-size:10px;font-family:'Courier New',monospace"><strong>Plan de Pagos:</strong></div>`,
      `<table style="width:100%;border-collapse:collapse;font-size:9px;font-family:'Courier New',monospace"><tr><th style="text-align:left;padding:3px 4px;border-bottom:1px solid #1a1410">#</th><th style="text-align:left;padding:3px 4px;border-bottom:1px solid #1a1410">Vence</th><th style="text-align:right;padding:3px 4px;border-bottom:1px solid #1a1410">Monto</th><th style="text-align:right;padding:3px 4px;border-bottom:1px solid #1a1410">Estado</th></tr>`,
      ...inv.installmentPlan.installments.map((inst, i) =>
        `<tr><td style="padding:2px 4px">${i+1}</td><td style="padding:2px 4px">${inst.dueDate}</td><td style="padding:2px 4px;text-align:right">$${formatMoney(inst.amount)}</td><td style="padding:2px 4px;text-align:right">${inst.paid ? 'Pagada' : 'Pendiente'}</td></tr>`
      ),
      `</table>`,
    ] : []),
  ].join('\n')

  const w = ps?.width ? `size:${ps.width}${ps.unit||'mm'} ${ps.height}${ps.unit||'mm'};` : ''
  const m = ps?.category === 'thermal' ? '5mm 4mm' : '12mm 8mm'
  const fullHtml = [
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura ${inv.id}</title><style>`,
    `@page{${w}margin:${m}}`,
    `*{box-sizing:border-box}`,
    `body{font-family:'Courier New',monospace;padding:0;margin:0;color:#1a1410;font-size:11px}`,
    `@media print{html,body{height:100%}}`,
    `.logo-stamp{text-align:center;margin-bottom:8px}`,
    `.logo-stamp img,.logo-stamp svg{height:28px}`,
    `.footer{text-align:center;margin-top:20px;padding-top:8px;border-top:1px solid #e0d8d0;font-size:9px;color:#6b5a4a}`,
    `</style></head><body>`,
    `<div class="logo-stamp">${logoHtml}</div>`,
    body,
    `<div class="footer">javaline.app — Documento generado electrónicamente</div>`,
    `</body></html>`,
  ].join('\n')

  printIframe(fullHtml, `Factura ${inv.id}`)
}
