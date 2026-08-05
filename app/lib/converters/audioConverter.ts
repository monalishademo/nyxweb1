export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const samples = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = samples * blockAlign
  const bufferSize = 44 + dataSize
  const ab = new ArrayBuffer(bufferSize)
  const view = new DataView(ab)

  const writeString = (v: DataView, offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i))
  }

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c))
  let offset = 44
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

const SUPPORTED_MP3_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000]

let lameFactory: {
  Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => {
    encodeBuffer: (l: Int16Array, r: Int16Array) => Int8Array
    flush: () => Int8Array
  }
} | null = null

async function getLameFactory() {
  if (lameFactory) return lameFactory
  // @ts-ignore
  const { default: source } = await import('lamejs/lame.all.js?raw')
  const fn = new Function(source + '\n; return lamejs;')
  lameFactory = fn()
  if (!lameFactory) throw new Error('MP3 encoder failed to initialise')
  return lameFactory
}

function pickMp3Rate(sampleRate: number): number {
  let best = 44100
  let bestDiff = Infinity
  for (const r of SUPPORTED_MP3_RATES) {
    const diff = Math.abs(r - sampleRate)
    if (diff < bestDiff) {
      bestDiff = diff
      best = r
    }
  }
  return best
}

function floatTo16(sample: number): number {
  const s = Math.max(-1, Math.min(1, sample))
  return s < 0 ? s * 0x8000 : s * 0x7fff
}

export async function resampleAudio(buffer: AudioBuffer, targetRate: number): Promise<AudioBuffer> {
  if (buffer.sampleRate === targetRate) return buffer
  const ctx = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.max(1, Math.ceil(buffer.duration * targetRate)),
    targetRate
  )
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.connect(ctx.destination)
  src.start()
  return ctx.startRendering()
}

export async function audioBufferToMp3(buffer: AudioBuffer, kbps = 128): Promise<Blob> {
  const factory = await getLameFactory()
  const channels = Math.min(2, buffer.numberOfChannels)
  const sampleRate = pickMp3Rate(buffer.sampleRate)
  const input = await resampleAudio(buffer, sampleRate)
  const encoder = new factory.Mp3Encoder(channels, sampleRate, kbps)
  const samples = input.length
  const blockSize = 1152
  const chData: Float32Array[] = []
  for (let c = 0; c < channels; c++) chData.push(input.getChannelData(c))
  const left = new Int16Array(blockSize)
  const right = new Int16Array(blockSize)
  const parts: Int8Array[] = []
  for (let i = 0; i < samples; i += blockSize) {
    const n = Math.min(blockSize, samples - i)
    for (let j = 0; j < n; j++) {
      left[j] = floatTo16(chData[0][i + j])
      right[j] = channels > 1 ? floatTo16(chData[1][i + j]) : left[j]
    }
    const enc = encoder.encodeBuffer(left, right)
    if (enc.length > 0) parts.push(enc)
  }
  const end = encoder.flush()
  if (end.length > 0) parts.push(end)
  const total = parts.reduce((a, b) => a + b.length, 0)
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    bytes.set(new Uint8Array(p.buffer, p.byteOffset, p.byteLength), offset)
    offset += p.length
  }
  return new Blob([bytes], { type: 'audio/mp3' })
}

export async function decodeAudio(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  const ctx = new AudioContext()
  try {
    return await ctx.decodeAudioData(arrayBuffer)
  } finally {
    await ctx.close()
  }
}

export function trimAudioBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const start = Math.max(0, Math.floor(startSec * buffer.sampleRate))
  const end = Math.min(buffer.length, Math.floor(endSec * buffer.sampleRate))
  const len = Math.max(1, end - start)
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, len, buffer.sampleRate)
  const out = ctx.createBuffer(buffer.numberOfChannels, len, buffer.sampleRate)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    out.copyToChannel(buffer.getChannelData(c).subarray(start, end), c)
  }
  return out
}

export async function mergeAudioBuffers(buffers: AudioBuffer[]): Promise<AudioBuffer> {
  if (!buffers.length) throw new Error('No audio buffers')
  const sampleRate = buffers[0].sampleRate
  const resampled = await Promise.all(buffers.map((b) => resampleAudio(b, sampleRate)))
  const channels = Math.max(...resampled.map((b) => b.numberOfChannels))
  const totalSamples = resampled.reduce((a, b) => a + b.length, 0)
  const ctx = new OfflineAudioContext(channels, totalSamples, sampleRate)
  const out = ctx.createBuffer(channels, totalSamples, sampleRate)
  let offset = 0
  for (const b of resampled) {
    for (let c = 0; c < channels; c++) {
      const src = b.numberOfChannels > c ? b.getChannelData(c) : b.getChannelData(0)
      out.getChannelData(c).set(src, offset)
    }
    offset += b.length
  }
  return out
}

export async function formatDuration(sec: number): Promise<string> {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}