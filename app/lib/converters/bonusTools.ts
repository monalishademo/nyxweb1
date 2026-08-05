import jsQR from 'jsqr'
import { loadImageFromFile, toCanvas } from './imageConverter'
import { ocrCanvas } from './pdfConverter'

export interface PaletteColor {
  hex: string
  count: number
  pct: number
}

export async function extractPalette(file: File, maxColors = 8): Promise<PaletteColor[]> {
  const img = await loadImageFromFile(file)
  const canvas = toCanvas(img, 128)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const counts = new Map<string, number>()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a < 128) continue
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    counts.set(hex, (counts.get(hex) || 0) + 1)
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0)
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  return sorted.slice(0, maxColors).map(([hex, count]) => ({
    hex,
    count,
    pct: total ? Math.round((count / total) * 100) : 0,
  }))
}

export async function scanQrCode(file: File): Promise<string | null> {
  const img = await loadImageFromFile(file)
  const canvas = toCanvas(img, 2048)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, imageData.width, imageData.height)
  return code ? code.data : null
}

export async function imageOcr(file: File, lang = 'eng', logger?: (m: { status: string; progress: number }) => void): Promise<string> {
  const img = await loadImageFromFile(file)
  const canvas = toCanvas(img, 2048)
  return ocrCanvas(canvas, lang, logger)
}
