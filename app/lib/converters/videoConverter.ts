import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import JSZip from 'jszip'
import { audioBufferToWav, audioBufferToMp3 } from './audioConverter'

export interface VideoInfo {
  duration: number
  width: number
  height: number
}

export function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.onloadedmetadata = () => resolve(video)
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Cannot load video'))
    }
    video.src = url
  })
}

export function getVideoInfo(file: File): Promise<VideoInfo> {
  return loadVideo(file).then((v) => ({
    duration: v.duration || 0,
    width: v.videoWidth || 0,
    height: v.videoHeight || 0,
  }))
}

export function captureAt(video: HTMLVideoElement, t: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      resolve(canvas)
    }
    video.addEventListener('seeked', onSeeked)
    try {
      video.currentTime = t
    } catch {
      onSeeked()
    }
  })
}

function frameTimes(duration: number, count: number): number[] {
  if (!duration || duration <= 0) return [0]
  const times: number[] = []
  for (let i = 0; i < count; i++) {
    times.push((duration * i) / Math.max(1, count - 1))
  }
  return times
}

export async function videoToFrames(
  file: File,
  count = 8,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  maxDim = 1024,
  onProgress?: (done: number, total: number) => void
): Promise<{ blob: Blob; name: string }[]> {
  const video = await loadVideo(file)
  const duration = video.duration
  const times = frameTimes(duration, count)
  const out: { blob: Blob; name: string }[] = []
  const ext = format.split('/')[1]
  for (let i = 0; i < times.length; i++) {
    const canvas = await captureAt(video, times[i])
    const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height))
    if (scale < 1) {
      const c = document.createElement('canvas')
      c.width = Math.round(canvas.width * scale)
      c.height = Math.round(canvas.height * scale)
      const ctx = c.getContext('2d')
      ctx?.drawImage(canvas, 0, 0, c.width, c.height)
      const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('fail'))), format, 0.92))
      out.push({ blob, name: `frame-${String(i + 1).padStart(3, '0')}.${ext}` })
    } else {
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('fail'))), format, 0.92))
      out.push({ blob, name: `frame-${String(i + 1).padStart(3, '0')}.${ext}` })
    }
    onProgress?.(i + 1, times.length)
  }
  return out
}

export async function videoToFramesZip(file: File, count = 8, format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const frames = await videoToFrames(file, count, format, 1024, onProgress)
  const zip = new JSZip()
  for (const f of frames) zip.file(f.name, f.blob)
  return zip.generateAsync({ type: 'blob' })
}

export async function videoThumbnail(file: File, format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'): Promise<Blob> {
  const video = await loadVideo(file)
  const canvas = await captureAt(video, Math.min(0.1, video.duration * 0.05 || 0))
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), format, 0.92)
  })
}

export async function videoToGif(file: File, count = 12, maxDim = 360, onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const video = await loadVideo(file)
  const duration = video.duration
  const times = frameTimes(duration, count)
  const gif = GIFEncoder()

  for (let i = 0; i < times.length; i++) {
    const canvas = await captureAt(video, times[i])
    const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(canvas.width * scale))
    c.height = Math.max(1, Math.round(canvas.height * scale))
    const ctx = c.getContext('2d')
    if (ctx) ctx.drawImage(canvas, 0, 0, c.width, c.height)
    const imgData = ctx?.getImageData(0, 0, c.width, c.height).data || new Uint8ClampedArray(c.width * c.height * 4)
    const rgba = imgData as unknown as Uint8Array
    const palette = quantize(rgba, 256)
    const index = applyPalette(rgba, palette)
    const delay = Math.max(10, Math.round((duration / count) * 1000))
    gif.writeFrame(index, c.width, c.height, { palette, delay })
    onProgress?.(i + 1, times.length)
  }
  gif.finish()
  const bytes = gif.bytes()
  return new Blob([bytes as unknown as BlobPart], { type: 'image/gif' })
}

export async function videoToAudioWav(file: File): Promise<Blob> {
  const buffer = await extractAudioTrack(file)
  return audioBufferToWav(buffer)
}

export async function videoToAudioMp3(file: File): Promise<Blob> {
  const buffer = await extractAudioTrack(file)
  return audioBufferToMp3(buffer, 128)
}

async function extractAudioTrack(file: File): Promise<AudioBuffer> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.src = url
  video.muted = true
  video.playsInline = true
  video.crossOrigin = 'anonymous'
  const audioCtx = new AudioContext()
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Cannot load video'))
    })
    const source = audioCtx.createMediaElementSource(video)
    const dest = audioCtx.createMediaStreamDestination()
    const gain = audioCtx.createGain()
    gain.gain.value = 1
    source.connect(gain)
    gain.connect(dest)
    video.muted = false

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
    const recorder = new MediaRecorder(dest.stream, mimeType ? { mimeType } : undefined)
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })
    recorder.start()
    await video.play()
    await new Promise<void>((resolve) => {
      video.onended = () => resolve()
      const timeout = Math.min(120000, video.duration * 1000 + 3000)
      setTimeout(resolve, timeout)
    })
    recorder.stop()
    await stopped

    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
    if (blob.size === 0) throw new Error('No audio track found in this video (or audio playback was blocked).')
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = await audioCtx.decodeAudioData(arrayBuffer)
    return buffer
  } finally {
    video.pause()
    video.removeAttribute('src')
    URL.revokeObjectURL(url)
    await audioCtx.close()
  }
}
