import mammoth from 'mammoth/mammoth.browser.min.js'
import { jsPDF } from 'jspdf'

export async function docxToRawText(arrayBuffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export async function docxToHtml(arrayBuffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.convertToHtml({ arrayBuffer })
  return result.value
}

function htmlToPlainText(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').replace(/\s+\n/g, '\n').trim()
}

export async function docxToPdf(arrayBuffer: ArrayBuffer, title = 'Document'): Promise<Blob> {
  const html = await docxToHtml(arrayBuffer)
  const text = htmlToPlainText(html)
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2
  const pageH = pdf.internal.pageSize.getHeight() - margin * 2
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text(title.slice(0, 80), margin, margin)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  let y = margin + 40
  const lines = text.split('\n')
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line || ' ', pageW)
    for (const wl of wrapped) {
      if (y > margin + pageH) {
        pdf.addPage()
        y = margin
      }
      pdf.text(wl, margin, y)
      y += 15
    }
  }
  return pdf.output('blob') as Blob
}

export async function docxToImage(arrayBuffer: ArrayBuffer, mime: 'image/png' | 'image/jpeg', title = 'Document'): Promise<Blob> {
  const text = await docxToRawText(arrayBuffer)
  const lines = text.split('\n')
  const fontSize = 16
  const maxWidth = 750
  const lineHeight = 24
  const canvas = document.createElement('canvas')
  canvas.width = 800
  const contentHeight = Math.max(200, lines.length * lineHeight + 80)
  canvas.height = Math.min(contentHeight, 4096)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#111827'
  ctx.font = `bold 26px sans-serif`
  const titleLines: string[] = []
  let tw = title
  while (tw.length > 40) {
    titleLines.push(tw.slice(0, 40))
    tw = tw.slice(40)
  }
  titleLines.push(tw)
  let y = 60
  for (const tl of titleLines) {
    ctx.fillText(tl, 25, y)
    y += 34
  }
  ctx.font = `${fontSize}px sans-serif`
  for (const line of lines) {
    if (!line.trim()) {
      y += lineHeight * 0.6
      continue
    }
    const wrapped = wrapText(ctx, line, maxWidth)
    for (const wl of wrapped) {
      if (y > canvas.height - 30) {
        y = 60
        ctx.fillStyle = '#cccccc'
        ctx.fillRect(0, 0, canvas.width, 2)
        ctx.fillStyle = '#111827'
      }
      ctx.fillText(wl, 25, y)
      y += lineHeight
    }
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), mime, 0.92)
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}
