'use client';

import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import BackButton from '../BackButton';
import { colorMap } from '../../lib/colorMap';

export default function AddPageNumbersTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [pageNumFile, setPageNumFile] = useState<File | null>(null);
  const [pageNumPreviews, setPageNumPreviews] = useState<string[]>([]);
  const [isLoadingNumPreviews, setIsLoadingNumPreviews] = useState<boolean>(false);
  const [isAddingPageNumbers, setIsAddingPageNumbers] = useState<boolean>(false);

  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [formatMode, setFormatMode] = useState<'standard' | 'custom'>('standard');
  const [format, setFormat] = useState<'number' | 'page_n' | 'n_of_total' | 'page_n_of_total'>('page_n_of_total');
  const [customText, setCustomText] = useState<string>('');
  const [customNumberStyle, setCustomNumberStyle] = useState<'text_number' | 'text_page_n_of_total' | 'text_only'>('text_number');
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontColor, setFontColor] = useState<string>('black');
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);

  const handlePageNumFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !pdfjs) return;
    const file = e.target.files[0];
    setPageNumFile(file);
    setIsLoadingNumPreviews(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const previews: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          previews.push(canvas.toDataURL('image/jpeg'));
        }
      }

      setPageNumPreviews(previews);
      setIsLoadingNumPreviews(false);
    } catch (err) {
      console.error(err);
      setIsLoadingNumPreviews(false);
    }
  };

  const getSampleText = (pageNum: number, totalPages: number) => {
    if (formatMode === 'custom') {
      const baseText = customText.trim();
      if (!baseText) return `${pageNum}`;

      if (customNumberStyle === 'text_number') return `${baseText} ${pageNum}`;
      if (customNumberStyle === 'text_page_n_of_total') return `${baseText} Page ${pageNum} of ${totalPages}`;
      if (customNumberStyle === 'text_only') return baseText;
    }

    if (format === 'page_n') return `Page ${pageNum}`;
    if (format === 'n_of_total') return `${pageNum} of ${totalPages}`;
    if (format === 'page_n_of_total') return `Page ${pageNum} of ${totalPages}`;
    return `${pageNum}`;
  };

  const handleAddPageNumbers = async () => {
    if (!pageNumFile) return;
    setIsAddingPageNumbers(true);

    try {
      const arrayBuffer = await pageNumFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const totalPages = pdfDoc.getPageCount();

      const chosenColor = colorMap[fontColor] || colorMap.black;
      const rgbColor = rgb(chosenColor.r, chosenColor.g, chosenColor.b);

      for (let i = 0; i < totalPages; i++) {
        if (skipFirstPage && i === 0) continue;

        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        const text = getSampleText(i + 1, totalPages);

        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x = width / 2 - textWidth / 2;
        let y = 30;

        if (position.includes('left')) x = 30;
        if (position.includes('right')) x = width - textWidth - 30;
        if (position.includes('top')) y = height - 30;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgbColor,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `numbered_${pageNumFile.name}`;
      link.click();

      setIsAddingPageNumbers(false);
    } catch (err) {
      console.error(err);
      setIsAddingPageNumbers(false);
    }
  };

  const getPreviewPositionStyle = () => {
    const style: React.CSSProperties = { position: 'absolute', padding: '6px' };
    if (position.includes('top')) style.top = '10px';
    else style.bottom = '10px';

    if (position.includes('left')) style.left = '10px';
    else if (position.includes('right')) style.right = '10px';
    else { style.left = '50%'; style.transform = 'translateX(-50%)'; }

    return style;
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>🔢 Add Page Numbers to PDF</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Customize numbering with custom text and expanded color options.</p>

      {!pageNumFile ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePageNumFileUpload}
            id="page-num-pdf-input"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="page-num-pdf-input"
            style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
          >
            📁 Choose PDF File
          </label>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>⚙️ Numbering Options:</h4>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Numbering Type:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setFormatMode('standard')}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: formatMode === 'standard' ? '2px solid #0070f3' : '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    Standard Preset
                  </button>
                  <button
                    onClick={() => setFormatMode('custom')}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: formatMode === 'custom' ? '2px solid #0070f3' : '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    Custom Text
                  </button>
                </div>
              </div>

              {formatMode === 'standard' ? (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Format Preset:</label>
                  <select
                    value={format}
                    onChange={(e: any) => setFormat(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="page_n_of_total">Page 1 of N</option>
                    <option value="n_of_total">1 of N</option>
                    <option value="page_n">Page 1</option>
                    <option value="number">1 (Only Number)</option>
                  </select>
                </div>
              ) : (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Enter Custom Text:</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Type your text here..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '10px' }}
                  />

                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Number Attachment Format:</label>
                  <select
                    value={customNumberStyle}
                    onChange={(e: any) => setCustomNumberStyle(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="text_number">Text + Page Number (e.g. Text 1)</option>
                    <option value="text_page_n_of_total">Text + Page 1 of N</option>
                    <option value="text_only">Text Only (No Numbers)</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Position / Alignment:</label>
                <select
                  value={position}
                  onChange={(e: any) => setPosition(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="bottom-center">Bottom Center (Default)</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Font Size:</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value={10}>10px</option>
                    <option value={12}>12px</option>
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                    <option value={18}>18px</option>
                    <option value={20}>20px</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Font Color:</label>
                  <select
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    <option value="black">⚫ Black</option>
                    <option value="blue">🔵 Bright Blue</option>
                    <option value="darkblue">🌌 Dark Navy</option>
                    <option value="red">🔴 Red</option>
                    <option value="crimson">🍷 Crimson Red</option>
                    <option value="green">🟢 Bright Green</option>
                    <option value="emerald">🌲 Emerald Green</option>
                    <option value="orange">🟠 Orange</option>
                    <option value="purple">🟣 Purple</option>
                    <option value="gray">🔘 Gray</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="skipFirst"
                  checked={skipFirstPage}
                  onChange={(e) => setSkipFirstPage(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginRight: '8px' }}
                />
                <label htmlFor="skipFirst" style={{ fontWeight: 'bold', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  Skip 1st Page (Cover Page)
                </label>
              </div>

            </div>

            <div style={{ backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#475569' }}>🔍 Live Interactive Page Model</h5>

              <div
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '240px',
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '12px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ borderBottom: '2px solid #e2e8f0', width: '60%', height: '8px', marginBottom: '10px' }}></div>
                <div style={{ backgroundColor: '#f1f5f9', width: '100%', height: '6px', marginBottom: '6px' }}></div>
                <div style={{ backgroundColor: '#f1f5f9', width: '80%', height: '6px', marginBottom: '6px' }}></div>
                <div style={{ backgroundColor: '#f1f5f9', width: '90%', height: '6px', marginBottom: '6px' }}></div>

                <span
                  style={{
                    ...getPreviewPositionStyle(),
                    fontSize: `${fontSize}px`,
                    color: (colorMap[fontColor] || colorMap.black).hex,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getSampleText(1, pageNumPreviews.length || 5)}
                </span>
              </div>
            </div>

          </div>

          {isLoadingNumPreviews ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ color: '#0070f3', fontWeight: 'bold' }}>Loading Document Page Previews...</p>
            </div>
          ) : (
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>Document Pages Preview ({pageNumPreviews.length} Pages):</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', maxHeight: '350px', overflowY: 'auto', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                {pageNumPreviews.map((src, index) => (
                  <div key={index} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', backgroundColor: 'white', textAlign: 'center' }}>
                    <img src={src} alt={`Page ${index + 1}`} style={{ width: '100%', borderRadius: '4px' }} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Page {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddPageNumbers}
            disabled={isAddingPageNumbers}
            style={{
              marginTop: '25px',
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#8b5cf6',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {isAddingPageNumbers ? 'Adding Page Numbers...' : '🔢 Apply Numbers & Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
