import JSZip from 'jszip'

// ---------------------------------------------------------------------------
// ZIP
// ---------------------------------------------------------------------------
export async function createZip(files: FileList | File[]): Promise<Blob> {
  const zip = new JSZip()
  Array.from(files).forEach((file) => {
    zip.file(file.name, file)
  })
  return zip.generateAsync({ type: 'blob' })
}

export async function extractZip(file: File): Promise<{ files: { name: string; blob: Blob }[] }> {
  const zip = await JSZip.loadAsync(file)
  const out: { name: string; blob: Blob }[] = []
  const entries = Object.keys(zip.files).filter((n) => !zip.files[n].dir)
  for (const name of entries) {
    out.push({ name, blob: await zip.files[name].async('blob') })
  }
  return { files: out }
}

export async function zipTree(file: File): Promise<{ name: string; dir: boolean; size: number }[]> {
  const zip = await JSZip.loadAsync(file)
  const entries = Object.keys(zip.files).filter((n) => !zip.files[n].dir)
  const sizes = new Map<string, number>()
  for (const name of entries) {
    const buf = await zip.files[name].async('uint8array')
    sizes.set(name, buf.length)
  }
  return Object.keys(zip.files).map((name) => ({
    name,
    dir: zip.files[name].dir,
    size: zip.files[name].dir ? 0 : sizes.get(name) || 0,
  }))
}

// ---------------------------------------------------------------------------
// TAR
// ---------------------------------------------------------------------------
const TAR_BLOCK = 512

function tarHeader(name: string, size: number, mtime: number): Uint8Array {
  const block = new Uint8Array(TAR_BLOCK)
  const enc = new TextEncoder()
  const write = (offset: number, s: string, max: number) => {
    const bytes = enc.encode(s).slice(0, max)
    block.set(bytes, offset)
  }
  write(0, name, 100)
  write(100, '0000644\0', 8)
  write(108, '0000000\0', 8)
  write(116, '0000000\0', 8)
  write(124, size.toString(8).padStart(11, '0') + '\0', 12)
  write(136, Math.floor(mtime / 1000).toString(8).padStart(11, '0') + '\0', 12)
  block[156] = 0x30 // '0' regular file
  write(257, 'ustar\0', 6)
  write(263, '00', 2)
  write(265, 'root', 32)
  write(297, 'root', 32)
  // checksum (field 148, 8 bytes) - computed with field as spaces
  let sum = 0
  for (let i = 0; i < TAR_BLOCK; i++) {
    sum += block[i]
  }
  const checksumStr = sum.toString(8).padStart(6, '0') + '\0 '
  const cBytes = enc.encode(checksumStr)
  block.set(cBytes, 148)
  return block
}

export async function createTar(files: FileList | File[]): Promise<Blob> {
  const arr = Array.from(files)
  const chunks: Uint8Array[] = []
  let total = 0
  for (const file of arr) {
    const buf = new Uint8Array(await file.arrayBuffer())
    chunks.push(tarHeader(file.name, buf.length, file.lastModified))
    chunks.push(buf)
    total += TAR_BLOCK + buf.length
    const pad = TAR_BLOCK - (buf.length % TAR_BLOCK)
    if (pad !== TAR_BLOCK) chunks.push(new Uint8Array(pad))
  }
  // end-of-archive: two zero blocks
  chunks.push(new Uint8Array(TAR_BLOCK * 2))
  return new Blob(chunks as unknown as BlobPart[], { type: 'application/x-tar' })
}

function parseTar(data: Uint8Array): { name: string; content: Uint8Array }[] {
  const out: { name: string; content: Uint8Array }[] = []
  const decoder = new TextDecoder()
  let offset = 0
  while (offset + TAR_BLOCK <= data.length) {
    const block = data.subarray(offset, offset + TAR_BLOCK)
    if (block.every((b) => b === 0)) break
    const magic = decoder.decode(block.subarray(257, 263))
    const name = decoder.decode(block.subarray(0, 100)).replace(/\0.*$/, '')
    if (magic !== 'ustar' && !name) break
    const sizeStr = decoder.decode(block.subarray(124, 136)).replace(/\0.*$/, '').trim()
    const size = parseInt(sizeStr, 8) || 0
    const typeflag = String.fromCharCode(block[156])
    const prefix = decoder.decode(block.subarray(345, 500)).replace(/\0.*$/, '')
    const fullName = (prefix ? prefix + '/' : '') + name
    if (typeflag === '0' || typeflag === '\0' || !typeflag) {
      const content = data.subarray(offset + TAR_BLOCK, offset + TAR_BLOCK + size)
      out.push({ name: fullName, content: new Uint8Array(content) })
    }
    offset += TAR_BLOCK + Math.ceil(size / TAR_BLOCK) * TAR_BLOCK
  }
  return out
}

export async function extractTar(file: File): Promise<{ name: string; blob: Blob }[]> {
  const data = new Uint8Array(await file.arrayBuffer())
  const files = parseTar(data)
  return files.map((f) => ({
    name: f.name,
    blob: new Blob([f.content as unknown as BlobPart], { type: 'application/octet-stream' }),
  }))
}

export async function listTar(file: File): Promise<string[]> {
  const data = new Uint8Array(await file.arrayBuffer())
  return parseTar(data).map((f) => f.name)
}

// ---------------------------------------------------------------------------
// GZIP (single stream) & TAR.GZ
// ---------------------------------------------------------------------------
export async function gzipCompress(input: Blob): Promise<Blob> {
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Response(stream).blob()
}

export async function gzipDecompress(input: Blob): Promise<Blob> {
  const stream = input.stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).blob()
}

export async function createTarGz(files: FileList | File[]): Promise<Blob> {
  const tar = await createTar(files)
  return gzipCompress(tar)
}

export async function extractTarGz(file: File): Promise<{ name: string; blob: Blob }[]> {
  const decompressed = await gzipDecompress(file)
  const data = new Uint8Array(await decompressed.arrayBuffer())
  const files = parseTar(data)
  return files.map((f) => ({
    name: f.name,
    blob: new Blob([f.content as unknown as BlobPart], { type: 'application/octet-stream' }),
  }))
}

export async function listTarGz(file: File): Promise<string[]> {
  const decompressed = await gzipDecompress(file)
  const data = new Uint8Array(await decompressed.arrayBuffer())
  return parseTar(data).map((f) => f.name)
}
