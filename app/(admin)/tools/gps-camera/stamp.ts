export type StampData = {
  locationName: string
  address: string
  latitude: string
  longitude: string
  dateTime: string
  flagUrl: string | null
}

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

function drawPin(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const s = size / 40
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(s, s)

  ctx.beginPath()
  ctx.ellipse(0, 18, 9, 3, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, 22)
  ctx.bezierCurveTo(-18, 4, -14, -22, 0, -24)
  ctx.bezierCurveTo(14, -22, 18, 4, 0, 22)
  ctx.closePath()
  const body = ctx.createLinearGradient(-8, -24, 10, 14)
  body.addColorStop(0, '#ff6e5e')
  body.addColorStop(0.55, '#ea4335')
  body.addColorStop(1, '#c5221f')
  ctx.fillStyle = body
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, -10, 7, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.restore()
}

function drawGoogleWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number) {
  ctx.save()
  ctx.font = `700 ${Math.round(fontSize)}px Roboto, Arial, sans-serif`
  ctx.textBaseline = 'alphabetic'
  const letters = [
    { ch: 'G', color: '#4285F4' },
    { ch: 'o', color: '#EA4335' },
    { ch: 'o', color: '#FBBC05' },
    { ch: 'g', color: '#4285F4' },
    { ch: 'l', color: '#34A853' },
    { ch: 'e', color: '#EA4335' },
  ]
  let ox = x
  const shade = Math.max(1, fontSize * 0.04)
  for (const letter of letters) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillText(letter.ch, ox + shade, y + shade)
    ctx.fillStyle = letter.color
    ctx.fillText(letter.ch, ox, y)
    ox += ctx.measureText(letter.ch).width
  }
  ctx.restore()
}

function drawStylizedSatelliteMap(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
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

async function loadTile(z: number, x: number, y: number): Promise<HTMLImageElement | null> {
  const n = 2 ** z
  if (x < 0 || y < 0 || x >= n || y >= n) return null
  const urls = [
    `https://mt0.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  ]
  for (const url of urls) {
    try {
      const img = await loadImage(url)
      if (img.width >= 8) return img
    } catch {
      continue
    }
  }
  return null
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
          const dx = tx * tileSize - (p.x - half)
          const dy = ty * tileSize - (p.y - half)
          mctx.drawImage(img, dx, dy, tileSize, tileSize)
        })(),
      )
    }
  }
  await Promise.all(jobs)
  return mosaic
}

function drawCameraBadge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number) {
  ctx.save()
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, [6 * s, 6 * s, 0, 0])
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
  ctx.fill()
  ctx.restore()

  const cx = x + 14 * s
  const cy = y + h / 2

  ctx.fillStyle = '#4aa3ff'
  ctx.beginPath()
  ctx.moveTo(cx - 6.4 * s, cy - 3.4 * s)
  ctx.lineTo(cx + 2.2 * s, cy - 6.8 * s)
  ctx.lineTo(cx + 6.8 * s, cy + 2.6 * s)
  ctx.lineTo(cx - 1.8 * s, cy + 6 * s)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#1d4ed8'
  ctx.beginPath()
  ctx.arc(cx, cy, 3.6 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#dbeafe'
  ctx.beginPath()
  ctx.arc(cx, cy, 1.8 * s, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = `500 ${Math.round(13 * s)}px Roboto, Arial, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText('GPS Map Camera', x + 26 * s, y + h / 2 + 0.4 * s)
}

export async function drawStamp(
  canvas: HTMLCanvasElement,
  photo: HTMLImageElement,
  data: StampData,
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = photo.naturalWidth || photo.width
  const h = photo.naturalHeight || photo.height
  canvas.width = w
  canvas.height = h
  ctx.drawImage(photo, 0, 0, w, h)

  const s = w / 1080
  const mapSize = Math.round(Math.min(w * 0.26, h * 0.28, 270 * s))
  const inner = 18 * s
  const boxH = mapSize + inner * 2
  const boxW = w
  const boxX = 0
  const boxY = h - boxH

  ctx.save()
  ctx.fillStyle = 'rgba(10, 15, 25, 0.92)'
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.restore()

  const mapX = boxX + inner
  const mapY = boxY + inner

  ctx.save()
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(mapX, mapY, mapSize, mapSize, 8 * s)
    ctx.clip()
  } else {
    ctx.beginPath()
    ctx.rect(mapX, mapY, mapSize, mapSize)
    ctx.clip()
  }

  const lat = parseCoord(data.latitude)
  const lon = parseCoord(data.longitude)
  let mosaic: HTMLCanvasElement | null = null
  if (lat != null && lon != null) {
    try {
      mosaic = await buildCenteredSatellite(lat, lon, Math.max(320, Math.round(mapSize)))
    } catch {
      mosaic = null
    }
  }
  if (mosaic) {
    ctx.drawImage(mosaic, mapX, mapY, mapSize, mapSize)
  } else {
    drawStylizedSatelliteMap(ctx, mapX, mapY, mapSize)
  }
  ctx.restore()

  drawPin(ctx, mapX + mapSize * 0.5, mapY + mapSize * 0.47, mapSize * 0.22)
  drawGoogleWordmark(ctx, mapX + mapSize * 0.06, mapY + mapSize * 0.92, mapSize * 0.145)

  const textX = mapX + mapSize + 26 * s
  const textMax = boxW - textX - 24 * s
  const titleSize = Math.round(mapSize * 0.145)
  const bodySize = Math.round(mapSize * 0.082)
  const gap = mapSize * 0.125
  const blockH = titleSize + gap * 3
  let ty = mapY + (mapSize - blockH) / 2 + titleSize * 0.82

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${titleSize}px Roboto, Arial, sans-serif`
  const title = data.locationName || 'Location'
  const titleW = Math.min(ctx.measureText(title).width, textMax - 58 * s)
  ctx.fillText(title, textX, ty, textMax - 58 * s)

  if (data.flagUrl) {
    try {
      const flag = loadImage(data.flagUrl)
      const fh = titleSize * 0.72
      const fw = fh * 1.55
      const fx = textX + titleW + 12 * s
      const fy = ty - fh + 3 * s
      ctx.save()
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(fx, fy, fw, fh, 2 * s)
        ctx.clip()
      } else {
        ctx.beginPath()
        ctx.rect(fx, fy, fw, fh)
        ctx.clip()
      }
      ctx.drawImage(await flag, fx, fy, fw, fh)
      ctx.restore()
    } catch {
    }
  }

  ctx.fillStyle = '#f1f5f9'
  ctx.font = `400 ${bodySize}px Roboto, Arial, sans-serif`

  ty += gap
  ctx.fillText(data.address, textX, ty, textMax)

  ty += gap
  const latLabel = data.latitude.replace(/°/g, '').trim()
  const lonLabel = data.longitude.replace(/°/g, '').trim()
  ctx.fillText(`Lat ${latLabel}° Long ${lonLabel}°`, textX, ty, textMax)

  ty += gap
  ctx.fillText(data.dateTime, textX, ty, textMax)

  const badgeW = 152 * s
  const badgeH = 26 * s
  const badgeX = boxW - badgeW - 20 * s
  const badgeY = boxY - badgeH
  drawCameraBadge(ctx, badgeX, badgeY, badgeW, badgeH, s)
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.95): string {
  return canvas.toDataURL('image/jpeg', quality)
}