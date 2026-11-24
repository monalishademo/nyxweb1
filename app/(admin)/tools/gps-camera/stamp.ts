export type StampData = {
  locationName: string
  address: string
  latitude: string
  longitude: string
  dateTime: string
  flagUrl: string | null
}

export const APP_NAME = 'GPS Map Camera'
export const SAMPLE_NOTE = `Note : Captured by ${APP_NAME}`

const FONT = 'Roboto, "Segoe UI", Arial, sans-serif'

function parseCoord(value: string): number | null {
  const n = parseFloat(String(value).replace(/[^\d.+-]/g, ''))
  return Number.isFinite(n) ? n : null
}

function latLngToPixel(lat: number, lon: number, zoom: number) {
  const scale = 256 * 2 ** zoom
  const x = ((lon + 180) / 360) * scale
  const sin = Math.sin((lat * Math.PI) / 180)
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
  return { x, y }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}

async function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 20px Roboto`)))
  } catch {
    /* fall back to system fonts */
  }
}

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

// ---------- Authentic Google Maps Red Pin ----------
function drawPin(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const s = size / 40
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(s, s)

  // Ground oval shadow right under the tip
  ctx.beginPath()
  ctx.ellipse(0, 21, 7.5, 2.6, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)'
  ctx.fill()

  // Google Maps teardrop silhouette (wider top, sleek tapered tip)
  ctx.beginPath()
  ctx.moveTo(0, 21)
  ctx.bezierCurveTo(-3.5, 11, -15, 2.5, -15, -9.5)
  ctx.arc(0, -9.5, 15, Math.PI, 0, false)
  ctx.bezierCurveTo(15, 2.5, 3.5, 11, 0, 21)
  ctx.closePath()

  const body = ctx.createLinearGradient(0, -24.5, 0, 21)
  body.addColorStop(0, '#f25344')
  body.addColorStop(0.65, '#ea4335')
  body.addColorStop(1, '#c5221f')
  ctx.fillStyle = body
  ctx.fill()

  // Subtle rim highlight
  ctx.strokeStyle = 'rgba(165, 24, 20, 0.65)'
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Inner dark maroon/brown circle
  ctx.beginPath()
  ctx.arc(0, -9.5, 5.6, 0, Math.PI * 2)
  ctx.fillStyle = '#751410'
  ctx.fill()

  ctx.restore()
}

// ---------- Waving 3D Indian Flag (Android Emoji Style) ----------
function drawWavingIndianFlag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save()
  const waveAmp = h * 0.085

  const traceWaveBand = (yTop: number, yBot: number) => {
    ctx.beginPath()
    const steps = 24
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = x + t * w
      const offset = Math.sin(t * Math.PI * 2) * waveAmp
      if (i === 0) ctx.moveTo(px, yTop + offset)
      else ctx.lineTo(px, yTop + offset)
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps
      const px = x + t * w
      const offset = Math.sin(t * Math.PI * 2) * waveAmp
      ctx.lineTo(px, yBot + offset)
    }
    ctx.closePath()
  }

  const bandH = h / 3

  // Saffron band
  traceWaveBand(y, y + bandH + 0.4)
  ctx.fillStyle = '#ff9933'
  ctx.fill()

  // White band
  traceWaveBand(y + bandH, y + bandH * 2 + 0.4)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // Green band
  traceWaveBand(y + bandH * 2, y + h)
  ctx.fillStyle = '#138808'
  ctx.fill()

  // 3D cloth shading overlay across the wave
  traceWaveBand(y, y + h)
  const shade = ctx.createLinearGradient(x, y, x + w, y)
  shade.addColorStop(0, 'rgba(255,255,255,0.12)')
  shade.addColorStop(0.28, 'rgba(255,255,255,0.22)')
  shade.addColorStop(0.55, 'rgba(0,0,0,0.14)')
  shade.addColorStop(0.82, 'rgba(255,255,255,0.12)')
  shade.addColorStop(1, 'rgba(0,0,0,0.08)')
  ctx.fillStyle = shade
  ctx.fill()

  // Ashoka Chakra in the center of the white band
  const cx = x + w * 0.5
  const cy = y + h * 0.5 + Math.sin(0.5 * Math.PI * 2) * waveAmp
  const r = bandH * 0.42

  ctx.strokeStyle = '#000080'
  ctx.lineWidth = Math.max(0.8, r * 0.16)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Center hub
  ctx.fillStyle = '#000080'
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2)
  ctx.fill()

  // 24 spokes
  ctx.lineWidth = Math.max(0.4, r * 0.08)
  for (let i = 0; i < 24; i++) {
    const ang = (i * Math.PI) / 12
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)
    ctx.stroke()
  }

  ctx.restore()
}

function drawFallbackMap(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const g = ctx.createRadialGradient(x + size / 2, y + size / 2, size * 0.1, x + size / 2, y + size / 2, size * 0.8)
  g.addColorStop(0, '#1e3a2f')
  g.addColorStop(0.5, '#111c18')
  g.addColorStop(1, '#080d0b')
  ctx.fillStyle = g
  ctx.fillRect(x, y, size, size)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  const step = size / 5
  for (let i = 1; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(x + step * i, y)
    ctx.lineTo(x + step * i, y + size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y + step * i)
    ctx.lineTo(x + size, y + step * i)
    ctx.stroke()
  }
}

// ---------- Official Vector Google Watermark ----------
function drawGoogleLogo(ctx: CanvasRenderingContext2D, centerX: number, bottomY: number, height: number) {
  const scale = height / 92
  const totalW = 272 * scale
  const x = centerX - totalW / 2
  const y = bottomY - height * 0.78

  const paths = [
    'M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z',
    'M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z',
    'M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z',
    'M225 3v65h-9.5V3h9.5z',
    'M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z',
    'M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z',
  ]

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 1.5
  ctx.fillStyle = '#ffffff'

  for (const d of paths) {
    ctx.fill(new Path2D(d))
  }

  ctx.restore()
}

// ---------- satellite tiles (Esri) with cache ----------
async function loadTile(z: number, x: number, y: number): Promise<HTMLImageElement | null> {
  const n = 2 ** z
  if (x < 0 || y < 0 || x >= n || y >= n) return null
  try {
    const img = await loadImage(
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    )
    return img.width >= 8 ? img : null
  } catch {
    return null
  }
}

async function buildCenteredSatellite(lat: number, lon: number, outSize: number): Promise<HTMLCanvasElement | null> {
  const zoom = 17
  const p = latLngToPixel(lat, lon, zoom)
  const tileSize = 256
  const half = outSize / 2
  const minX = Math.floor((p.x - half) / tileSize)
  const maxX = Math.floor((p.x + half) / tileSize)
  const minY = Math.floor((p.y - half) / tileSize)
  const maxY = Math.floor((p.y + half) / tileSize)

  const mosaic = document.createElement('canvas')
  mosaic.width = outSize
  mosaic.height = outSize
  const mctx = mosaic.getContext('2d')
  if (!mctx) return null

  const jobs: Array<Promise<void>> = []
  for (let ty = minY; ty <= maxY; ty++) {
    for (let tx = minX; tx <= maxX; tx++) {
      jobs.push(
        (async () => {
          const img = await loadTile(zoom, tx, ty)
          if (!img) return
          mctx.drawImage(img, tx * tileSize - (p.x - half), ty * tileSize - (p.y - half), tileSize, tileSize)
        })(),
      )
    }
  }
  await Promise.all(jobs)
  return mosaic
}

const mosaicCache = new Map<string, Promise<HTMLCanvasElement | null>>()
function getSatellite(lat: number, lon: number, size: number) {
  const key = `${lat.toFixed(6)},${lon.toFixed(6)},${size}`
  let hit = mosaicCache.get(key)
  if (!hit) {
    hit = buildCenteredSatellite(lat, lon, size).catch(() => null)
    mosaicCache.set(key, hit)
    if (mosaicCache.size > 6) mosaicCache.delete(mosaicCache.keys().next().value as string)
  }
  return hit
}

// ---------- Exact GPS Map Camera Badge & Icon ----------
function drawBrandBadge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number) {
  ctx.save()
  rrPath(ctx, x, y, w, h, [4 * s, 4 * s, 0, 0])
  ctx.fillStyle = 'rgba(20, 22, 26, 0.78)'
  ctx.fill()
  ctx.restore()

  const iconSize = h * 0.78
  const ix = x + 5 * s
  const iy = y + (h - iconSize) / 2

  ctx.save()
  rrPath(ctx, ix, iy, iconSize, iconSize, 3.2 * s)
  ctx.clip()

  // Map background: light grey-white base
  ctx.fillStyle = '#e8eaed'
  ctx.fillRect(ix, iy, iconSize, iconSize)

  // Top-left green park block
  ctx.fillStyle = '#34a853'
  ctx.beginPath()
  ctx.moveTo(ix, iy)
  ctx.lineTo(ix + iconSize * 0.58, iy)
  ctx.lineTo(ix + iconSize * 0.35, iy + iconSize * 0.65)
  ctx.lineTo(ix, iy + iconSize * 0.65)
  ctx.closePath()
  ctx.fill()

  // Bottom-right blue water/map block
  ctx.fillStyle = '#4285f4'
  ctx.beginPath()
  ctx.moveTo(ix + iconSize * 0.45, iy + iconSize * 0.45)
  ctx.lineTo(ix + iconSize, iy + iconSize * 0.45)
  ctx.lineTo(ix + iconSize, iy + iconSize)
  ctx.lineTo(ix + iconSize * 0.25, iy + iconSize)
  ctx.closePath()
  ctx.fill()

  // Diagonal white road line
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.6 * s
  ctx.beginPath()
  ctx.moveTo(ix + iconSize * 0.62, iy)
  ctx.lineTo(ix + iconSize * 0.22, iy + iconSize)
  ctx.stroke()

  // Yellow-orange teardrop pin centered inside icon
  const px = ix + iconSize * 0.52
  const py = iy + iconSize * 0.48
  const pr = iconSize * 0.31

  ctx.beginPath()
  ctx.moveTo(px, py + pr * 1.35)
  ctx.bezierCurveTo(px - pr * 0.3, py + pr * 0.65, px - pr, py + pr * 0.2, px - pr, py - pr * 0.25)
  ctx.arc(px, py - pr * 0.25, pr, Math.PI, 0, false)
  ctx.bezierCurveTo(px + pr, py + pr * 0.2, px + pr * 0.3, py + pr * 0.65, px, py + pr * 1.35)
  ctx.closePath()
  ctx.fillStyle = '#fbbc05'
  ctx.fill()

  // Dark blue camera lens circle inside the yellow pin
  const ly = py - pr * 0.22
  ctx.fillStyle = '#1e3a8a'
  ctx.beginPath()
  ctx.arc(px, ly, pr * 0.56, 0, Math.PI * 2)
  ctx.fill()

  // Inner cyan lens ring & dark pupil
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(px, ly, pr * 0.34, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(px, ly, pr * 0.18, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = `400 ${Math.round(12.5 * s)}px ${FONT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(APP_NAME, ix + iconSize + 6 * s, y + h / 2 + 0.5 * s)
}

