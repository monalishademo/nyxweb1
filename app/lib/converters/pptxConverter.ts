import JSZip from 'jszip'

export async function pptxToText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const an = parseInt(a.match(/\d+/)?.[0] || '0', 10)
      const bn = parseInt(b.match(/\d+/)?.[0] || '0', 10)
      return an - bn
    })
  let out = ''
  for (let i = 0; i < slideFiles.length; i++) {
    const content = await zip.files[slideFiles[i]].async('string')
    const texts = [...content.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1])
    out += `\n\n--- Slide ${i + 1} ---\n\n${texts.join('\n')}`
  }
  return out.trim()
}

export async function pptxExtractMedia(file: File): Promise<Blob> {
  const zip = await JSZip.loadAsync(file)
  const mediaFiles = Object.keys(zip.files).filter((name) => /^ppt\/media\/.+\.(png|jpe?g|gif|svg|webp)$/i.test(name))
  const outZip = new JSZip()
  for (const name of mediaFiles) {
    outZip.file(name.replace('ppt/media/', 'media/'), await zip.files[name].async('blob'))
  }
  return outZip.generateAsync({ type: 'blob' })
}
