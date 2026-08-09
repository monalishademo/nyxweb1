import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { jsPDF } from 'jspdf'
import ImageTracer from 'imagetracerjs'

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

export function canvasToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function toCanvas(img: HTMLImageElement, maxDim = 4096): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  let w = img.naturalWidth || img.width
  let h = img.naturalHeight || img.height
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

function rgbaToCanvasData(img: HTMLImageElement): { data: Uint8ClampedArray; width: number; height: number } {
  const canvas = toCanvas(img)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return { data: imgData.data, width: canvas.width, height: canvas.height }
}

export async function imageToRaster(
  file: File,
  mime: 'image/png' | 'image/jpeg' | 'image/webp',
  quality = 0.92
): Promise<Blob> {
  const img = await loadImageFromFile(file)
  const canvas = toCanvas(img)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
      mime,
      quality
    )
  })
}

// ---------------------------------------------------------------------------
// BMP 24-bit encoder (works in every browser)
// ---------------------------------------------------------------------------
export function encodeBmp(img: HTMLImageElement): Blob {
  const canvas = toCanvas(img)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height).data

  const rowSize = Math.floor((24 * width + 31) / 32) * 4
  const pixelArraySize = rowSize * height
  const fileSize = 54 + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42) // 'B'
  view.setUint8(1, 0x4d) // 'M'
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, 54, true)
  // BITMAPINFOHEADER
  view.setUint32(14, 40, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 24, true)
  view.setUint32(30, 0, true)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 0, true)
  view.setUint32(50, 0, true)

  // Pixel data (bottom-up, BGR)
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4
    const dstRow = 54 + y * rowSize
    for (let x = 0; x < width; x++) {
      const si = srcRow + x * 4
      const di = dstRow + x * 3
      view.setUint8(di, imageData[si + 2]) // B
      view.setUint8(di + 1, imageData[si + 1]) // G
      view.setUint8(di + 2, imageData[si]) // R
    }
  }

  return new Blob([buffer], { type: 'image/bmp' })
}

// ---------------------------------------------------------------------------
// ICO encoder (32-bit BGRA + AND mask)
// ---------------------------------------------------------------------------
export function encodeIco(img: HTMLImageElement, sizes: number[] = [256, 128, 64, 48, 32, 16]): Blob {
  const canvas = toCanvas(img)
  const sourceW = canvas.width
  const sourceH = canvas.height

  const entries: { w: number; h: number; data: Uint8ClampedArray }[] = []
  for (const size of sizes) {
    if (size > 256) continue
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')
    if (!ctx) continue
    ctx.clearRect(0, 0, size, size)
    const scale = Math.min(size / sourceW, size / sourceH)
    const w = Math.max(1, Math.round(sourceW * scale))
    const h = Math.max(1, Math.round(sourceH * scale))
    ctx.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h)
    const imgData = ctx.getImageData(0, 0, size, size)
    entries.push({ w: size, h: size, data: imgData.data })
  }

  const headerSize = 6 + 16 * entries.length
  let bodySize = 0
  const bodyOffsets: number[] = []
  for (const e of entries) {
    bodyOffsets.push(bodySize)
    const bmpInfo = 40
    const xorSize = e.w * e.h * 4
    const andStride = Math.floor((e.w + 31) / 32) * 4
    const andSize = andStride * e.h
    bodySize += bmpInfo + xorSize + andSize
  }

  const buffer = new ArrayBuffer(headerSize + bodySize)
  const view = new DataView(buffer)

  // ICONDIR
  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, entries.length, true)

  let offset = headerSize
  entries.forEach((e, i) => {
    const di = 6 + i * 16
    view.setUint8(di, e.w >= 256 ? 0 : e.w)
    view.setUint8(di + 1, e.h >= 256 ? 0 : e.h)
    view.setUint8(di + 2, 0) // color count
    view.setUint8(di + 3, 0) // reserved
    view.setUint16(di + 4, 1, true) // planes
    view.setUint16(di + 6, 32, true) // bit count
    const andStride = Math.floor((e.w + 31) / 32) * 4
    const andSize = andStride * e.h
    view.setUint32(di + 8, 40 + e.w * e.h * 4 + andSize, true)
    view.setUint32(di + 12, offset, true)

    // BITMAPINFOHEADER (height doubled for ICO)
    view.setUint32(offset, 40, true)
    view.setInt32(offset + 4, e.w, true)
    view.setInt32(offset + 8, e.h * 2, true)
    view.setUint16(offset + 12, 1, true)
    view.setUint16(offset + 14, 32, true)
    view.setUint32(offset + 16, 0, true)
    view.setUint32(offset + 20, e.w * e.h * 4 + andSize, true)
    view.setInt32(offset + 24, 0, true)
    view.setInt32(offset + 28, 0, true)
    view.setUint32(offset + 32, 0, true)
    view.setUint32(offset + 36, 0, true)

    // Pixel data (BGRA, bottom-up)
    const bmpOffset = offset + 40
    for (let y = 0; y < e.h; y++) {
      const srcRow = (e.h - 1 - y) * e.w * 4
      const dstRow = bmpOffset + y * e.w * 4
      for (let x = 0; x < e.w; x++) {
        const si = srcRow + x * 4
        const di = dstRow + x * 4
        view.setUint8(di, e.data[si + 2]) // B
        view.setUint8(di + 1, e.data[si + 1]) // G
        view.setUint8(di + 2, e.data[si]) // R
        view.setUint8(di + 3, e.data[si + 3]) // A
      }
    }

    // AND mask (all opaque)
    const andOffset = bmpOffset + e.w * e.h * 4
    for (let i2 = 0; i2 < andSize; i2++) view.setUint8(andOffset + i2, 0)

    offset += 40 + e.w * e.h * 4 + andSize
  })

  return new Blob([buffer], { type: 'image/x-icon' })
}

