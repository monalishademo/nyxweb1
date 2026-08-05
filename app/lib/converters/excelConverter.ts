import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { escapeHtml } from '../utils'

export async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const data = await file.arrayBuffer()
  return XLSX.read(data, { type: 'array' })
}

export function sheetToRows(ws: XLSX.WorkSheet): string[][] {
  return XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as string[][]
}

export function workbookToCsv(wb: XLSX.WorkBook): string {
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_csv(ws)
}

export function workbookToJson(wb: XLSX.WorkBook): string {
  const ws = wb.Sheets[wb.SheetNames[0]]
  return JSON.stringify(XLSX.utils.sheet_to_json(ws, { defval: '' }), null, 2)
}

export function workbookToTxt(wb: XLSX.WorkBook): string {
  const rows = sheetToRows(wb.Sheets[wb.SheetNames[0]])
  return rows.map((r) => r.join('\t')).join('\n')
}

export function workbookToMarkdown(wb: XLSX.WorkBook): string {
  const rows = sheetToRows(wb.Sheets[wb.SheetNames[0]])
  return rowsToMarkdown(rows)
}

export function rowsToMarkdown(rows: string[][]): string {
  if (!rows.length) return ''
  const normalize = (r: string[]) => r.map((c) => String(c).replace(/\|/g, '\\|').replace(/\n/g, ' '))
  const header = normalize(rows[0])
  const sep = header.map(() => '---')
  const body = rows.slice(1).map((r) => normalize(r))
  const render = (r: string[]) => `| ${r.join(' | ')} |`
  return [render(header), render(sep), ...body.map(render)].join('\n')
}

export function workbookToHtml(wb: XLSX.WorkBook): string {
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_html(ws)
}

export function workbookToXml(wb: XLSX.WorkBook): string {
  const rows = sheetToRows(wb.Sheets[wb.SheetNames[0]])
  if (!rows.length) return '<table></table>'
  const headers = rows[0]
  const body = rows.slice(1).map((r) => {
    const cells = headers.map((h, i) => `    <${sanitizeTag(h)}>${escapeHtml(String(r[i] ?? ''))}</${sanitizeTag(h)}>`)
    return `  <row>\n${cells.join('\n')}\n  </row>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<table>\n${body.join('\n')}\n</table>`
}

function sanitizeTag(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9_-]/g, '_')
  if (/^\d/.test(clean) || !clean) return 'col'
  return clean
}

export async function workbookToPdf(wb: XLSX.WorkBook): Promise<Blob> {
  const rows = sheetToRows(wb.Sheets[wb.SheetNames[0]])
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const margin = 24
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const colCount = Math.max(1, rows[0]?.length || 1)
  const colW = (pageW - margin * 2) / Math.min(colCount, 8)
  const rowH = 18
  let y = margin

  const wrappedCache = new Map<number, string[][]>()
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri]
    const wrapped = row.slice(0, 8).map((c) => pdf.splitTextToSize(String(c ?? ''), colW - 4) as string[])
    wrappedCache.set(ri, wrapped)
  }

  for (let ri = 0; ri < rows.length; ri++) {
    const wrapped = wrappedCache.get(ri)!
    const rowHeight = Math.max(rowH, ...wrapped.map((w) => Math.max(1, w.length) * rowH))
    if (y + rowHeight > pageH - margin) {
      pdf.addPage()
      y = margin
    }
    if (ri === 0) {
      pdf.setFillColor(88, 28, 135)
    } else if (ri % 2 === 0) {
      pdf.setFillColor(241, 245, 249)
    } else {
      pdf.setFillColor(255, 255, 255)
    }
    pdf.rect(margin, y, (pageW - margin * 2) / colCount * colCount, rowHeight, 'F')
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

export function rowsToWorkbook(rows: string[][]): XLSX.WorkBook {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return wb
}

const MIME_FOR_BOOK: Record<string, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
}

export function workbookToXlsx(wb: XLSX.WorkBook, bookType: XLSX.BookType = 'xlsx'): Blob {
  const buf = XLSX.write(wb, { bookType, type: 'array' }) as ArrayBuffer
  return new Blob([buf], { type: MIME_FOR_BOOK[bookType] || 'application/octet-stream' })
}
