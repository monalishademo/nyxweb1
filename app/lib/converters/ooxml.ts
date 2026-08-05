import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import pptxgen from 'pptxgenjs'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

export function plainTextToPdf(text: string, title = 'Document'): Blob {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2
  const pageH = pdf.internal.pageSize.getHeight() - margin * 2
  let y = margin
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text(title.slice(0, 80), margin, y)
  y += 30
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  for (const raw of text.split('\n')) {
    const wrapped = pdf.splitTextToSize(raw || ' ', pageW)
    for (const wl of wrapped) {
      if (y > margin + pageH) {
        pdf.addPage()
        y = margin
      }
      pdf.text(wl, margin, y)
      y += 15
    }
  }
  return pdf.output('blob') as Blob
}

export async function textToDocx(text: string, title = 'Document'): Promise<Blob> {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const children: Paragraph[] = lines.map(
    (line) => new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 60 } })
  )
  const doc = new Document({
    title,
    sections: [{ children }],
  })
  const blob = await Packer.toBlob(doc)
  return blob
}

export async function textToPptx(text: string, title = 'Presentation'): Promise<Blob> {
  const pptx = new pptxgen()
  pptx.title = title
  pptx.layout = 'LAYOUT_WIDE'
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim())
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  slide.addText(title, { x: 0.5, y: 0.3, w: 12.4, h: 0.7, fontSize: 28, bold: true, color: '4C1D95' })
  const body = lines.slice(0, 220).join('\n')
  slide.addText(body, { x: 0.5, y: 1.2, w: 12.4, h: 5.8, fontSize: 12, color: '1E293B' })
  const write = pptx.write as unknown as (type: 'blob') => Promise<Blob>
  return write('blob')
}

export function htmlToDocxBlob(html: string): Blob {
  const header =
    '<html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title></title></head><body>'
  const footer = '</body></html>'
  return new Blob([header + html + footer], {
    type: 'application/msword;charset=utf-8',
  })
}

export async function textToEpub(
  text: string,
  title = 'Document',
  author = 'Universal Converter'
): Promise<Blob> {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('\n')

  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip')
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  )
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="c1"/>
  </spine>
</package>`
  )
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${title}</title></head>
<body><nav epub:type="toc"><h1>Table of Contents</h1><ol><li><a href="chapter1.xhtml">${title}</a></li></ol></nav></body>
</html>`
  )
  zip.file(
    'OEBPS/chapter1.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${title}</title></head>
<body><h1>${title}</h1>
${paragraphs}
</body>
</html>`
  )

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'STORE',
    compressionOptions: { level: 0 },
  })
  return blob
}

export function textToRtf(text: string): string {
  const esc = text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => `${line}\n\\par `)
    .join('')
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}\\f0\\fs24 ${esc}}`
}