// ---------------------------------------------------------------------------
// GIF encoder via gifenc
// ---------------------------------------------------------------------------
export async function imageToGif(file: File, maxDim = 320): Promise<Blob> {
  const img = await loadImageFromFile(file)
  const canvas = toCanvas(img, maxDim)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const gif = GIFEncoder()
  const palette = quantize(data as unknown as Uint8Array, 256)
  const index = applyPalette(data as unknown as Uint8Array, palette)
  gif.writeFrame(index, canvas.width, canvas.height, { palette, delay: 100 })
  gif.finish()
  const bytes = gif.bytes()
  return new Blob([bytes as unknown as BlobPart], { type: 'image/gif' })
}

// ---------------------------------------------------------------------------
// PDF encoder via jsPDF
// ---------------------------------------------------------------------------
export async function imageToPdf(file: File, format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG'): Promise<Blob> {
  const img = await loadImageFromFile(file)
  const canvas = toCanvas(img, 4096)
  const dataUrl = canvas.toDataURL(`image/${format.toLowerCase()}`)
  const pdf = new jsPDF({ orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
  pdf.addImage(dataUrl, format, 0, 0, canvas.width, canvas.height)
  const out = pdf.output('blob')
  return out as Blob
}

// ---------------------------------------------------------------------------
// SVG vector trace (experimental) via imagetracerjs
// ---------------------------------------------------------------------------
export async function imageToSvg(file: File, options: Record<string, number> = {}): Promise<string> {
  const img = await loadImageFromFile(file)
  const canvas = toCanvas(img, 1024)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const opts = {
    ltres: 0.5,
    qtres: 1,
    pathomit: 8,
    rightangleenhance: true,
    colorsampling: 2,
    numberofcolors: 16,
    mincolorratio: 0.02,
    colorquantcycles: 3,
    strokewidth: 1,
    linefilter: false,
    scale: 1,
    roundcoords: 1,
    viewbox: false,
    desc: false,
    blurradius: 0,
    blurdelta: 20,
    ...options,
  }
  return ImageTracer.imagedataToSVG(imageData, opts)
}
