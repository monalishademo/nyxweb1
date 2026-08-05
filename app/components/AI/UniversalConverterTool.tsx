'use client';

// ─────────────────────────────────────────────────────────────────────────
// PHASE 1 — npm packages required:
//   npm install fast-xml-parser js-yaml marked turndown jsqr
//   npm install -D @types/js-yaml @types/turndown
//
// NOT included yet (need heavy WASM libs — see Phase 2/3):
//   GIF encode/decode (gif.js) · HEIC decode (heic2any) · TIFF (utif.js)
//   Video/Audio transcode (ffmpeg.wasm) · OCR (tesseract.js)
//   PDF → DOCX/PPTX, EPUB/MOBI/AZW3, RAR creation — need a server
// ─────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import * as yaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';
import jsQR from 'jsqr';
import BackButton from '../BackButton';
import { formatFileSize } from '../../lib/utils';

interface UniversalConverterProps {
  pdfjs?: any;
  onBack: () => void;
}

type FileCategory = 'image' | 'pdf' | 'excel' | 'word' | 'ppt' | 'text' | 'data' | 'unknown';
type DataSubtype = 'json' | 'xml' | 'yaml' | 'md' | 'html' | null;
type PreviewKind = 'image' | 'pdf' | 'text' | 'archive';

interface ResultPreview {
  kind: PreviewKind;
  url: string;
  filename: string;
  content?: string;
  truncated?: boolean;
  isHtml?: boolean;
  archiveEntries?: number;
}

// ── Design tokens ───────────────────────────────────────────────────────
const T = {
  paper: '#E9EFF4',
  paperDeep: '#DCE6EF',
  paperLine: '#C4D3DF',
  ink: '#16324B',
  inkSoft: '#4B6478',
  brass: '#B8791F',
  brassDeep: '#8F5E15',
  trace: '#1B8F8C',
  traceDeep: '#146F6D',
  alert: '#B23B3B',
  white: '#FBFCFD',
};

