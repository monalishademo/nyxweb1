'use client'

import { useState } from 'react'
import {
  Presentation,
  AlertTriangle,
  Archive,
  FolderArchive,
  AudioLines,
  Bell,
  Scissors,
  Merge,
  ScanText,
  QrCode,
  Palette,
  FileImage,
  Clapperboard,
  FolderOpen,
  FileText,
  MessageSquareText,
  BarChart3,
  Code2,
  Copy,
  Check,
  Download,
  ArrowDownUp,
  Trash2,
  BookOpen,
  BookPlus,
  Table2,
  Sparkles,
  ImagePlus,
  Video,
} from 'lucide-react'
import JSZip from 'jszip'
import TurndownService from 'turndown'
import type * as XLSX from 'xlsx'

// Components & Hooks Path Fix
import FileDropZone from '@/app/components/FileDropZone'
import ResultList from '@/app/components/ResultList'
import { useConvert } from '@/app/hooks/useConvert'

// Converters & Utilities Path Fix
import { pptxToText, pptxExtractMedia } from '@/app/lib/converters/pptxConverter'
import { plainTextToPdf, textToEpub, textToDocx, textToPptx, textToRtf } from '@/app/lib/converters/ooxml'
import { textToHtmlPage, textToMarkdown, textToXml, textToXlsx } from '@/app/lib/converters/textFormats'
import {
  createZip,
  extractZip,
  createTar,
  extractTar,
  createTarGz,
  extractTarGz,
  gzipDecompress,
  listTar,
  listTarGz,
  zipTree,
} from '@/app/lib/converters/archiveConverter'
import {
  decodeAudio,
  audioBufferToWav,
  audioBufferToMp3,
  trimAudioBuffer,
  mergeAudioBuffers,
} from '@/app/lib/converters/audioConverter'
import { imageOcr, scanQrCode, extractPalette } from '@/app/lib/converters/bonusTools'
import type { PaletteColor } from '@/app/lib/converters/bonusTools'
import { openPdf, ocrPdf, pdfToZip, extractPdfText, renderPageBlob, pdfPageToSvg } from '@/app/lib/converters/pdfConverter'
import {
  videoToGif,
  videoToFramesZip,
  videoThumbnail,
  videoToAudioWav,
  videoToAudioMp3,
} from '@/app/lib/converters/videoConverter'
import { docxToRawText, docxToHtml, docxToPdf, docxToImage } from '@/app/lib/converters/wordConverter'
import {
  readWorkbook,
  workbookToPdf,
  workbookToCsv,
  workbookToJson,
  workbookToTxt,
  workbookToMarkdown,
  workbookToHtml,
  workbookToXml,
  workbookToXlsx,
} from '@/app/lib/converters/excelConverter'
import { csvToJson, csvToXml, csvToHtml, csvToMarkdown, csvToTxt, csvToXlsx, csvToPdf } from '@/app/lib/converters/csvConverter'
import {
  jsonToXml,
  xmlToJson,
  jsonToYaml,
  yamlToJson,
  jsonToCsv,
  xmlToCsv,
  htmlToMarkdown,
  markdownToHtml,
} from '@/app/lib/converters/dataConverter'
import { epubToText, epubToHtml, epubToMarkdown, epubToDocx, epubToPdf } from '@/app/lib/converters/ebookConverter'
import {
  imageToRaster,
  encodeBmp,
  encodeIco,
  imageToGif,
  imageToPdf,
  imageToSvg,
  loadImageFromFile,
} from '@/app/lib/converters/imageConverter'
import { stripExt, formatBytes, fileToText, downloadBlob } from '@/app/lib/utils'

type TabType = 'pptx' | 'word' | 'excel' | 'pdf' | 'video' | 'audio' | 'image' | 'archive' | 'csv' | 'data' | 'ebook' | 'bonus'

