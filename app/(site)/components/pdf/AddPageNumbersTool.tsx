'use client';

import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { colorMap } from '@/lib/colorMap';

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

  const getPreviewPositionClasses = () => {
    let classes = 'absolute px-2 py-1 select-none pointer-events-none transition-all duration-150 ';
    if (position.includes('top')) classes += 'top-2 ';
    else classes += 'bottom-2 ';

    if (position.includes('left')) classes += 'left-2 ';
    else if (position.includes('right')) classes += 'right-2 ';
    else classes += 'left-1/2 -translate-x-1/2 ';

    return classes;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
      {/* Header Section */}
      <div className="flex items-center gap-3.5 mb-8">
        <button
          onClick={onBack}
          type="button"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
          title="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              NYX Page Numbering
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
              PDF TOOL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize page numbers with live interactive positioning and formatting.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!pageNumFile ? (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePageNumFileUpload}
            id="page-num-pdf-input"
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload PDF Document</h3>
          <p className="text-xs text-slate-500 mb-6">Select a file to add custom header or footer page numbers.</p>

          <label
            htmlFor="page-num-pdf-input"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Select PDF File
          </label>
        </div>
      ) : (
        <div>
          {/* Main Controls & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Left Column: Settings Panel */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Settings & Number Formatting</span>
                <button
                  onClick={() => setPageNumFile(null)}
                  className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Numbering Mode Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Numbering Mode</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormatMode('standard')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      formatMode === 'standard' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Standard Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatMode('custom')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      formatMode === 'custom' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Custom Text
                  </button>
                </div>
              </div>

              {/* Format Selectors */}
              {formatMode === 'standard' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Preset Format</label>
                  <select
                    value={format}
                    onChange={(e: any) => setFormat(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="page_n_of_total">Page 1 of N</option>
                    <option value="n_of_total">1 of N</option>
                    <option value="page_n">Page 1</option>
                    <option value="number">1 (Only Number)</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Custom Prefix / Text</label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="e.g. Confidential, Annexure, Doc"
                      className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Numbering Style</label>
                    <select
                      value={customNumberStyle}
                      onChange={(e: any) => setCustomNumberStyle(e.target.value)}
                      className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="text_number">Text + Page Number (e.g. Doc 1)</option>
                      <option value="text_page_n_of_total">Text + Page 1 of N</option>
                      <option value="text_only">Text Only (No Numbers)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Position / Alignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Alignment / Position</label>
                <select
                  value={position}
                  onChange={(e: any) => setPosition(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="bottom-center">Bottom Center (Recommended)</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              {/* Font Size & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={10}>10 px</option>
                    <option value={12}>12 px</option>
                    <option value={14}>14 px</option>
                    <option value={16}>16 px</option>
                    <option value={18}>18 px</option>
                    <option value={20}>20 px</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Font Color</label>
                  <select
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
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

              {/* First Page Skip Checkbox */}
              <div className="flex items-center gap-2.5 mt-1 pt-3 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="skipFirst"
                  checked={skipFirstPage}
                  onChange={(e) => setSkipFirstPage(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="skipFirst" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Skip 1st Page (Keep cover page clean)
                </label>
              </div>
            </div>

            {/* Right Column: Live Interactive Page Model */}
            <div className="lg:col-span-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-500 mb-4">🔍 Realtime Preview Model</span>

              <div className="relative w-44 h-60 bg-white border border-slate-300 rounded-lg shadow-md p-3.5 flex flex-col justify-between overflow-hidden">
                {/* Dummy lines */}
                <div className="space-y-2 pointer-events-none">
                  <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-4/5 h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-3/4 h-1.5 bg-slate-100 rounded"></div>
                </div>

                {/* Simulated Number Badge */}
                <div
                  className={getPreviewPositionClasses()}
                  style={{
                    fontSize: `${Math.min(fontSize, 14)}px`,
                    color: (colorMap[fontColor] || colorMap.black).hex,
                    fontWeight: 'bold',
                  }}
                >
                  {getSampleText(1, pageNumPreviews.length || 5)}
                </div>
              </div>
            </div>
          </div>

          {/* Previews of uploaded pages */}
          {isLoadingNumPreviews ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-700">Loading Document Page Previews...</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-700">
                  Document Pages ({pageNumPreviews.length} Pages)
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5 max-h-[320px] overflow-y-auto p-3.5 border border-slate-100 rounded-xl bg-slate-50/50">
                {pageNumPreviews.map((src, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-lg p-2 text-center shadow-xs">
                    <img src={src} alt={`Page ${index + 1}`} className="w-full h-auto rounded object-contain mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-500">Page {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <button
            onClick={handleAddPageNumbers}
            disabled={isAddingPageNumbers}
            className="mt-6 w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAddingPageNumbers ? 'Adding Page Numbers...' : '🔢 Apply Numbers & Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}