export default function UniversalConverterTool({ pdfjs, onBack }: UniversalConverterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileCategory>('unknown');
  const [dataSubtype, setDataSubtype] = useState<DataSubtype>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [downloadResult, setDownloadResult] = useState<{ url: string; filename: string } | null>(null);
  const [resultPreview, setResultPreview] = useState<ResultPreview | null>(null);
  const [htmlPreviewMode, setHtmlPreviewMode] = useState<'code' | 'rendered'>('code');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [qrResult, setQrResult] = useState<string | null>(null);
  const [paletteResult, setPaletteResult] = useState<string[] | null>(null);

  const resetResultState = () => {
    setDownloadResult(null);
    setResultPreview(null);
    setQrResult(null);
    setPaletteResult(null);
    setProgressPercent(null);
  };

  const handleFileUpload = (selectedFile: File) => {
    setFile(selectedFile);
    resetResultState();
    setStatusMessage('');
    setDataSubtype(null);

    const type = selectedFile.type;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();

    if (type.startsWith('image/')) {
      setFileType('image');
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else if (type === 'application/pdf' || ext === 'pdf') {
      setFileType('pdf');
      setPreviewUrl(null);
    } else if (['xlsx', 'xls', 'csv'].includes(ext || '') || type.includes('spreadsheetml') || type.includes('ms-excel')) {
      setFileType('excel');
      setPreviewUrl(null);
    } else if (['docx', 'doc'].includes(ext || '') || type.includes('wordprocessingml')) {
      setFileType('word');
      setPreviewUrl(null);
    } else if (['pptx', 'ppt'].includes(ext || '') || type.includes('presentationml')) {
      setFileType('ppt');
      setPreviewUrl(null);
    } else if (['json', 'xml', 'yaml', 'yml', 'md', 'markdown', 'html', 'htm'].includes(ext || '')) {
      setFileType('data');
      setPreviewUrl(null);
      if (ext === 'json') setDataSubtype('json');
      else if (ext === 'xml') setDataSubtype('xml');
      else if (ext === 'yaml' || ext === 'yml') setDataSubtype('yaml');
      else if (ext === 'md' || ext === 'markdown') setDataSubtype('md');
      else if (ext === 'html' || ext === 'htm') setDataSubtype('html');
    } else if (type.startsWith('text/') || ext === 'txt') {
      setFileType('text');
      setPreviewUrl(null);
    } else {
      setFileType('unknown');
    }
  };

  const baseName = () => file?.name.split('.').slice(0, -1).join('.') || 'converted';

  // Builds the result card + an inline preview (instead of auto-downloading)
  const presentResult = async (blob: Blob, filename: string, meta?: { archiveEntries?: number }) => {
    const url = URL.createObjectURL(blob);
    setDownloadResult({ url, filename });

    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'avif', 'ico', 'gif'];
    const textExts = ['txt', 'html', 'htm', 'json', 'xml', 'yaml', 'yml', 'md', 'csv'];

    if (imageExts.includes(ext)) {
      setResultPreview({ kind: 'image', url, filename });
    } else if (ext === 'pdf') {
      setResultPreview({ kind: 'pdf', url, filename });
    } else if (ext === 'zip') {
      setResultPreview({ kind: 'archive', url, filename, archiveEntries: meta?.archiveEntries });
    } else if (textExts.includes(ext)) {
      try {
        let text = await blob.text();
        let truncated = false;
        if (text.length > 20000) { text = text.slice(0, 20000); truncated = true; }
        setResultPreview({ kind: 'text', url, filename, content: text, truncated, isHtml: ext === 'html' || ext === 'htm' });
        setHtmlPreviewMode('code');
      } catch {
        setResultPreview(null);
      }
    } else {
      setResultPreview(null);
    }
  };

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── 1. Word ──────────────────────────────────────────────────────────
  const convertWordTo = async (format: 'pdf' | 'txt' | 'html') => {
    if (!file) return;
    setIsProcessing(true);
    setActiveAction(`word-${format}`);
    resetResultState();
    setStatusMessage(`Converting Word to ${format.toUpperCase()}...`);

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (format === 'html') {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        await presentResult(new Blob([result.value], { type: 'text/html;charset=utf-8' }), `${baseName()}.html`);
      } else {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        if (format === 'txt') {
          await presentResult(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${baseName()}.txt`);
        } else if (format === 'pdf') {
          const doc = new jsPDF({ unit: 'pt', format: 'a4' });
          const splitText = doc.splitTextToSize(text, 500);
          let y = 40;
          for (let i = 0; i < splitText.length; i++) {
            if (y > 780) { doc.addPage(); y = 40; }
            doc.text(splitText[i], 40, y);
            y += 16;
          }
          await presentResult(doc.output('blob'), `${baseName()}.pdf`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to convert Word file.');
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  // ── 2. Excel ─────────────────────────────────────────────────────────
  const convertExcelTo = async (format: 'pdf' | 'csv' | 'html' | 'json' | 'xml') => {
    if (!file) return;
    setIsProcessing(true);
    setActiveAction(`excel-${format}`);
    resetResultState();
    setStatusMessage(`Converting Excel sheet to ${format.toUpperCase()}...`);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (format === 'csv') {
        await presentResult(new Blob([XLSX.utils.sheet_to_csv(worksheet)], { type: 'text/csv;charset=utf-8;' }), `${baseName()}.csv`);
      } else if (format === 'html') {
        await presentResult(new Blob([XLSX.utils.sheet_to_html(worksheet)], { type: 'text/html;charset=utf-8;' }), `${baseName()}.html`);
      } else if (format === 'json') {
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        await presentResult(new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' }), `${baseName()}.json`);
      } else if (format === 'xml') {
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const builder = new XMLBuilder({ format: true, arrayNodeName: 'row' });
        const xmlData = builder.build({ rows: { row: jsonData } });
        await presentResult(new Blob([xmlData], { type: 'application/xml;charset=utf-8;' }), `${baseName()}.xml`);
      } else if (format === 'pdf') {
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!jsonData || jsonData.length === 0) { alert('Excel sheet is empty!'); return; }
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
        autoTable(doc, {
          head: [jsonData[0] || []],
          body: jsonData.slice(1),
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [22, 50, 75] },
          margin: { top: 30, left: 20, right: 20, bottom: 20 },
        });
        await presentResult(doc.output('blob'), `${baseName()}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to convert Excel file.');
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  // ── 3. Plain Text ────────────────────────────────────────────────────
  const convertTextTo = async (format: 'pdf' | 'html') => {
    if (!file) return;
    setIsProcessing(true);
    setActiveAction(`text-${format}`);
    resetResultState();
    setStatusMessage(`Converting Text file to ${format.toUpperCase()}...`);

    try {
      const text = await file.text();
      if (format === 'html') {
        const htmlContent = `<!DOCTYPE html><html><body><pre>${escapeHtml(text)}</pre></body></html>`;
        await presentResult(new Blob([htmlContent], { type: 'text/html;charset=utf-8' }), `${baseName()}.html`);
      } else if (format === 'pdf') {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const splitText = doc.splitTextToSize(text, 500);
        let y = 40;
        for (let i = 0; i < splitText.length; i++) {
          if (y > 780) { doc.addPage(); y = 40; }
          doc.text(splitText[i], 40, y);
          y += 16;
        }
        await presentResult(doc.output('blob'), `${baseName()}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to convert text file.');
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  // ── 4. Data formats ──────────────────────────────────────────────────
  const parseSourceAsObject = async (): Promise<any> => {
    if (!file) throw new Error('No file');
    const text = await file.text();
    if (dataSubtype === 'json') return JSON.parse(text);
    if (dataSubtype === 'xml') return new XMLParser().parse(text);
    if (dataSubtype === 'yaml') return yaml.load(text);
    throw new Error('Unsupported subtype for object parsing');
  };

  const convertDataTo = async (target: 'json' | 'xml' | 'yaml' | 'csv' | 'html' | 'md') => {
    if (!file || !dataSubtype) return;
    setIsProcessing(true);
    setActiveAction(`data-${target}`);
    resetResultState();
    setStatusMessage(`Converting ${dataSubtype.toUpperCase()} to ${target.toUpperCase()}...`);

    try {
      if (dataSubtype === 'md' && target === 'html') {
        const text = await file.text();
        const html = await marked.parse(text);
        await presentResult(new Blob([html], { type: 'text/html;charset=utf-8' }), `${baseName()}.html`);
        return;
      }
      if (dataSubtype === 'html' && target === 'md') {
        const text = await file.text();
        const markdown = new TurndownService().turndown(text);
        await presentResult(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `${baseName()}.md`);
        return;
      }

      const obj = await parseSourceAsObject();

      if (target === 'json') {
        await presentResult(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' }), `${baseName()}.json`);
      } else if (target === 'xml') {
        const xmlData = new XMLBuilder({ format: true }).build(obj);
        await presentResult(new Blob([xmlData], { type: 'application/xml;charset=utf-8' }), `${baseName()}.xml`);
      } else if (target === 'yaml') {
        await presentResult(new Blob([yaml.dump(obj)], { type: 'application/x-yaml;charset=utf-8' }), `${baseName()}.yaml`);
      } else if (target === 'csv') {
        const arr = Array.isArray(obj) ? obj : Object.values(obj).find((v) => Array.isArray(v));
        if (!Array.isArray(arr) || arr.length === 0) {
          alert('This file does not contain a flat array of records, so CSV export is not possible.');
          return;
        }
        const ws = XLSX.utils.json_to_sheet(arr as any[]);
        await presentResult(new Blob([XLSX.utils.sheet_to_csv(ws)], { type: 'text/csv;charset=utf-8' }), `${baseName()}.csv`);
      } else if (target === 'html') {
        const arr = Array.isArray(obj) ? obj : Object.values(obj).find((v) => Array.isArray(v));
        if (Array.isArray(arr) && arr.length > 0) {
          const ws = XLSX.utils.json_to_sheet(arr as any[]);
          await presentResult(new Blob([XLSX.utils.sheet_to_html(ws)], { type: 'text/html;charset=utf-8' }), `${baseName()}.html`);
        } else {
          const html = `<!DOCTYPE html><html><body><pre>${escapeHtml(JSON.stringify(obj, null, 2))}</pre></body></html>`;
          await presentResult(new Blob([html], { type: 'text/html;charset=utf-8' }), `${baseName()}.html`);
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to convert: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  // ── 5. Image formats & filters ──────────────────────────────────────
  const convertImageFormat = (targetMime: string, ext: string, filterMode?: 'grayscale' | 'invert') => {
    if (!file) return;
    setIsProcessing(true);
    setActiveAction(`img-${ext}-${filterMode || ''}`);
    resetResultState();
    setStatusMessage(`Processing Image Conversion (${ext.toUpperCase()})...`);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0);

        if (filterMode === 'grayscale' || filterMode === 'invert') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (filterMode === 'grayscale') {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
            } else {
              data[i] = 255 - data[i]; data[i + 1] = 255 - data[i + 1]; data[i + 2] = 255 - data[i + 2];
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        if (ext === 'ico') {
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) { setIsProcessing(false); setActiveAction(null); return; }
            pngBlob.arrayBuffer().then(async (pngBuffer) => {
              const icoBlob = buildIcoFromPng(pngBuffer, canvas.width, canvas.height);
              const suffix = filterMode ? `_${filterMode}` : '';
              await presentResult(icoBlob, `${baseName()}${suffix}.ico`);
              setIsProcessing(false);
              setActiveAction(null);
            });
          }, 'image/png');
          return;
        }

        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const suffix = filterMode ? `_${filterMode}` : '';
              await presentResult(blob, `${baseName()}${suffix}.${ext}`);
            } else {
              alert(`Your browser does not support exporting to ${ext.toUpperCase()}.`);
            }
            setIsProcessing(false);
            setActiveAction(null);
          },
          targetMime,
          0.95
        );
      }
    };
    img.onerror = () => {
      alert('Failed to load image.');
      setIsProcessing(false);
      setActiveAction(null);
    };
  };

  const buildIcoFromPng = (pngBuffer: ArrayBuffer, width: number, height: number): Blob => {
    const pngBytes = new Uint8Array(pngBuffer);
    const header = new Uint8Array(6 + 16);
    const view = new DataView(header.buffer);
    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, 1, true);
    header[6] = width >= 256 ? 0 : width;
    header[7] = height >= 256 ? 0 : height;
    header[8] = 0;
    header[9] = 0;
    view.setUint16(10, 1, true);
    view.setUint16(12, 32, true);
    view.setUint32(14, pngBytes.length, true);
    view.setUint32(18, 22, true);
    return new Blob([header, pngBytes], { type: 'image/x-icon' });
  };

  const convertImageToPdf = () => {
    if (!file) return;
    setIsProcessing(true);
    setActiveAction('img-to-pdf');
    resetResultState();
    setStatusMessage('Generating PDF from Image...');

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const doc = new jsPDF({
        orientation: img.width > img.height ? 'l' : 'p',
        unit: 'px',
        format: [img.width, img.height],
      });
      doc.addImage(img, 'JPEG', 0, 0, img.width, img.height);
      await presentResult(doc.output('blob'), `${baseName()}.pdf`);
      setIsProcessing(false);
      setActiveAction(null);
    };
  };

  const scanQrCode = () => {
    if (!file) return;
    setIsProcessing(true);
    setActiveAction('img-qr');
    resetResultState();
    setStatusMessage('Scanning image for QR code...');

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setIsProcessing(false); setActiveAction(null); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      setQrResult(code ? code.data : '(No QR code detected in this image)');
      setIsProcessing(false);
      setActiveAction(null);
    };
  };

  const extractColorPalette = () => {
    if (!file) return;
    setIsProcessing(true);
    setActiveAction('img-palette');
    resetResultState();
    setStatusMessage('Extracting color palette...');

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 100 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { setIsProcessing(false); setActiveAction(null); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const bucket: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 24) * 24;
        const g = Math.round(data[i + 1] / 24) * 24;
        const b = Math.round(data[i + 2] / 24) * 24;
        const key = `${r},${g},${b}`;
        bucket[key] = (bucket[key] || 0) + 1;
      }
      const sorted = Object.entries(bucket).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const hexColors = sorted.map(([rgb]) => {
        const [r, g, b] = rgb.split(',').map(Number);
        return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
      });
      setPaletteResult(hexColors);
      setIsProcessing(false);
      setActiveAction(null);
    };
  };

  // ── 6. PDF ───────────────────────────────────────────────────────────
  const convertPdfTo = async (mode: 'all-images' | 'text') => {
    if (!file || !pdfjs) { alert('PDF Processor is initializing, please try in a moment.'); return; }
    setIsProcessing(true);
    setActiveAction(`pdf-${mode}`);
    resetResultState();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      if (mode === 'all-images') {
        const zip = new JSZip();
        for (let i = 1; i <= numPages; i++) {
          setStatusMessage(`Rendering page ${i} of ${numPages}...`);
          setProgressPercent(Math.round(((i - 1) / numPages) * 100));
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
            zip.file(`page_${i}.jpg`, base64Data, { base64: true });
          }
          setProgressPercent(Math.round((i / numPages) * 100));
        }
        setStatusMessage('Packing pages into a ZIP file...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        await presentResult(zipBlob, `${baseName()}_all_pages.zip`, { archiveEntries: numPages });
        setIsProcessing(false);
        setActiveAction(null);
      } else if (mode === 'text') {
        let fullText = '';
        for (let i = 1; i <= numPages; i++) {
          setStatusMessage(`Reading text from page ${i} of ${numPages}...`);
          setProgressPercent(Math.round(((i - 1) / numPages) * 100));
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;
          setProgressPercent(Math.round((i / numPages) * 100));
        }
        await presentResult(new Blob([fullText], { type: 'text/plain;charset=utf-8' }), `${baseName()}_extracted.txt`);
        setIsProcessing(false);
        setActiveAction(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process PDF file.');
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  const dataConversionTargets = (): { label: string; ext: string; target: 'json' | 'xml' | 'yaml' | 'csv' | 'html' | 'md' }[] => {
    switch (dataSubtype) {
      case 'json': return [
        { label: 'XML', ext: '.xml', target: 'xml' },
        { label: 'YAML', ext: '.yaml', target: 'yaml' },
        { label: 'CSV', ext: '.csv', target: 'csv' },
        { label: 'HTML table', ext: '.html', target: 'html' },
      ];
      case 'xml': return [
        { label: 'JSON', ext: '.json', target: 'json' },
        { label: 'YAML', ext: '.yaml', target: 'yaml' },
      ];
      case 'yaml': return [
        { label: 'JSON', ext: '.json', target: 'json' },
        { label: 'XML', ext: '.xml', target: 'xml' },
      ];
      case 'md': return [{ label: 'HTML', ext: '.html', target: 'html' }];
      case 'html': return [{ label: 'Markdown', ext: '.md', target: 'md' }];
      default: return [];
    }
  };

  // ── UI atoms ─────────────────────────────────────────────────────────

  const CornerTicks = () => (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <span
          key={pos}
          style={{
            position: 'absolute',
            width: 14,
            height: 14,
            borderColor: T.ink,
            borderStyle: 'solid',
            opacity: 0.55,
            top: pos.startsWith('t') ? 10 : undefined,
            bottom: pos.startsWith('b') ? 10 : undefined,
            left: pos.endsWith('l') ? 10 : undefined,
            right: pos.endsWith('r') ? 10 : undefined,
            borderWidth: `${pos.startsWith('t') ? 2 : 0}px ${pos.endsWith('r') ? 2 : 0}px ${pos.startsWith('b') ? 2 : 0}px ${pos.endsWith('l') ? 2 : 0}px`,
          }}
        />
      ))}
    </>
  );

  const specCardStyle = (active: boolean): React.CSSProperties => ({
    position: 'relative',
    background: active ? T.ink : T.white,
    color: active ? T.white : T.ink,
    border: `1px solid ${active ? T.ink : T.paperLine}`,
    borderRadius: 4,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
    transition: 'transform 0.12s ease, border-color 0.12s ease',
    fontFamily: "'IBM Plex Sans', sans-serif",
  });

  const statusLabel: Record<string, string> = {
    word: 'MANUSCRIPT',
    excel: 'SPREADSHEET',
    ppt: 'DECK',
    text: 'PLAIN TEXT',
    data: dataSubtype ? dataSubtype.toUpperCase() : 'DATA',
    image: 'IMAGE',
    pdf: 'DOCUMENT',
    unknown: 'UNKNOWN',
  };

  return (
    <div
      style={{
        background: T.paper,
        border: `1px solid ${T.paperLine}`,
        borderRadius: 6,
        maxWidth: 980,
        margin: '0 auto',
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: T.ink,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes dashFlow { to { background-position: 40px 0; } }
        @keyframes stampIn { from { opacity: 0; transform: scale(1.5) rotate(-10deg); } to { opacity: 1; transform: scale(1) rotate(-8deg); } }
        @keyframes gaugeStripe { to { background-position: 28px 0; } }
        .uc-spec-card:hover { transform: translateY(-2px); border-color: ${T.brass} !important; }
        .uc-spec-card:disabled { cursor: not-allowed; opacity: 0.5; transform: none; }
        .uc-drop:hover { border-color: ${T.brass} !important; background: ${T.paperDeep} !important; }
      `}</style>

      {/* ── Header: blueprint strip ───────────────────────────────── */}
      <div
        style={{
          background: `repeating-linear-gradient(0deg, ${T.paperDeep} 0, ${T.paperDeep} 1px, transparent 1px, transparent 24px),
                       repeating-linear-gradient(90deg, ${T.paperDeep} 0, ${T.paperDeep} 1px, transparent 1px, transparent 24px),
                       ${T.paper}`,
          padding: '22px 32px',
          borderBottom: `1px solid ${T.paperLine}`,
        }}
      >
        <BackButton onClick={onBack} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 2, color: T.brass, fontWeight: 600 }}>
            FORM 01 / CONVERSION BUREAU
          </span>
        </div>
        <h2 style={{ margin: '6px 0 4px 0', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: -0.5 }}>
          Universal File Converter
        </h2>
        <p style={{ margin: 0, color: T.inkSoft, fontSize: 14 }}>
          Drop a file, pick a destination format, inspect the result — then save it.
        </p>
      </div>

      <div style={{ padding: 32 }}>
        {!file ? (
          <div
            className="uc-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            style={{
              position: 'relative',
              border: `1.5px dashed ${T.paperLine}`,
              borderRadius: 6,
              padding: '56px 20px',
              textAlign: 'center',
              background: T.white,
              transition: 'all 0.15s ease',
            }}
          >
            <CornerTicks />
            <input
              type="file"
              accept="image/*,application/pdf,.xlsx,.xls,.csv,.docx,.doc,.pptx,.ppt,text/plain,.md,.json,.xml,.yaml,.yml,.html,.htm"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              id="smart-converter-input"
              style={{ display: 'none' }}
            />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.inkSoft, marginBottom: 18, letterSpacing: 1 }}>
              ⌐ INTAKE
            </div>
            <label
              htmlFor="smart-converter-input"
              style={{
                backgroundColor: T.brass,
                color: T.white,
                padding: '13px 26px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-block',
                fontSize: 15,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Choose File or Drag &amp; Drop
            </label>
            <p style={{ margin: '18px 0 0 0', color: T.inkSoft, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              DOCX · XLSX · PPTX · PDF · JPG · PNG · WEBP · BMP · JSON · XML · YAML · MD · HTML · TXT · CSV
            </p>
          </div>
        ) : (
          <div>
            {/* ── Source ticket ─────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                background: T.white,
                padding: '16px 20px',
                borderRadius: 4,
                border: `1px solid ${T.paperLine}`,
                marginBottom: 26,
              }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, border: `1px solid ${T.paperLine}` }} />
              ) : (
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, color: T.trace, border: `1px solid ${T.trace}`, borderRadius: 4, padding: '10px 8px', minWidth: 56, textAlign: 'center' }}>
                  {statusLabel[fileType]}
                </div>
              )}
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 4px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </h4>
                <p style={{ margin: 0, color: T.inkSoft, fontSize: 12 }}>
                  {statusLabel[fileType]} · {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => { setFile(null); resetResultState(); }}
                style={{ background: 'transparent', border: `1px solid ${T.paperLine}`, padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, color: T.inkSoft, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 }}
              >
                Replace
              </button>
            </div>

            {/* signature connector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.inkSoft, letterSpacing: 1 }}>SOURCE</span>
              <div
                style={{
                  flexGrow: 1,
                  height: 1,
                  backgroundImage: `linear-gradient(90deg, ${T.brass} 50%, transparent 50%)`,
                  backgroundSize: '8px 1px',
                  animation: isProcessing ? 'dashFlow 0.6s linear infinite' : 'none',
                }}
              />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: T.brass }}>▶</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.inkSoft, letterSpacing: 1 }}>SELECT OUTPUT</span>
            </div>

            {/* ── Target format grid ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 30 }}>

              {fileType === 'word' && (
                <>
                  <FormatCard ext="PDF" label="Portable Document" id="word-pdf" active={activeAction === 'word-pdf'} disabled={isProcessing} onClick={() => convertWordTo('pdf')} />
                  <FormatCard ext="TXT" label="Plain Text" id="word-txt" active={activeAction === 'word-txt'} disabled={isProcessing} onClick={() => convertWordTo('txt')} />
                  <FormatCard ext="HTML" label="Web Page" id="word-html" active={activeAction === 'word-html'} disabled={isProcessing} onClick={() => convertWordTo('html')} />
                </>
              )}

              {fileType === 'excel' && (
                <>
                  <FormatCard ext="PDF" label="Table Printout" id="excel-pdf" active={activeAction === 'excel-pdf'} disabled={isProcessing} onClick={() => convertExcelTo('pdf')} />
                  <FormatCard ext="CSV" label="Comma-separated" id="excel-csv" active={activeAction === 'excel-csv'} disabled={isProcessing} onClick={() => convertExcelTo('csv')} />
                  <FormatCard ext="HTML" label="Web Table" id="excel-html" active={activeAction === 'excel-html'} disabled={isProcessing} onClick={() => convertExcelTo('html')} />
                  <FormatCard ext="JSON" label="Structured Data" id="excel-json" active={activeAction === 'excel-json'} disabled={isProcessing} onClick={() => convertExcelTo('json')} />
                  <FormatCard ext="XML" label="Structured Data" id="excel-xml" active={activeAction === 'excel-xml'} disabled={isProcessing} onClick={() => convertExcelTo('xml')} />
                </>
              )}

              {fileType === 'ppt' && (
                <div style={{ gridColumn: '1 / -1', padding: 16, background: T.white, borderRadius: 4, border: `1px solid ${T.paperLine}`, color: T.inkSoft, fontSize: 13 }}>
                  Slide text and layouts can be parsed. Full PPTX conversion isn't available client-side yet.
                </div>
              )}

              {fileType === 'text' && (
                <>
                  <FormatCard ext="PDF" label="Document" id="text-pdf" active={activeAction === 'text-pdf'} disabled={isProcessing} onClick={() => convertTextTo('pdf')} />
                  <FormatCard ext="HTML" label="Web Page" id="text-html" active={activeAction === 'text-html'} disabled={isProcessing} onClick={() => convertTextTo('html')} />
                </>
              )}

              {fileType === 'data' && dataSubtype && dataConversionTargets().map((opt) => (
                <FormatCard
                  key={opt.target}
                  ext={opt.label}
                  label="Convert"
                  id={`data-${opt.target}`}
                  active={activeAction === `data-${opt.target}`}
                  disabled={isProcessing}
                  onClick={() => convertDataTo(opt.target)}
                />
              ))}

              {fileType === 'image' && (
                <>
                  <FormatCard ext="PDF" label="Document" id="img-to-pdf" active={activeAction === 'img-to-pdf'} disabled={isProcessing} onClick={convertImageToPdf} />
                  <FormatCard ext="JPG" label="Image" id="img-jpg-" active={activeAction === 'img-jpg-'} disabled={isProcessing} onClick={() => convertImageFormat('image/jpeg', 'jpg')} />
                  <FormatCard ext="PNG" label="Image" id="img-png-" active={activeAction === 'img-png-'} disabled={isProcessing} onClick={() => convertImageFormat('image/png', 'png')} />
                  <FormatCard ext="WEBP" label="Image" id="img-webp-" active={activeAction === 'img-webp-'} disabled={isProcessing} onClick={() => convertImageFormat('image/webp', 'webp')} />
                  <FormatCard ext="BMP" label="Image" id="img-bmp-" active={activeAction === 'img-bmp-'} disabled={isProcessing} onClick={() => convertImageFormat('image/bmp', 'bmp')} />
                  <FormatCard ext="AVIF" label="Beta" id="img-avif-" active={activeAction === 'img-avif-'} disabled={isProcessing} onClick={() => convertImageFormat('image/avif', 'avif')} />
                  <FormatCard ext="ICO" label="Icon" id="img-ico-" active={activeAction === 'img-ico-'} disabled={isProcessing} onClick={() => convertImageFormat('image/png', 'ico')} />
                  <FormatCard ext="B/W" label="Filter" id="img-jpg-grayscale" active={activeAction === 'img-jpg-grayscale'} disabled={isProcessing} onClick={() => convertImageFormat('image/jpeg', 'jpg', 'grayscale')} />
                  <FormatCard ext="INV" label="Filter" id="img-jpg-invert" active={activeAction === 'img-jpg-invert'} disabled={isProcessing} onClick={() => convertImageFormat('image/jpeg', 'jpg', 'invert')} />
                  <FormatCard ext="QR" label="Scan" id="img-qr" active={activeAction === 'img-qr'} disabled={isProcessing} onClick={scanQrCode} />
                  <FormatCard ext="HEX" label="Palette" id="img-palette" active={activeAction === 'img-palette'} disabled={isProcessing} onClick={extractColorPalette} />
                </>
              )}

              {fileType === 'pdf' && (
                <>
                  <FormatCard ext="ZIP" label="Pages as Images" id="pdf-all-images" active={activeAction === 'pdf-all-images'} disabled={isProcessing} onClick={() => convertPdfTo('all-images')} />
                  <FormatCard ext="TXT" label="Extracted Text" id="pdf-text" active={activeAction === 'pdf-text'} disabled={isProcessing} onClick={() => convertPdfTo('text')} />
                </>
              )}

              {fileType === 'unknown' && (
                <p style={{ color: T.alert, fontWeight: 600, gridColumn: '1 / -1' }}>Unsupported file format. Please upload a standard document or image.</p>
              )}
            </div>

            {/* ── Progress gauge ─────────────────────────────────── */}
            {isProcessing && (
              <div style={{ background: T.white, border: `1px solid ${T.paperLine}`, borderRadius: 4, padding: '16px 18px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.inkSoft }}>
                  <span>{statusMessage}</span>
                  {progressPercent !== null && <span>{progressPercent}%</span>}
                </div>
                <div style={{ position: 'relative', height: 8, borderRadius: 4, background: T.paperDeep, overflow: 'hidden' }}>
                  {progressPercent !== null ? (
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: T.trace, transition: 'width 0.2s ease' }} />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `repeating-linear-gradient(45deg, ${T.trace} 0, ${T.trace} 6px, transparent 6px, transparent 14px)`,
                        backgroundSize: '28px 8px',
                        animation: 'gaugeStripe 0.7s linear infinite',
                        opacity: 0.85,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── QR / palette inline results ─────────────────────── */}
            {qrResult && (
              <ResultPanel label="QR CODE" color={T.trace}>
                <p style={{ margin: 0, wordBreak: 'break-all', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{qrResult}</p>
              </ResultPanel>
            )}

            {paletteResult && (
              <ResultPanel label="DOMINANT COLORS" color={T.trace}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {paletteResult.map((hex) => (
                    <div key={hex} style={{ textAlign: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: hex, border: `1px solid ${T.paperLine}` }} />
                      <span style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}>{hex}</span>
                    </div>
                  ))}
                </div>
              </ResultPanel>
            )}

            {/* ── Output preview + download ───────────────────────── */}
            {downloadResult && (
              <div style={{ position: 'relative', background: T.white, border: `1px solid ${T.paperLine}`, borderRadius: 6, padding: 24, overflow: 'hidden' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 18,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: T.trace,
                    border: `2px solid ${T.trace}`,
                    borderRadius: 4,
                    padding: '4px 10px',
                    transform: 'rotate(-8deg)',
                    animation: 'stampIn 0.35s ease-out',
                  }}
                >
                  READY
                </div>

                <h4 style={{ margin: '0 0 4px 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700 }}>
                  Output preview
                </h4>
                <p style={{ margin: '0 0 16px 0', color: T.inkSoft, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {downloadResult.filename}
                </p>

                <div style={{ marginBottom: 18 }}>
                  {resultPreview?.kind === 'image' && (
                    <img src={resultPreview.url} alt="Converted result" style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 4, border: `1px solid ${T.paperLine}`, display: 'block', margin: '0 auto' }} />
                  )}

                  {resultPreview?.kind === 'pdf' && (
                    <iframe src={resultPreview.url} title="PDF preview" style={{ width: '100%', height: 460, border: `1px solid ${T.paperLine}`, borderRadius: 4 }} />
                  )}

                  {resultPreview?.kind === 'archive' && (
                    <div style={{ padding: 18, border: `1px dashed ${T.paperLine}`, borderRadius: 4, color: T.inkSoft, fontSize: 13, textAlign: 'center' }}>
                      📦 ZIP archive{typeof resultPreview.archiveEntries === 'number' ? ` — ${resultPreview.archiveEntries} file(s) packed` : ''}. Preview isn't available for archives — download to inspect contents.
                    </div>
                  )}

                  {resultPreview?.kind === 'text' && (
                    <div>
                      {resultPreview.isHtml && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          <button
                            onClick={() => setHtmlPreviewMode('code')}
                            style={toggleTabStyle(htmlPreviewMode === 'code')}
                          >
                            Code
                          </button>
                          <button
                            onClick={() => setHtmlPreviewMode('rendered')}
                            style={toggleTabStyle(htmlPreviewMode === 'rendered')}
                          >
                            Rendered
                          </button>
                        </div>
                      )}
                      {resultPreview.isHtml && htmlPreviewMode === 'rendered' ? (
                        <iframe
                          srcDoc={resultPreview.content}
                          title="HTML preview"
                          sandbox=""
                          style={{ width: '100%', height: 380, border: `1px solid ${T.paperLine}`, borderRadius: 4, background: T.white }}
                        />
                      ) : (
                        <pre
                          style={{
                            margin: 0,
                            maxHeight: 380,
                            overflow: 'auto',
                            background: T.paperDeep,
                            borderRadius: 4,
                            padding: 16,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 12.5,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {resultPreview.content}
                        </pre>
                      )}
                      {resultPreview.truncated && (
                        <p style={{ margin: '8px 0 0 0', fontSize: 11, color: T.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                          Preview truncated at 20,000 characters — full content is in the downloaded file.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <a
                  href={downloadResult.url}
                  download={downloadResult.filename}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: T.brass,
                    color: T.white,
                    padding: '12px 22px',
                    borderRadius: 4,
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 14,
                  }}
                >
                  ↓ Save {downloadResult.filename}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Local components (closures over tokens/state) ─────────────────
  function FormatCard({ ext, label, id, active, disabled, onClick }: { ext: string; label: string; id: string; active: boolean; disabled: boolean; onClick: () => void }) {
    return (
      <button
        className="uc-spec-card"
        onClick={onClick}
        disabled={disabled}
        style={specCardStyle(active)}
      >
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
          {active ? '···' : `.${ext.toLowerCase()}`}
        </div>
        <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {active ? 'Working' : label}
        </div>
      </button>
    );
  }

  function ResultPanel({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
    return (
      <div style={{ background: T.white, border: `1px solid ${T.paperLine}`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 1, color, marginBottom: 10, fontWeight: 600 }}>{label}</div>
        {children}
      </div>
    );
  }

  function toggleTabStyle(active: boolean): React.CSSProperties {
    return {
      background: active ? T.ink : 'transparent',
      color: active ? T.white : T.inkSoft,
      border: `1px solid ${active ? T.ink : T.paperLine}`,
      borderRadius: 4,
      padding: '5px 12px',
      fontSize: 12,
      fontFamily: "'IBM Plex Mono', monospace",
      cursor: 'pointer',
    };
  }
}