export default function CombinedUniversalConverter() {
  const [activeTab, setActiveTab] = useState<TabType>('pptx')

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Navigation Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-3">
        {[
          { key: 'pptx', label: 'PPTX', icon: <Presentation className="w-4 h-4" /> },
          { key: 'word', label: 'Word (DOCX)', icon: <FileText className="w-4 h-4" /> },
          { key: 'excel', label: 'Excel', icon: <Table2 className="w-4 h-4" /> },
          { key: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" /> },
          { key: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
          { key: 'audio', label: 'Audio', icon: <AudioLines className="w-4 h-4" /> },
          { key: 'image', label: 'Image', icon: <ImagePlus className="w-4 h-4" /> },
          { key: 'archive', label: 'Archive', icon: <Archive className="w-4 h-4" /> },
          { key: 'csv', label: 'CSV', icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'data', label: 'Data & Code', icon: <Code2 className="w-4 h-4" /> },
          { key: 'ebook', label: 'eBook', icon: <BookOpen className="w-4 h-4" /> },
          { key: 'bonus', label: 'Bonus Tools', icon: <Sparkles className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabType)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              activeTab === key ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Active Tab Panel Render */}
      <div>
        {activeTab === 'pptx' && <PptxTab />}
        {activeTab === 'word' && <WordTab />}
        {activeTab === 'excel' && <ExcelTab />}
        {activeTab === 'pdf' && <PdfTab />}
        {activeTab === 'video' && <VideoTab />}
        {activeTab === 'audio' && <AudioTab />}
        {activeTab === 'image' && <ImageTab />}
        {activeTab === 'archive' && <ArchiveTab />}
        {activeTab === 'csv' && <CsvTab />}
        {activeTab === 'data' && <DataTab />}
        {activeTab === 'ebook' && <EbookTab />}
        {activeTab === 'bonus' && <BonusTab />}
      </div>
    </div>
  )
}

/* ============================================================================
   1. PPTX TAB
   ============================================================================ */
const PPTX_FORMATS = [
  { value: 'txt', label: 'TXT' },
  { value: 'pdf', label: 'PDF' },
  { value: 'html', label: 'HTML' },
  { value: 'media', label: 'Media (ZIP)' },
  { value: 'ppt', label: 'PPT', unsupported: true },
  { value: 'odp', label: 'ODP', unsupported: true },
  { value: 'png', label: 'PNG (slides)', unsupported: true },
  { value: 'jpg', label: 'JPG (slides)', unsupported: true },
]

function PptxTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [format, setFormat] = useState('txt')
  const file = files[0]
  const selected = PPTX_FORMATS.find((f) => f.value === format)!

  const convert = () => {
    if (!file) return
    run(async () => {
      if (selected.unsupported) {
        throw new Error(
          `Rendering .${selected.value} slides to ${selected.label} in-browser is not supported yet. Try TXT, PDF, HTML or Media (ZIP).`
        )
      }
      const base = stripExt(file.name)
      if (format === 'media') {
        const zip = await pptxExtractMedia(file)
        return [{ filename: `${base}-media.zip`, blob: zip }]
      }
      const text = await pptxToText(file)
      if (format === 'txt') return [{ filename: `${base}.txt`, text, mime: 'text/plain' }]
      if (format === 'html') return [{ filename: `${base}.html`, text: textToHtmlPage(text, base), mime: 'text/html' }]
      return [{ filename: `${base}.pdf`, blob: plainTextToPdf(text, base) }]
    }, `Converting to ${selected.label}...`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <b>.pptx</b> (XML) files are supported. Legacy binary <b>.ppt</b> files are not. Slide-to-image rendering is not available
          in-browser — text, PDF, HTML and embedded-media extraction are.
        </span>
      </div>

      <FileDropZone
        accept=".pptx,.ppt"
        onFiles={(fs: File[]) => setFiles(fs)}
        selectedNames={file ? [file.name] : []}
        title="Drop a PowerPoint file here"
        hint="PPTX → PDF, TXT, HTML, media ZIP (legacy .ppt not supported)"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
          <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
            {PPTX_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
                {f.unsupported ? ' (not supported)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Presentation className="w-4 h-4" /> Convert PPTX → {selected.label}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   2. WORD TAB
   ============================================================================ */
const WORD_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'txt', label: 'TXT' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'rtf', label: 'RTF' },
  { value: 'epub', label: 'EPUB' },
  { value: 'png', label: 'PNG (pages)' },
  { value: 'jpg', label: 'JPG (pages)' },
  { value: 'odt', label: 'ODT', unsupported: true },
]

function WordTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [format, setFormat] = useState('pdf')
  const file = files[0]
  const selected = WORD_FORMATS.find((f) => f.value === format)!

  const convert = async () => {
    if (!file) return
    if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
      run(async () => {
        throw new Error('Legacy binary .doc files are not supported. Save it as .docx first (Word will convert it for you).')
      })
      return
    }
    if (selected.unsupported) {
      run(async () => {
        throw new Error(`In-browser ODT conversion is not supported yet. Try PDF, TXT, HTML, Markdown, RTF, EPUB or images.`)
      })
      return
    }
    run(async () => {
      const arrayBuffer = await file.arrayBuffer()
      const base = stripExt(file.name)
      switch (format) {
        case 'txt': {
          const text = await docxToRawText(arrayBuffer)
          return [{ filename: `${base}.txt`, text, mime: 'text/plain' }]
        }
        case 'html': {
          const body = await docxToHtml(arrayBuffer)
          return [{ filename: `${base}.html`, text: textToHtmlPage(body, base), mime: 'text/html' }]
        }
        case 'markdown': {
          const body = await docxToHtml(arrayBuffer)
          const md = new TurndownService({ headingStyle: 'atx' }).turndown(body)
          return [{ filename: `${base}.md`, text: md, mime: 'text/markdown' }]
        }
        case 'rtf': {
          const text = await docxToRawText(arrayBuffer)
          return [{ filename: `${base}.rtf`, text: textToRtf(text), mime: 'application/rtf' }]
        }
        case 'epub': {
          const text = await docxToRawText(arrayBuffer)
          return [{ filename: `${base}.epub`, blob: await textToEpub(text, base) }]
        }
        case 'png':
        case 'jpg': {
          const mime = format === 'png' ? 'image/png' : 'image/jpeg'
          const blob = await docxToImage(arrayBuffer, mime as 'image/png' | 'image/jpeg', base)
          return [{ filename: `${base}.${format === 'png' ? 'png' : 'jpg'}`, blob }]
        }
        case 'pdf':
        default: {
          const blob = await docxToPdf(arrayBuffer, base)
          return [{ filename: `${base}.pdf`, blob }]
        }
      }
    }, `Converting to ${selected.label}...`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Only modern <b>.docx</b> files are supported in-browser. Legacy binary <b>.doc</b> files are not readable — re-save them as
          .docx first.
        </span>
      </div>

      <FileDropZone
        accept=".docx,.doc"
        onFiles={(fs: File[]) => setFiles(fs)}
        selectedNames={file ? [file.name] : []}
        title="Drop a Word document here"
        hint="DOCX → PDF, TXT, HTML, RTF, ODT, Markdown, EPUB, PNG, JPG"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
          <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
            {WORD_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
                {f.unsupported ? ' (not supported)' : ''}
              </option>
            ))}
          </select>
          {selected.unsupported && (
            <p className="text-[11px] text-amber-500 mt-1">Not supported in-browser — will show an error if you try.</p>
          )}
        </div>
        <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <FileText className="w-4 h-4" /> Convert DOCX → {selected.label}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   3. EXCEL TAB
   ============================================================================ */
const EXCEL_FORMATS = [
  { value: 'xlsx', label: 'XLSX', bookType: 'xlsx' as XLSX.BookType },
  { value: 'xls', label: 'XLS', bookType: 'xls' as XLSX.BookType },
  { value: 'ods', label: 'ODS', bookType: 'ods' as XLSX.BookType },
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'txt', label: 'TXT' },
  { value: 'markdown', label: 'Markdown' },
]

function ExcelTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [format, setFormat] = useState('xlsx')
  const file = files[0]

  const convert = () => {
    if (!file) return
    run(async () => {
      const wb = await readWorkbook(file)
      const base = stripExt(file.name)
      const target = EXCEL_FORMATS.find((f) => f.value === format)!
      switch (format) {
        case 'csv':
          return [{ filename: `${base}.csv`, text: workbookToCsv(wb), mime: 'text/csv' }]
        case 'pdf':
          return [{ filename: `${base}.pdf`, blob: await workbookToPdf(wb) }]
        case 'html':
          return [{ filename: `${base}.html`, text: workbookToHtml(wb), mime: 'text/html' }]
        case 'json':
          return [{ filename: `${base}.json`, text: workbookToJson(wb), mime: 'application/json' }]
        case 'xml':
          return [{ filename: `${base}.xml`, text: workbookToXml(wb), mime: 'application/xml' }]
        case 'txt':
          return [{ filename: `${base}.txt`, text: workbookToTxt(wb), mime: 'text/plain' }]
        case 'markdown':
          return [{ filename: `${base}.md`, text: workbookToMarkdown(wb), mime: 'text/markdown' }]
        default:
          return [{ filename: `${base}.${format}`, blob: workbookToXlsx(wb, target.bookType) }]
      }
    }, `Converting to ${format.toUpperCase()}...`)
  }

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".xlsx,.xls,.ods,.csv,.tsv"
        onFiles={(fs: File[]) => setFiles(fs)}
        selectedNames={file ? [file.name] : []}
        title="Drop a spreadsheet here"
        hint="XLSX, XLS, ODS → CSV, XLS, XLSX, ODS, PDF, HTML, JSON, XML, TXT, Markdown"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
          <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
            {EXCEL_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Table2 className="w-4 h-4" /> Convert Spreadsheet → {format.toUpperCase()}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   4. PDF TAB
   ============================================================================ */
const PDF_TEXT_FORMATS = ['txt', 'html', 'markdown', 'xml', 'docx', 'pptx', 'epub', 'xlsx'] as const

function PdfTab() {
  const { files, setFiles, results, setResults, busy, busyText, progress, warnings, setWarnings, run, clear } = useConvert()
  const [format, setFormat] = useState('txt')
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [allPages, setAllPages] = useState(false)

  const file = files[0]

  const onFiles = async (fs: File[]) => {
    setFiles(fs)
    setResults([])
    setWarnings([])
    setNumPages(0)
    if (!fs[0]) return
    try {
      const doc = await openPdf(fs[0])
      setNumPages(doc.numPages)
    } catch {
      setFiles([])
    }
  }

  const isText = PDF_TEXT_FORMATS.includes(format as (typeof PDF_TEXT_FORMATS)[number])

  const convert = () => {
    if (!file) return
    run(async (onProgress: (p: { message: string; pct: number }) => void) => {
      const doc = await openPdf(file)
      const base = stripExt(file.name)

      if (isText) {
        const text = await extractPdfText(doc)
        onProgress({ message: 'Extracting text...', pct: 0.5 })
        switch (format) {
          case 'txt':
            return [{ filename: `${base}.txt`, text, mime: 'text/plain' }]
          case 'html':
            return [{ filename: `${base}.html`, text: textToHtmlPage(text, base), mime: 'text/html' }]
          case 'markdown':
            return [{ filename: `${base}.md`, text: textToMarkdown(text), mime: 'text/markdown' }]
          case 'xml':
            return [{ filename: `${base}.xml`, text: textToXml(text), mime: 'application/xml' }]
          case 'docx':
            return [{ filename: `${base}.docx`, blob: await textToDocx(text, base) }]
          case 'pptx':
            return [{ filename: `${base}.pptx`, blob: await textToPptx(text, base) }]
          case 'epub':
            return [{ filename: `${base}.epub`, blob: await textToEpub(text, base) }]
          default:
            return [{ filename: `${base}.xlsx`, blob: textToXlsx(text) }]
        }
      }

      const mime = format === 'png' ? 'image/png' : format === 'jpg' ? 'image/jpeg' : 'image/webp'
      const ext = format === 'jpg' ? 'jpg' : format

      if (format === 'svg') {
        const svg = await pdfPageToSvg(doc, Math.min(pageNum, doc.numPages))
        return [{ filename: `${base}-page${pageNum}.svg`, text: svg, mime: 'image/svg+xml' }]
      }
      if (format === 'ocr') {
        const p = Math.min(pageNum, doc.numPages)
        const text = await ocrPdf(doc, p, 'eng', (m: { status: string; progress: number }) =>
          onProgress({ message: `OCR ${m.status}`, pct: m.progress })
        )
        return [{ filename: `${base}-page${p}-ocr.txt`, text, mime: 'text/plain' }]
      }

      if (allPages) {
        const zip = await pdfToZip(doc, mime, (done: number, total: number) =>
          onProgress({ message: `Rendering page ${done}/${total}`, pct: done / total })
        )
        return [{ filename: `${base}-pages.zip`, blob: zip }]
      }
      const p = Math.min(pageNum, doc.numPages)
      const blob = await renderPageBlob(doc, p, mime)
      return [{ filename: `${base}-page${p}.${ext}`, blob }]
    }, 'Processing PDF...')
  }

  const pageTargets = ['png', 'jpg', 'webp', 'svg', 'ocr']

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        selectedNames={file ? [file.name] : []}
        title="Drop a PDF here"
        hint="PDF → DOCX, TXT, HTML, PNG, JPG, WEBP, SVG, EPUB, PPTX, ZIP, OCR, Excel, Markdown, XML"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
            <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
              <optgroup label="Text / Office">
                <option value="txt">TXT</option>
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
                <option value="xml">XML</option>
                <option value="docx">DOCX</option>
                <option value="pptx">PPTX</option>
                <option value="epub">EPUB</option>
                <option value="xlsx">Excel (XLSX)</option>
              </optgroup>
              <optgroup label="Images">
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
                <option value="svg">SVG (vector text)</option>
              </optgroup>
              <optgroup label="ZIP & OCR">
                <option value="zip">Images as ZIP (pages)</option>
                <option value="ocr">OCR Text</option>
              </optgroup>
            </select>
          </div>
          {pageTargets.includes(format) && numPages > 0 && (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Page (of {numPages})</label>
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={pageNum}
                  onChange={(e) => setPageNum(Math.max(1, Math.min(numPages, Number(e.target.value) || 1)))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              {(format === 'png' || format === 'jpg' || format === 'webp') && (
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allPages}
                    onChange={(e) => setAllPages(e.target.checked)}
                    className="accent-violet-500"
                  />
                  All pages (ZIP)
                </label>
              )}
            </div>
          )}
        </div>
        {format === 'ocr' && (
          <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>OCR uses Tesseract.js (eng) and needs network for the first run. Scanned or image-heavy PDFs work best.</span>
          </div>
        )}
        {format === 'svg' && (
          <p className="text-xs text-sky-600 dark:text-sky-300">
            SVG output preserves text as vector <code>&lt;text&gt;</code> elements — embedded images are not traced.
          </p>
        )}
        <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <FileText className="w-4 h-4" /> Convert PDF → {format.toUpperCase()}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   5. VIDEO TAB
   ============================================================================ */
const VIDEO_FORMATS = [
  { value: 'gif', label: 'GIF' },
  { value: 'frames', label: 'Extract Frames (ZIP)' },
  { value: 'thumbnail', label: 'Thumbnail Image' },
  { value: 'wav', label: 'Audio Only (WAV)' },
  { value: 'mp3', label: 'Audio Only (MP3)' },
  { value: 'srt', label: 'Subtitle (SRT)', unsupported: true },
  { value: 'mp4', label: 'Re-encode (MP4/AVI/MOV)', unsupported: true },
]

function VideoTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [format, setFormat] = useState('gif')
  const [frameCount, setFrameCount] = useState(12)
  const [gifDim, setGifDim] = useState(360)
  const file = files[0]
  const selected = VIDEO_FORMATS.find((f) => f.value === format)!

  const convert = () => {
    if (!file) return
    run(async (onProgress: (p: { message: string; pct: number }) => void) => {
      if (selected.unsupported) {
        throw new Error(
          format === 'srt'
            ? 'Subtitle generation needs a speech-to-text engine. Not available fully in-browser.'
            : 'Full video re-encoding needs FFmpeg (WASM). Try GIF, Frames, Thumbnail or Audio extraction instead.'
        )
      }
      const base = stripExt(file.name)
      switch (format) {
        case 'gif': {
          const blob = await videoToGif(file, frameCount, gifDim, (done: number, total: number) =>
            onProgress({ message: `Capturing frame ${done}/${total}`, pct: done / total })
          )
          return [{ filename: `${base}.gif`, blob }]
        }
        case 'frames': {
          const zip = await videoToFramesZip(file, frameCount, 'image/png', (done: number, total: number) =>
            onProgress({ message: `Extracting frame ${done}/${total}`, pct: done / total })
          )
          return [{ filename: `${base}-frames.zip`, blob: zip }]
        }
        case 'thumbnail': {
          const blob = await videoThumbnail(file, 'image/png')
          return [{ filename: `${base}-thumb.png`, blob }]
        }
        case 'wav': {
          const blob = await videoToAudioWav(file)
          return [{ filename: `${base}.wav`, blob }]
        }
        case 'mp3': {
          const blob = await videoToAudioMp3(file)
          return [{ filename: `${base}.mp3`, blob }]
        }
      }
      return []
    }, 'Processing video...')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-sky-600 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Re-encoding containers (MP4/AVI/MOV → another codec) is not available in-browser. Extract frames, make GIFs, grab
          thumbnails, or pull out the audio track instead.
        </span>
      </div>

      <FileDropZone
        accept="video/*,.mkv,.webm,.flv,.wmv,.3gp,.mov,.avi,.mp4,.m4v"
        onFiles={(fs: File[]) => setFiles(fs)}
        selectedNames={file ? [file.name] : []}
        title="Drop a video here"
        hint="MP4, AVI, MOV, MKV, WEBM, FLV, WMV, 3GP"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
            <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
              {VIDEO_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                  {f.unsupported ? ' (not supported)' : ''}
                </option>
              ))}
            </select>
          </div>
          {(format === 'gif' || format === 'frames') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Frames: {frameCount}</label>
              <input
                type="range"
                min={4}
                max={30}
                value={frameCount}
                onChange={(e) => setFrameCount(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          )}
          {format === 'gif' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GIF max dimension: {gifDim}px</label>
              <input
                type="range"
                min={120}
                max={640}
                step={20}
                value={gifDim}
                onChange={(e) => setGifDim(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          )}
        </div>
        <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Clapperboard className="w-4 h-4" /> Convert Video → {selected.label}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   6. AUDIO TAB
   ============================================================================ */
const AUDIO_CONVERT_FORMATS = [
  { value: 'mp3', label: 'MP3', supported: true },
  { value: 'wav', label: 'WAV', supported: true },
  { value: 'aac', label: 'AAC', supported: false },
  { value: 'ogg', label: 'OGG', supported: false },
  { value: 'flac', label: 'FLAC', supported: false },
  { value: 'm4a', label: 'M4A', supported: false },
  { value: 'wma', label: 'WMA', supported: false },
  { value: 'aiff', label: 'AIFF', supported: false },
]

function AudioTab() {
  const { files, setFiles, results, setResults, busy, busyText, progress, warnings, setWarnings, run, clear } = useConvert()
  const [mode, setMode] = useState<'convert' | 'trim' | 'ringtone' | 'merge'>('convert')
  const [format, setFormat] = useState('mp3')
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(30)
  const [ringLength, setRingLength] = useState(30)
  const file = files[0]
  const selected = AUDIO_CONVERT_FORMATS.find((f) => f.value === format)!

  const duration = buffer?.duration || 0

  const onFiles = async (fs: File[]) => {
    setFiles(fs)
    setResults([])
    setWarnings([])
    setBuffer(null)
    if (!fs[0]) return
    if (mode === 'convert' || mode === 'trim' || mode === 'ringtone') {
      try {
        const b = await decodeAudio(fs[0])
        setBuffer(b)
        setStart(0)
        setEnd(Math.min(30, b.duration))
      } catch {
        setWarnings(['Could not decode this audio. Codec may not be supported by your browser.'])
      }
    }
  }

  const convert = () => {
    if (!file) return
    run(async () => {
      const base = stripExt(file.name)
      if (mode === 'convert') {
        if (!selected.supported) {
          throw new Error(`In-browser ${selected.label.toUpperCase()} encoding is not supported yet. Try MP3 or WAV.`)
        }
        if (!buffer) throw new Error('Could not decode audio')
        const blob = format === 'wav' ? audioBufferToWav(buffer) : await audioBufferToMp3(buffer)
        return [{ filename: `${base}.${format}`, blob }]
      }
      if (mode === 'trim' || mode === 'ringtone') {
        if (!buffer) throw new Error('Could not decode audio')
        const s = mode === 'ringtone' ? 0 : Math.min(start, end)
        const e = mode === 'ringtone' ? Math.min(ringLength, buffer.duration) : Math.max(start, end)
        const trimmed = trimAudioBuffer(buffer, s, e)
        const blob =
          mode === 'ringtone' || format === 'mp3'
            ? await audioBufferToMp3(trimmed, 128)
            : audioBufferToWav(trimmed)
        const name = mode === 'ringtone' ? `${base}-ringtone.mp3` : `${base}-trimmed.${format === 'mp3' ? 'mp3' : 'wav'}`
        return [{ filename: name, blob }]
      }
      if (mode === 'merge') {
        if (files.length < 2) throw new Error('Add at least two audio files to merge')
        const buffers = await Promise.all(files.map((f: File) => decodeAudio(f)))
        const merged = await mergeAudioBuffers(buffers)
        const blob = format === 'wav' ? audioBufferToWav(merged) : await audioBufferToMp3(merged)
        return [{ filename: `${base}-merged.${format}`, blob }]
      }
      return []
    }, 'Processing audio...')
  }

  const MODES = [
    { value: 'convert', label: 'Convert', icon: <AudioLines className="w-4 h-4" /> },
    { value: 'trim', label: 'Audio Trim', icon: <Scissors className="w-4 h-4" /> },
    { value: 'ringtone', label: 'Ringtone', icon: <Bell className="w-4 h-4" /> },
    { value: 'merge', label: 'Audio Merge', icon: <Merge className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => {
              setMode(m.value as typeof mode)
              setResults([])
              setWarnings([])
              setBuffer(null)
              setFiles([])
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              mode === m.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <FileDropZone
        accept="audio/*,.mp3,.wav,.aac,.ogg,.flac,.m4a,.wma,.aiff,.opus"
        multiple={mode === 'merge'}
        onFiles={onFiles}
        selectedNames={files.map((f: File) => f.name)}
        title={mode === 'merge' ? 'Drop audio files (multiple)' : 'Drop an audio file here'}
        hint="MP3, WAV, AAC, OGG, FLAC, M4A, WMA, AIFF"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        {mode !== 'merge' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Output Format</label>
              <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
                {AUDIO_CONVERT_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                    {f.supported ? '' : ' (not supported)'}
                  </option>
                ))}
              </select>
            </div>
            {(mode === 'trim' || mode === 'ringtone') && duration > 0 && (
              <div className="text-xs text-slate-500 pt-5">Duration: {duration.toFixed(1)}s</div>
            )}
          </div>
        )}

        {mode === 'trim' && duration > 0 && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start: {start.toFixed(1)}s
              </label>
              <input type="range" min={0} max={Math.max(0.1, duration)} step={0.1} value={start} onChange={(e) => setStart(Number(e.target.value))} className="w-full accent-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End: {end.toFixed(1)}s
              </label>
              <input type="range" min={0} max={duration} step={0.1} value={end} onChange={(e) => setEnd(Number(e.target.value))} className="w-full accent-violet-500" />
            </div>
          </div>
        )}

        {mode === 'ringtone' && duration > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ringtone length: {ringLength}s (max {duration.toFixed(0)}s)</label>
            <input type="range" min={5} max={Math.min(60, Math.max(5, duration))} step={1} value={ringLength} onChange={(e) => setRingLength(Number(e.target.value))} className="w-full accent-violet-500" />
          </div>
        )}

        {mode === 'merge' && files.length > 1 && (
          <p className="text-xs text-slate-500">Merging {files.length} files in order.</p>
        )}

        <button onClick={convert} disabled={!files.length || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          {mode === 'convert' ? <AudioLines className="w-4 h-4" /> : mode === 'trim' ? <Scissors className="w-4 h-4" /> : mode === 'ringtone' ? <Bell className="w-4 h-4" /> : <Merge className="w-4 h-4" />}
          {mode === 'convert' ? `Convert to ${selected.label.toUpperCase()}` : mode === 'trim' ? 'Trim Audio' : mode === 'ringtone' ? 'Make Ringtone (MP3)' : 'Merge Audio Files'}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   7. IMAGE TAB
   ============================================================================ */
interface ImageTarget {
  value: string
  label: string
  ext: string
  supported: boolean
}

const IMAGE_TARGETS: ImageTarget[] = [
  { value: 'png', label: 'PNG', ext: 'png', supported: true },
  { value: 'jpeg', label: 'JPG', ext: 'jpg', supported: true },
  { value: 'webp', label: 'WEBP', ext: 'webp', supported: true },
  { value: 'bmp', label: 'BMP', ext: 'bmp', supported: true },
  { value: 'ico', label: 'ICO', ext: 'ico', supported: true },
  { value: 'gif', label: 'GIF', ext: 'gif', supported: true },
  { value: 'pdf', label: 'PDF', ext: 'pdf', supported: true },
  { value: 'svg', label: 'SVG (Vector Trace Beta)', ext: 'svg', supported: true },
  { value: 'heic', label: 'HEIC', ext: 'heic', supported: false },
  { value: 'avif', label: 'AVIF', ext: 'avif', supported: false },
  { value: 'tiff', label: 'TIFF', ext: 'tiff', supported: false },
]

function ImageTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [target, setTarget] = useState<string>('png')
  const [quality, setQuality] = useState(92)
  const [gifDim, setGifDim] = useState(320)

  const selected = IMAGE_TARGETS.find((t) => t.value === target)!
  const file = files[0]

  const convert = () => {
    if (!file) return
    if (!selected.supported) {
      run(async () => {
        throw new Error(`In-browser ${selected.label.toUpperCase()} encoding is not supported yet. Try PNG, JPG, WEBP, BMP, GIF, PDF or SVG.`)
      })
      return
    }
    const base = stripExt(file.name)
    run(async () => {
      if (selected.value === 'svg') {
        const svg = await imageToSvg(file)
        return [{ filename: `${base}.svg`, text: svg, mime: 'image/svg+xml' }]
      }
      let blob: Blob
      if (selected.value === 'png' || selected.value === 'jpeg' || selected.value === 'webp') {
        blob = await imageToRaster(file, `image/${selected.value}`, quality / 100)
      } else if (selected.value === 'bmp') {
        const img = await loadImageFromFile(file)
        blob = encodeBmp(img)
      } else if (selected.value === 'ico') {
        const img = await loadImageFromFile(file)
        blob = encodeIco(img)
      } else if (selected.value === 'gif') {
        blob = await imageToGif(file, gifDim)
      } else {
        blob = await imageToPdf(file, 'JPEG')
      }
      return [{ filename: `${base}.${selected.ext}`, blob }]
    }, `Converting to ${selected.label}...`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-sky-600 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          SVG → JPG/PNG is real vector-to-raster conversion, but JPG/PNG → SVG is an approximate vector trace, not a true vector
          conversion. It is labelled <b>Experimental / Vector Trace (Beta)</b>.
        </p>
      </div>

      <FileDropZone
        accept="image/*,.heic,.heif,.avif,.tiff,.tif"
        onFiles={(fs: File[]) => setFiles(fs)}
        selectedNames={file ? [file.name] : []}
        title="Drop an image here"
        hint="PNG, JPG, WEBP, GIF, BMP, ICO, SVG, PDF, HEIC, AVIF, TIFF"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
            <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={target} onChange={(e) => setTarget(e.target.value)}>
              {IMAGE_TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {!selected.supported && (
              <p className="text-[11px] text-amber-500 mt-1">Not supported in-browser — will show an error if you try.</p>
            )}
          </div>
          {(selected.value === 'jpeg' || selected.value === 'webp') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quality: {quality}%</label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          )}
          {selected.value === 'gif' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max dimension: {gifDim}px</label>
              <input
                type="range"
                min={120}
                max={720}
                step={20}
                value={gifDim}
                onChange={(e) => setGifDim(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          )}
        </div>
        <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <ImagePlus className="w-4 h-4" /> Convert to {selected.label}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   8. ARCHIVE TAB
   ============================================================================ */
const ARCHIVE_CREATE_FORMATS = [
  { value: 'zip', label: 'ZIP', supported: true },
  { value: 'tar', label: 'TAR', supported: true },
  { value: 'targz', label: 'TAR.GZ', supported: true },
  { value: '7z', label: '7Z', supported: false },
  { value: 'rar', label: 'RAR', supported: false },
]

function ArchiveTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [mode, setMode] = useState<'create' | 'extract'>('create')
  const [format, setFormat] = useState('zip')
  const file = files[0]
  const selected = ARCHIVE_CREATE_FORMATS.find((f) => f.value === format)!

  const create = () => {
    if (!files.length) return
    run(async () => {
      if (!selected.supported) {
        throw new Error(
          selected.value === 'rar'
            ? 'Creating RAR archives is not possible in-browser (proprietary/licensed format). Use ZIP or TAR.'
            : `In-browser 7Z creation is not supported yet. Use ZIP or TAR.`
        )
      }
      const name = `archive.${selected.value === 'targz' ? 'tar.gz' : selected.value}`
      if (selected.value === 'zip') {
        const blob = await createZip(files)
        return [{ filename: name, blob }]
      }
      if (selected.value === 'tar') {
        const blob = await createTar(files)
        return [{ filename: name, blob }]
      }
      const blob = await createTarGz(files)
      return [{ filename: name, blob }]
    }, `Creating ${selected.label} archive...`)
  }

  const extract = () => {
    if (!file) return
    run(async () => {
      const lower = file.name.toLowerCase()
      let entries: { name: string; blob: Blob }[] = []
      let listing = ''
      if (lower.endsWith('.zip')) {
        const { files: f } = await extractZip(file)
        entries = f
      } else if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
        entries = await extractTarGz(file)
        listing = (await listTarGz(file)).join('\n')
      } else if (lower.endsWith('.tar')) {
        entries = await extractTar(file)
        listing = (await listTar(file)).join('\n')
      } else if (lower.endsWith('.gz')) {
        const decompressed = await gzipDecompress(file)
        const name = file.name.replace(/\.gz$/i, '')
        entries = [{ name: name || 'decompressed', blob: decompressed }]
      } else if (lower.endsWith('.7z') || lower.endsWith('.rar')) {
        throw new Error(
          `Extracting .${lower.split('.').pop()} needs a WASM codec that is not bundled. Use ZIP, TAR or GZIP instead.`
        )
      } else {
        throw new Error('Unsupported archive type. Try ZIP, TAR, GZIP or TAR.GZ.')
      }

      const zip = new JSZip()
      for (const e of entries) zip.file(e.name, e.blob)
      const combined = await zip.generateAsync({ type: 'blob' })
      const base = stripExt(file.name)
      const summary = `Extracted ${entries.length} file(s) from ${file.name} (${formatBytes(file.size)})\n\n${entries
        .map((e) => `- ${e.name}`)
        .join('\n')}`
      return [
        { filename: `${base}-extracted.zip`, blob: combined },
        { filename: `${base}-contents.txt`, text: listing || summary, mime: 'text/plain' },
      ]
    }, 'Extracting archive...')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          RAR extraction/creation is not possible in-browser (proprietary format). 7Z is not bundled. ZIP, TAR, GZIP and TAR.GZ are
          fully supported.
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setMode('create')
            clear()
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            mode === 'create' ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Archive className="w-4 h-4" /> Create Archive
        </button>
        <button
          onClick={() => {
            setMode('extract')
            clear()
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            mode === 'extract' ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <FolderArchive className="w-4 h-4" /> Extract Archive
        </button>
      </div>

      {mode === 'create' ? (
        <>
          <FileDropZone
            multiple
            onFiles={(fs: File[]) => setFiles(fs)}
            selectedNames={files.map((f: File) => f.name)}
            title="Drop files to archive"
            hint="Pick as many files as you like"
          />
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Archive Format</label>
              <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
                {ARCHIVE_CREATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                    {f.supported ? '' : ' (not supported)'}
                  </option>
                ))}
              </select>
              {selected.value === 'rar' && (
                <p className="text-[11px] text-amber-500 mt-1">Creating RAR is avoided — proprietary license.</p>
              )}
            </div>
            <button onClick={create} disabled={!files.length || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Archive className="w-4 h-4" /> Create {selected.label} Archive
            </button>
          </div>
        </>
      ) : (
        <>
          <FileDropZone
            accept=".zip,.tar,.gz,.tgz,.7z,.rar"
            onFiles={(fs: File[]) => setFiles(fs)}
            selectedNames={file ? [file.name] : []}
            title="Drop an archive here"
            hint="ZIP, TAR, GZIP, TAR.GZ (7Z and RAR are not supported)"
          />
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button onClick={extract} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              <FolderArchive className="w-4 h-4" /> Extract Archive
            </button>
          </div>
        </>
      )}

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   9. CSV TAB
   ============================================================================ */
const CSV_FORMATS = [
  { value: 'xlsx', label: 'XLSX' },
  { value: 'ods', label: 'ODS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'html', label: 'HTML' },
  { value: 'pdf', label: 'PDF' },
  { value: 'txt', label: 'TXT' },
  { value: 'markdown', label: 'Markdown' },
]

function CsvTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [format, setFormat] = useState('xlsx')
  const [hasHeader, setHasHeader] = useState(true)
  const file = files[0]

  const convert = () => {
    if (!file) return
    run(async () => {
      const csv = await fileToText(file)
      const base = stripExt(file.name)
      const effective = hasHeader ? csv : addHeaderRow(csv)
      switch (format) {
        case 'json':
          return [{ filename: `${base}.json`, text: csvToJson(csv), mime: 'application/json' }]
        case 'xml':
          return [{ filename: `${base}.xml`, text: csvToXml(csv), mime: 'application/xml' }]
        case 'html':
          return [{ filename: `${base}.html`, text: csvToHtml(csv), mime: 'text/html' }]
        case 'pdf':
          return [{ filename: `${base}.pdf`, blob: await csvToPdf(csv) }]
        case 'txt':
          return [{ filename: `${base}.txt`, text: csvToTxt(csv), mime: 'text/plain' }]
        case 'markdown':
          return [{ filename: `${base}.md`, text: csvToMarkdown(csv), mime: 'text/markdown' }]
        case 'ods':
          return [{ filename: `${base}.ods`, blob: csvToXlsx(csv, 'ods') }]
        case 'xlsx':
        default:
          return [{ filename: `${base}.xlsx`, blob: csvToXlsx(csv, 'xlsx') }]
      }
    }, `Converting to ${format.toUpperCase()}...`)
  }

  const addHeaderRow = (csv: string) => {
    const lines = csv.split('\n')
    const count = Math.max(1, (lines[0] || '').split(',').length)
    const headers = Array.from({ length: count }, (_, i) => `Column ${i + 1}`).join(',')
    return `${headers}\n${csv}`
  }

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".csv,.tsv,text/csv,text/tab-separated-values"
        onFiles={(fs: File[]) => setFiles(fs)}
        selectedNames={file ? [file.name] : []}
        title="Drop a CSV file here"
        hint="CSV → XLSX, ODS, JSON, XML, HTML, PDF, TXT, Markdown"
      />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
            <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
              {CSV_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="accent-violet-500"
            />
            First row is a header
          </label>
        </div>
        <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <BarChart3 className="w-4 h-4" /> Convert CSV → {format.toUpperCase()}
        </button>
      </div>

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   10. DATA TAB
   ============================================================================ */
const DATA_MODES = [
  { value: 'json2xml', label: 'JSON → XML', fn: jsonToXml },
  { value: 'xml2json', label: 'XML → JSON', fn: xmlToJson },
  { value: 'json2yaml', label: 'JSON → YAML', fn: jsonToYaml },
  { value: 'yaml2json', label: 'YAML → JSON', fn: yamlToJson },
  { value: 'csv2json', label: 'CSV → JSON', fn: csvToJson },
  { value: 'json2csv', label: 'JSON → CSV', fn: jsonToCsv },
  { value: 'csv2xml', label: 'CSV → XML', fn: csvToXml },
  { value: 'xml2csv', label: 'XML → CSV', fn: xmlToCsv },
  { value: 'html2md', label: 'HTML → Markdown', fn: htmlToMarkdown },
  { value: 'md2html', label: 'Markdown → HTML', fn: markdownToHtml },
]

function DataTab() {
  const { busy, run } = useConvert()
  const [mode, setMode] = useState('json2xml')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const active = DATA_MODES.find((m) => m.value === mode)!

  const convert = () => {
    if (!input.trim()) return
    run(async () => {
      const result = active.fn(input)
      setOutput(result)
      return []
    }, `Converting ${active.label}...`)
  }

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Conversion</label>
            <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={mode} onChange={(e) => setMode(e.target.value)}>
              {DATA_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={convert}
              disabled={!input.trim() || busy}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowDownUp className="w-4 h-4" /> Convert
            </button>
            <button onClick={() => setInput('')} className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" title="Clear input">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Input</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={14}
              spellCheck={false}
              placeholder={`Paste ${active.label.split(' → ')[0]} here...`}
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Output</label>
              <div className="flex gap-2">
                <button onClick={copy} disabled={!output} className="px-2 py-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() =>
                    output &&
                    downloadBlob(new Blob([output], { type: 'text/plain;charset=utf-8' }), `converted.${extFor(mode)}`)
                  }
                  disabled={!output}
                  className="px-2 py-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={14}
              readOnly={false}
              spellCheck={false}
              placeholder="Result appears here..."
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function extFor(mode: string): string {
  if (mode.includes('xml')) return 'xml'
  if (mode.includes('yaml')) return 'yaml'
  if (mode.includes('csv')) return 'csv'
  if (mode.includes('md') || mode.includes('html')) return 'txt'
  return 'json'
}

/* ============================================================================
   11. EBOOK TAB
   ============================================================================ */
const EBOOK_FORMATS = [
  { value: 'txt', label: 'TXT' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'docx', label: 'DOCX' },
  { value: 'pdf', label: 'PDF' },
  { value: 'mobi', label: 'MOBI', unsupported: true },
  { value: 'azw3', label: 'AZW3', unsupported: true },
]

function EbookTab() {
  const { files, setFiles, results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [mode, setMode] = useState<'convert' | 'create'>('convert')
  const [format, setFormat] = useState('txt')
  const [createText, setCreateText] = useState('')
  const file = files[0]
  const selected = EBOOK_FORMATS.find((f) => f.value === format)!

  const convert = () => {
    if (!file) return
    run(async () => {
      if (mode === 'create') {
        if (!createText.trim()) throw new Error('Paste or upload some text first')
        const title = file ? stripExt(file.name) : 'Converted Book'
        const blob = await textToEpub(createText, title)
        return [{ filename: `${title}.epub`, blob }]
      }
      if (selected.unsupported) {
        throw new Error(`In-browser ${selected.label.toUpperCase()} conversion is not supported yet. Try TXT, HTML, Markdown, DOCX or PDF.`)
      }
      const base = stripExt(file.name)
      switch (format) {
        case 'html':
          return [{ filename: `${base}.html`, text: await epubToHtml(file), mime: 'text/html' }]
        case 'markdown':
          return [{ filename: `${base}.md`, text: await epubToMarkdown(file), mime: 'text/markdown' }]
        case 'docx':
          return [{ filename: `${base}.docx`, blob: await epubToDocx(file) }]
        case 'pdf':
          return [{ filename: `${base}.pdf`, blob: await epubToPdf(file) }]
        default:
          return [{ filename: `${base}.txt`, text: await epubToText(file), mime: 'text/plain' }]
      }
    }, mode === 'create' ? 'Creating EPUB...' : `Converting EPUB → ${selected.label}...`)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => {
            setMode('convert')
            clear()
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            mode === 'convert' ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Convert EPUB
        </button>
        <button
          onClick={() => {
            setMode('create')
            clear()
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            mode === 'create' ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <BookPlus className="w-4 h-4" /> Create EPUB
        </button>
      </div>

      {mode === 'convert' ? (
        <>
          <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>MOBI/AZW3 (Kindle) conversion needs the proprietary KindleGen tool — not available in-browser.</span>
          </div>
          <FileDropZone
            accept=".epub,application/epub+zip"
            onFiles={(fs: File[]) => setFiles(fs)}
            selectedNames={file ? [file.name] : []}
            title="Drop an EPUB here"
            hint="EPUB → TXT, HTML, Markdown, DOCX, PDF"
          />
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Convert To</label>
              <select className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={format} onChange={(e) => setFormat(e.target.value)}>
                {EBOOK_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                    {f.unsupported ? ' (not supported)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={convert} disabled={!file || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              <BookOpen className="w-4 h-4" /> Convert EPUB → {selected.label}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <FileDropZone
            accept=".txt,.md,.markdown,.html"
            onFiles={async (fs: File[]) => {
              setFiles(fs)
              if (fs[0]) {
                const text = await fileToText(fs[0])
                setCreateText(text)
              }
            }}
            selectedNames={file ? [file.name] : []}
            title="Drop a TXT / Markdown / HTML file (optional)"
            hint="Or paste content below"
          />
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Book content</label>
              <textarea
                value={createText}
                onChange={(e) => setCreateText(e.target.value)}
                rows={10}
                placeholder="Paste your book content here..."
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              />
            </div>
            <button onClick={convert} disabled={!createText.trim() || busy} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              <BookPlus className="w-4 h-4" /> Create EPUB
            </button>
          </div>
        </div>
      )}

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}

/* ============================================================================
   12. BONUS TAB
   ============================================================================ */
type FeatureId = 'ocr' | 'pdfocr' | 'qr' | 'palette' | 'pdfimg' | 'vgif' | 'vframes' | 'zippreview' | 'officepdf' | 'transcript'

interface FeatureDef {
  id: FeatureId
  label: string
  desc: string
  icon: React.ReactNode
  accept: string
  supported: boolean
}

interface ZipEntry {
  name: string
  dir: boolean
  size: number
}

const BONUS_FEATURES: FeatureDef[] = [
  { id: 'ocr', label: 'Image → OCR Text', desc: 'Recognise text from a photo or scan', icon: <ScanText className="w-4 h-4" />, accept: 'image/*', supported: true },
  { id: 'pdfocr', label: 'PDF → OCR Text', desc: 'Run OCR on a PDF page', icon: <ScanText className="w-4 h-4" />, accept: '.pdf,application/pdf', supported: true },
  { id: 'qr', label: 'Image → QR Scan', desc: 'Decode QR codes in images', icon: <QrCode className="w-4 h-4" />, accept: 'image/*', supported: true },
  { id: 'palette', label: 'Image → Color Palette', desc: 'Extract dominant colors', icon: <Palette className="w-4 h-4" />, accept: 'image/*', supported: true },
  { id: 'pdfimg', label: 'PDF → Images (ZIP)', desc: 'Render every page to PNG', icon: <FileImage className="w-4 h-4" />, accept: '.pdf,application/pdf', supported: true },
  { id: 'vgif', label: 'Video → GIF', desc: 'Animated GIF from video', icon: <Clapperboard className="w-4 h-4" />, accept: 'video/*', supported: true },
  { id: 'vframes', label: 'Video → Frames', desc: 'Extract stills as ZIP', icon: <Clapperboard className="w-4 h-4" />, accept: 'video/*', supported: true },
  { id: 'zippreview', label: 'ZIP → Folder Preview', desc: 'List contents of an archive', icon: <FolderOpen className="w-4 h-4" />, accept: '.zip', supported: true },
  { id: 'officepdf', label: 'Office → PDF', desc: 'DOCX / XLSX / PPTX to PDF', icon: <FileText className="w-4 h-4" />, accept: '.docx,.xlsx,.xls,.ods,.pptx', supported: true },
  { id: 'transcript', label: 'Audio → Transcript', desc: 'Speech-to-text from audio', icon: <MessageSquareText className="w-4 h-4" />, accept: 'audio/*', supported: false },
]

function BonusTab() {
  const { results, busy, busyText, progress, warnings, run, clear } = useConvert()
  const [feature, setFeature] = useState<FeatureId>('ocr')
  const [pdfPage, setPdfPage] = useState(1)
  const [frameCount, setFrameCount] = useState(10)
  const [palette, setPalette] = useState<PaletteColor[]>([])
  const [qrResult, setQrResult] = useState<string | null>(null)
  const [zipPreview, setZipPreview] = useState<ZipEntry[] | null>(null)
  const [ocrText, setOcrText] = useState('')

  const active = BONUS_FEATURES.find((f) => f.id === feature)!

  const handleFile = async (file: File) => {
    clear()
    setPalette([])
    setQrResult(null)
    setZipPreview(null)
    setOcrText('')
    const base = stripExt(file.name)

    switch (feature) {
      case 'ocr':
        run(async (onProgress: (p: { message: string; pct: number }) => void) => {
          const text = await imageOcr(file, 'eng', (m: { status: string; progress: number }) =>
            onProgress({ message: `OCR ${m.status}`, pct: m.progress })
          )
          setOcrText(text)
          return [{ filename: `${base}-ocr.txt`, text, mime: 'text/plain' }]
        }, 'Running OCR...')
        break

      case 'pdfocr':
        run(async (onProgress: (p: { message: string; pct: number }) => void) => {
          const doc = await openPdf(file)
          const text = await ocrPdf(doc, pdfPage, 'eng', (m: { status: string; progress: number }) =>
            onProgress({ message: `OCR page ${pdfPage} — ${m.status}`, pct: m.progress })
          )
          setOcrText(text)
          return [{ filename: `${base}-page${pdfPage}-ocr.txt`, text, mime: 'text/plain' }]
        }, 'Running OCR on PDF...')
        break

      case 'qr':
        run(async () => {
          const data = await scanQrCode(file)
          setQrResult(data)
          if (!data) throw new Error('No QR code found in the image. Try a clearer, more focused shot.')
          return [{ filename: `${base}-qr.txt`, text: data, mime: 'text/plain' }]
        }, 'Scanning QR code...')
        break

      case 'palette':
        run(async () => {
          const colors = await extractPalette(file, 8)
          setPalette(colors)
          return [
            {
              filename: `${base}-palette.txt`,
              text: colors.map((c: { hex: string; count: number; pct: number }) => `${c.hex}  ${c.count}px  (${c.pct}%)`).join('\n'),
              mime: 'text/plain',
            },
          ]
        }, 'Extracting colors...')
        break

      case 'pdfimg':
        run(async (onProgress: (p: { message: string; pct: number }) => void) => {
          const doc = await openPdf(file)
          const zip = await pdfToZip(doc, 'image/png', (done: number, total: number) =>
            onProgress({ message: `Rendering page ${done}/${total}`, pct: done / total })
          )
          return [{ filename: `${base}-pages.zip`, blob: zip }]
        }, 'Rendering PDF pages...')
        break

      case 'vgif':
        run(async (onProgress: (p: { message: string; pct: number }) => void) => {
          const blob = await videoToGif(file, 12, 360, (done: number, total: number) =>
            onProgress({ message: `Frame ${done}/${total}`, pct: done / total })
          )
          return [{ filename: `${base}.gif`, blob }]
        }, 'Making GIF...')
        break

      case 'vframes':
        run(async (onProgress: (p: { message: string; pct: number }) => void) => {
          const blob = await videoToFramesZip(file, frameCount, 'image/png', (done: number, total: number) =>
            onProgress({ message: `Extracting frame ${done}/${total}`, pct: done / total })
          )
          return [{ filename: `${base}-frames.zip`, blob }]
        }, 'Extracting frames...')
        break

      case 'zippreview':
        run(async () => {
          const tree = await zipTree(file)
          setZipPreview(tree)
          const text = tree
            .map((t: ZipEntry) => `${t.dir ? '[dir] ' : ''}${t.name}${t.dir ? '/' : ` (${formatBytes(t.size)})`}`)
            .join('\n')
          return [{ filename: `${base}-contents.txt`, text, mime: 'text/plain' }]
        }, 'Reading archive...')
        break

      case 'officepdf':
        run(async () => {
          const lower = file.name.toLowerCase()
          if (lower.endsWith('.docx')) {
            const blob = await docxToPdf(await file.arrayBuffer(), base)
            return [{ filename: `${base}.pdf`, blob }]
          }
          if (lower.endsWith('.pptx')) {
            const text = await pptxToText(file)
            return [{ filename: `${base}.pdf`, blob: plainTextToPdf(text, base) }]
          }
          if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.ods') || lower.endsWith('.csv')) {
            const wb = await readWorkbook(file)
            const blob = await workbookToPdf(wb)
            return [{ filename: `${base}.pdf`, blob }]
          }
          throw new Error('Unsupported office file')
        }, 'Converting to PDF...')
        break

      case 'transcript':
        run(async () => {
          throw new Error('Speech-to-text needs a cloud STT engine. Not available fully in-browser. Use the platform or an STT API.')
        })
        break
    }
  }

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) await handleFile(f)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BONUS_FEATURES.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFeature(f.id)
              clear()
            }}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              feature === f.id
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={feature === f.id ? 'text-violet-500' : 'text-slate-500'}>{f.icon}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.label}</span>
              {!f.supported && <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-500 font-medium">beta</span>}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.desc}</p>
          </button>
        ))}
      </div>

      {!active.supported ? (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Audio → Transcript requires a cloud speech-to-text engine, which this offline tool doesn't bundle. Use an STT API or
            platform instead.
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
          {feature === 'pdfocr' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Page number</label>
              <input
                type="number"
                min={1}
                value={pdfPage}
                onChange={(e) => setPdfPage(Math.max(1, Number(e.target.value) || 1))}
                className="w-32 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}
          {feature === 'vframes' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Number of frames: {frameCount}</label>
              <input
                type="range"
                min={2}
                max={24}
                value={frameCount}
                onChange={(e) => setFrameCount(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          )}
          <label
            className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center transition-all hover:border-violet-500 hover:bg-violet-500/10 block"
          >
            <input type="file" accept={active.accept} className="hidden" onChange={onInputChange} />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{active.label}</span>
            <span className="block text-xs text-slate-500 mt-1">{active.desc} — Click to upload</span>
          </label>
          {busy && <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">{busyText}</p>}
        </div>
      )}

      {palette.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Palette</h3>
          <div className="flex flex-wrap gap-2">
            {palette.map((c) => (
              <div key={c.hex} className="text-center">
                <div className="w-14 h-14 rounded-lg border border-slate-300 dark:border-slate-700" style={{ backgroundColor: c.hex }} />
                <p className="text-[10px] text-slate-500 mt-1">{c.hex}</p>
                <p className="text-[10px] text-slate-400">{c.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {qrResult && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">QR Content</h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 rounded-lg p-3 break-all font-mono">{qrResult}</p>
        </div>
      )}

      {ocrText && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">OCR Result</h3>
          <pre className="text-xs text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 rounded-lg p-3 max-h-60 overflow-auto whitespace-pre-wrap">{ocrText}</pre>
        </div>
      )}

      {zipPreview && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Archive Contents ({zipPreview.length} entries)</h3>
          <div className="max-h-60 overflow-auto rounded-lg bg-slate-200 dark:bg-slate-800 p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
            {zipPreview.map((t: ZipEntry) => (
              <div key={t.name} className="truncate">
                <span className={t.dir ? 'text-amber-500' : ''}>
                  {t.dir ? '[DIR] ' : ''} {t.name}
                  {t.dir ? '/' : ` — ${formatBytes(t.size)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResultList items={results} busy={busy} busyText={busyText} progress={progress} warnings={warnings} onClear={clear} />
    </div>
  )
}