// ---------- main ----------
export async function drawStamp(
  canvas: HTMLCanvasElement,
  photo: HTMLImageElement,
  data: StampData,
  isCancelled: () => boolean = () => false,
): Promise<void> {
  const w = photo.naturalWidth || photo.width
  const h = photo.naturalHeight || photo.height

  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const ctx = off.getContext('2d')
  if (!ctx) return

  const s = w / 1080
  const outerMarginX = 24 * s
  const outerMarginBottom = 20 * s
  const mapSize = Math.round(Math.min(w * 0.23, h * 0.25, 235 * s))
  const gapBetween = 14 * s
  const infoBoxX = outerMarginX + mapSize + gapBetween
  const infoBoxW = w - infoBoxX - outerMarginX
  const boxH = mapSize
  const boxY = h - boxH - outerMarginBottom

  const lat = parseCoord(data.latitude)
  const lon = parseCoord(data.longitude)

  const [, mosaic, flag] = await Promise.all([
    ensureFonts(),
    lat != null && lon != null ? getSatellite(lat, lon, Math.max(320, mapSize)) : Promise.resolve(null),
    data.flagUrl ? loadImage(data.flagUrl).catch(() => null) : Promise.resolve(null),
  ])
  if (isCancelled()) return

  // photo
  ctx.drawImage(photo, 0, 0, w, h)

  // left map card
  const mapX = outerMarginX
  const mapY = boxY
  ctx.save()
  rrPath(ctx, mapX, mapY, mapSize, mapSize, 4 * s)
  ctx.clip()
  if (mosaic) ctx.drawImage(mosaic, mapX, mapY, mapSize, mapSize)
  else drawFallbackMap(ctx, mapX, mapY, mapSize)
  ctx.restore()

  drawPin(ctx, mapX + mapSize * 0.5, mapY + mapSize * 0.45, mapSize * 0.24)

  // Official vector Google logo watermark at bottom-center of map
  drawGoogleLogo(ctx, mapX + mapSize * 0.5, mapY + mapSize * 0.92, mapSize * 0.175)

  // right info dark box
  ctx.save()
  rrPath(ctx, infoBoxX, boxY, infoBoxW, boxH, 4 * s)
  ctx.fillStyle = 'rgba(15, 17, 20, 0.58)'
  ctx.fill()
  ctx.restore()

  // brand badge (top-right above info box)
  const badgeW = 148 * s
  const badgeH = 24 * s
  drawBrandBadge(ctx, infoBoxX + infoBoxW - badgeW, boxY - badgeH - 2 * s, badgeW, badgeH, s)

  // text block inside info box
  const padX = 18 * s
  const textX = infoBoxX + padX
  const textMax = infoBoxW - padX * 2
  const titleSize = Math.round(mapSize * 0.17)
  const bodySize = Math.round(mapSize * 0.098)
  const lineGap = mapSize * 0.155
  const totalTextH = titleSize + lineGap * 4
  let ty = boxY + (boxH - totalTextH) / 2 + titleSize * 0.85

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = `400 ${titleSize}px ${FONT}`
  const title = data.locationName || 'Location'
  const titleMax = textMax - 56 * s
  const titleW = Math.min(ctx.measureText(title).width, titleMax)
  ctx.fillText(title, textX, ty, titleMax)

  // Draw waving Indian flag for India, otherwise fallback to fetched flat flag
  const fh = titleSize * 0.78
  const fw = fh * 1.48
  const fx = textX + titleW + 10 * s
  const fy = ty - fh + 3 * s
  const isIndia = /india/i.test(data.locationName) || /india/i.test(data.address) || (data.flagUrl && /\/in\.png/i.test(data.flagUrl))

  if (isIndia) {
    drawWavingIndianFlag(ctx, fx, fy, fw, fh)
  } else if (flag) {
    ctx.save()
    rrPath(ctx, fx, fy, fw, fh, 2 * s)
    ctx.clip()
    ctx.drawImage(flag, fx, fy, fw, fh)
    ctx.restore()
  }

  ctx.fillStyle = '#f8fafc'
  ctx.font = `400 ${bodySize}px ${FONT}`

  ty += lineGap * 1.05
  ctx.fillText(data.address, textX, ty, textMax)

  ty += lineGap
  const latLabel = data.latitude.replace(/°/g, '').trim()
  const lonLabel = data.longitude.replace(/°/g, '').trim()
  ctx.fillText(`Lat ${latLabel}° Long ${lonLabel}°`, textX, ty, textMax)

  ty += lineGap
  ctx.fillText(data.dateTime, textX, ty, textMax)

  ty += lineGap
  ctx.fillStyle = '#f8fafc'
  ctx.fillText(SAMPLE_NOTE, textX, ty, textMax)

  if (isCancelled()) return

  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')?.drawImage(off, 0, 0)
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.95): string {
  return canvas.toDataURL('image/jpeg', quality)
}