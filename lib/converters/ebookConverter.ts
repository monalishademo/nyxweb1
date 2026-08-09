import JSZip from 'jszip'
import TurndownService from 'turndown'
import { textToDocx } from './ooxml'
import { jsPDF } from 'jspdf'
import { escapeHtml } from '../utils'

export interface EpubChapter {
  href: string
  html: string
}

export interface EpubMeta {
  title: string
  author: string
  chapters: EpubChapter[]
}

function extractBetween(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : null
}

export async function readEpub(file: File): Promise<EpubMeta> {
  const zip = await JSZip.loadAsync(file)
  const container = await zip.file('META-INF/container.xml')?.async('string')
  if (!container) throw new Error('Not a valid EPUB (missing container.xml)')
  const opfPath = (container.match(/full-path="([^"]+)"/) || [])[1]
  if (!opfPath) throw new Error('EPUB missing OPF path')
  const opf = await zip.file(opfPath)?.async('string')
  if (!opf) throw new Error('EPUB missing content.opf')

  const title = extractBetween(opf, 'dc:title') || 'Untitled'
  const author = extractBetween(opf, 'dc:creator') || 'Unknown'

  const baseDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
  const manifest = new Map<string, string>()
  const itemRe = /<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*>/g
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(opf))) {
    manifest.set(m[1], m[2])
  }
  const spineIds: string[] = []
  const spineRe = /<itemref[^>]*idref="([^"]+)"[^>]*>/g
  while ((m = spineRe.exec(opf))) spineIds.push(m[1])

  const chapters: EpubChapter[] = []
  const seen = new Set<string>()
  for (const id of spineIds) {
    const href = manifest.get(id)
    if (!href) continue
    const fullPath = (baseDir + href).split('#')[0]
    if (seen.has(fullPath)) continue
    seen.add(fullPath)
    const html = await zip.file(fullPath)?.async('string')
    if (html) chapters.push({ href, html })
  }
  if (!chapters.length) {
    const htmlFiles = Object.keys(zip.files).filter((n) => /\.x?html$/i.test(n) && !n.startsWith('META-INF'))
    for (const n of htmlFiles) {
      const html = await zip.file(n)?.async('string')
      if (html) chapters.push({ href: n, html })
    }
  }
  return { title, author, chapters }
}

export function htmlToText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}

export async function epubToText(file: File): Promise<string> {
  const epub = await readEpub(file)
  return `# ${epub.title}\n\n${epub.chapters.map((c) => htmlToText(c.html)).join('\n\n')}`
}

export async function epubToMarkdown(file: File): Promise<string> {
  const epub = await readEpub(file)
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  const parts = epub.chapters.map((c) => {
    let html = c.html.replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '')
    html = html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
    return turndown.turndown(html)
  })
  return `# ${epub.title}\n\n${parts.join('\n\n---\n\n')}`
}

export async function epubToHtml(file: File): Promise<string> {
  const epub = await readEpub(file)
  const body = epub.chapters.map((c) => {
    const m = c.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    return m ? m[1] : c.html
  }).join('\n')
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(epub.title)}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.7}h1{color:#4c1d95}</style>
</head>
<body>
<h1>${escapeHtml(epub.title)}</h1>
${body}
</body>
</html>`
}

export async function epubToDocx(file: File): Promise<Blob> {
  const text = await epubToText(file)
  return textToDocx(text)
}

export async function epubToPdf(file: File): Promise<Blob> {
  const epub = await readEpub(file)
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2
  const pageH = pdf.internal.pageSize.getHeight() - margin * 2
  let y = margin
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text(epub.title.slice(0, 80), margin, y)
  y += 40
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  for (const chapter of epub.chapters) {
    const text = htmlToText(chapter.html)
    for (const raw of text.split(/(?<=[.!?])\s+/)) {
      const wrapped = pdf.splitTextToSize(raw, pageW)
      for (const wl of wrapped) {
        if (y > margin + pageH) {
          pdf.addPage()
          y = margin
        }
        pdf.text(wl, margin, y)
        y += 15
      }
    }
    y += 8
  }
  return pdf.output('blob') as Blob
}
