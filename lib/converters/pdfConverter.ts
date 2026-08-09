import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import JSZip from 'jszip'
import { createWorker } from 'tesseract.js'

let initialized = false

export function initPdfjs(): void {
  if (!initialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
    initialized = true
  }
}

export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  initPdfjs()
  const data = await file.arrayBuffer()
  return pdfjsLib.getDocument({ data }).promise
}

export async function extractPdfText(doc: PDFDocumentProxy): Promise<string> {
  let text = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((it) => ('str' in it ? (it as { str: string }).str : ''))
      .join(' ')
    text += `\n\n--- Page ${i} ---\n\n${line}`
  }
  return text.trim()
}

export async function renderPageBlob(
  doc: PDFDocumentProxy,
  pageNum: number,
  mimeType: string = 'image/png'
): Promise<Blob> {
  const page: PDFPageProxy = await doc.getPage(pageNum)
  const viewport = page.getViewport({ scale: 2.0 })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  const canvasContext = canvas.getContext('2d')
  if (!canvasContext) throw new Error('Could not get canvas context')

  await page.render({
    canvasContext,
    viewport,
    canvas,
  }).promise

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, mimeType)
  })
}

export async function pdfPageToSvg(doc: PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await doc.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1.0 })
  const textContent = await page.getTextContent()

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewport.width}" height="${viewport.height}" viewBox="0 0 ${viewport.width} ${viewport.height}">`
  svg += `<rect width="100%" height="100%" fill="white"/>`

  for (const item of textContent.items) {
    if ('str' in item && 'transform' in item) {
      const tx = item.transform as number[]
      const x = tx[4]
      const y = viewport.height - tx[5]
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])
      const text = item.str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      svg += `<text x="${x}" y="${y}" font-size="${fontSize}px" font-family="sans-serif">${text}</text>`
    }
  }

  svg += `</svg>`
  return svg
}

export async function pdfToZip(
  doc: PDFDocumentProxy,
  mimeType: string = 'image/png',
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip()
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'

  for (let i = 1; i <= doc.numPages; i++) {
    const blob = await renderPageBlob(doc, i, mimeType)
    zip.file(`page-${i}.${ext}`, blob)
    if (onProgress) onProgress(i, doc.numPages)
  }

  return zip.generateAsync({ type: 'blob' })
}

export async function ocrPdf(
  doc: PDFDocumentProxy,
  pageNum: number,
  lang: string = 'eng',
  onProgress?: (m: { status: string; progress: number }) => void
): Promise<string> {
  const imageBlob = await renderPageBlob(doc, pageNum, 'image/png')
  const worker = await createWorker(lang)

  if (onProgress) {
    worker.setParameters({
      logger: (m: { status: string; progress: number }) => onProgress(m),
    } as unknown as Record<string, unknown>)
  }

  const ret = await worker.recognize(imageBlob)
  await worker.terminate()
  return ret.data.text
}export async function ocrCanvas(
  canvas: HTMLCanvasElement,
  lang: string = 'eng'
): Promise<string> {
  const worker = await createWorker(lang)
  const ret = await worker.recognize(canvas)
  await worker.terminate()
  return ret.data.text
}