import Papa from 'papaparse'
import { rowsToWorkbook, workbookToXlsx } from './excelConverter'
import { jsPDF } from 'jspdf'
import { escapeHtml } from '../utils'

export function parseCsv(csv: string, header = true): { rows: string[][]; fields: string[] } {
  const result = Papa.parse<unknown[]>(csv, { skipEmptyLines: 'greedy' })
  const data = result.data
  const rows = data.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '')) : [String(r)]))
  if (!rows.length) return { rows: [], fields: [] }
  if (header) {
    const fields = rows[0].map(String)
    return { rows: rows.slice(1), fields }
  }
  const fields = rows[0].map((_, i) => `Column ${i + 1}`)
  return { rows, fields }
}

export function csvToJson(csv: string): string {
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy' })
  return JSON.stringify(parsed.data, null, 2)
}

export function csvToXml(csv: string, rootName = 'records'): string {
  const { rows, fields } = parseCsv(csv, true)
  const items = rows.map((r) => {
    const cells = fields.map((f, i) => {
      const tag = sanitizeTag(f)
      return `    <${tag}>${escapeHtml(String(r[i] ?? ''))}</${tag}>`
    })
    return `  <row>\n${cells.join('\n')}\n  </row>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${items.join('\n')}\n</${rootName}>`
}

function sanitizeTag(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9_-]/g, '_')
  if (/^\d/.test(clean) || !clean) return 'col'
  return clean
}

export function csvToHtml(csv: string): string {
  const { rows, fields } = parseCsv(csv, true)
  const head = `<tr>${fields.map((f) => `<th>${escapeHtml(f)}</th>`).join('')}</tr>`
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`).join('\n')
  return `<!doctype html>\n<html>\n<head><meta charset="utf-8"><title>CSV</title><style>table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px 8px}th{background:#f0e6ff}</style></head>\n<body>\n<table>\n${head}\n${body}\n</table>\n</body>\n</html>`
}

export function csvToMarkdown(csv: string): string {
  const { rows, fields } = parseCsv(csv, true)
  const all = [fields, ...rows]
  if (!all.length) return ''
  const normalize = (r: string[]) => r.map((c) => String(c).replace(/\|/g, '\\|').replace(/\n/g, ' '))
  const render = (r: string[]) => `| ${normalize(r).join(' | ')} |`
  return [render(fields), render(fields.map(() => '---')), ...rows.map(render)].join('\n')
}

export function csvToTxt(csv: string): string {
  const { rows, fields } = parseCsv(csv, true)
  return [fields, ...rows].map((r) => r.join('\t')).join('\n')
}

export function csvToXlsx(csv: string, bookType: 'xlsx' | 'ods' = 'xlsx'): Blob {
  const { rows, fields } = parseCsv(csv, true)
  const wb = rowsToWorkbook([fields, ...rows])
  return workbookToXlsx(wb, bookType)
}

export async function csvToPdf(csv: string): Promise<Blob> {
  const { rows, fields } = parseCsv(csv, true)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const margin = 24
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const colCount = Math.max(1, fields.length)
  const colW = (pageW - margin * 2) / Math.min(colCount, 8)
  const rowH = 18
  let y = margin
  const allRows = [fields, ...rows]

  const wrappedCache: string[][][] = allRows.map((r) =>
    r.slice(0, 8).map((c) => pdf.splitTextToSize(String(c ?? ''), colW - 4) as string[])
  )

  for (let ri = 0; ri < allRows.length; ri++) {
    const wrapped = wrappedCache[ri]
    const rowHeight = Math.max(rowH, ...wrapped.map((w) => Math.max(1, w.length) * rowH))
    if (y + rowHeight > pageH - margin) {
      pdf.addPage()
      y = margin
    }
    pdf.setFillColor(ri === 0 ? 88 : 241, ri === 0 ? 28 : 245, ri === 0 ? 135 : 249)
    pdf.rect(margin, y, pageW - margin * 2, rowHeight, 'F')
    for (let ci = 0; ci < wrapped.length; ci++) {
      const lines = wrapped[ci]
      if (!lines.length) continue
      pdf.setFontSize(8)
      pdf.setTextColor(ri === 0 ? '#ffffff' : '#1e293b')
      pdf.text(lines, margin + ci * colW + 2, y + 12)
    }
    y += rowHeight
  }
  return pdf.output('blob') as Blob
}
