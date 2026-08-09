import * as XLSX from 'xlsx'
import { escapeHtml } from '../utils'

export function textToHtmlPage(text: string, title = 'Document'): string {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const body = paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`).join('\n')
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6} h1{font-size:1.6em}</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${body}
</body>
</html>`
}

export function textToMarkdown(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let inCode = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^--- Page \d+ ---$/.test(trimmed)) {
      out.push('')
      out.push(`## ${trimmed}`)
      out.push('')
      continue
    }
    if (trimmed.startsWith('```')) {
      inCode = !inCode
      out.push(trimmed)
      continue
    }
    if (trimmed === '') {
      out.push('')
      continue
    }
    out.push(line)
  }
  return out.join('\n')
}

export function textToXml(text: string, rootName = 'document'): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const esc = (s: string) => escapeHtml(s)
  const pageEls: string[] = []
  let current: string[] = []
  const flush = () => {
    if (current.length) {
      pageEls.push(
        `  <page>\n    <line>${current.map(esc).join('</line>\n    <line>')}</line>\n  </page>`
      )
      current = []
    }
  }
  for (const line of lines) {
    if (/^--- Page \d+ ---$/.test(line.trim())) {
      flush()
      continue
    }
    if (line.trim()) current.push(line.trim())
  }
  flush()
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${pageEls.join('\n')}\n</${rootName}>`
}

export function textToXlsx(text: string): Blob {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const rows = lines.map((line, idx) => {
    const pageMatch = line.match(/^--- Page (\d+) ---$/)
    if (pageMatch) return { Page: pageMatch[1], Line: '' }
    return { Page: '', Line: line }
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ExtractedText')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
