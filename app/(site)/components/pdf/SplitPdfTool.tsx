'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export default function SplitPdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [pagesPreview, setPagesPreview] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
  const [isProcessingSplit, setIsProcessingSplit] = useState<boolean>(false);

  const handleSplitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !pdfjs) return;
    const file = e.target.files[0];
    setSplitFile(file);
    setIsLoadingPages(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const previews: string[] = [];
      const initialSelected: number[] = [];

      for (let i = 1; i <= totalPages; i++) {
        initialSelected.push(i - 1);
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

      setPagesPreview(previews);
      setSelectedPages(initialSelected);
      setIsLoadingPages(false);
    } catch (err) {
      console.error(err);
      setIsLoadingPages(false);
    }
  };

  const togglePageSelection = (index: number) => {
    if (selectedPages.includes(index)) {
      setSelectedPages(selectedPages.filter((i) => i !== index));
    } else {
      setSelectedPages([...selectedPages, index]);
    }
  };

  const removePage = (index: number) => {
    setPagesPreview(pagesPreview.filter((_, i) => i !== index));
    setSelectedPages(selectedPages.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  };

  const handleExtractPDF = async () => {
    if (!splitFile || selectedPages.length === 0) return;
    setIsProcessingSplit(true);
    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(pdf, selectedPages.sort((a, b) => a - b));
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted_${splitFile.name}`;
      link.click();
      setIsProcessingSplit(false);
    } catch (err) {
      console.error(err);
      setIsProcessingSplit(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!splitFile || selectedPages.length === 0) return;
    setIsProcessingSplit(true);
    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const zip = new JSZip();

      for (let i = 0; i < selectedPages.length; i++) {
        const pageIdx = selectedPages[i];
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(pdf, [pageIdx]);
        singlePagePdf.addPage(copiedPage);

        const pdfBytes = await singlePagePdf.save();
        zip.file(`page_${pageIdx + 1}.pdf`, pdfBytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `pages_archive.zip`;
      link.click();
      setIsProcessingSplit(false);
    } catch (err) {
      console.error(err);
      setIsProcessingSplit(false);
    }
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
              NYX PDF Splitter
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
              PDF TOOL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Preview pages, select/deselect or remove unwanted pages before extracting.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!splitFile ? (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleSplitFileUpload}
            id="split-pdf-input"
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload PDF Document</h3>
          <p className="text-xs text-slate-500 mb-6">Select a file to extract or split pages instantly.</p>

          <label
            htmlFor="split-pdf-input"
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
          {isLoadingPages ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-700">Generating page previews...</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-600">
                  Total Pages: <b className="text-slate-800">{pagesPreview.length}</b> | Selected: <b className="text-indigo-600">{selectedPages.length}</b>
                </span>
                <button
                  onClick={() => setSplitFile(null)}
                  className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[480px] overflow-y-auto p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                {pagesPreview.map((src, index) => {
                  const isSelected = selectedPages.includes(index);
                  return (
                    <div
                      key={index}
                      className={`relative group bg-white rounded-xl p-2.5 border transition-all shadow-sm ${
                        isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePageSelection(index)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-slate-500">Page {index + 1}</span>
                        <button
                          onClick={() => removePage(index)}
                          className="text-slate-400 hover:text-rose-500 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Page"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="overflow-hidden rounded-lg bg-slate-100 cursor-pointer border border-slate-100" onClick={() => togglePageSelection(index)}>
                        <img
                          src={src}
                          alt={`Page ${index + 1}`}
                          className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={handleExtractPDF}
                  disabled={isProcessingSplit || selectedPages.length === 0}
                  className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingSplit ? 'Processing...' : '📄 Download Selected Pages (PDF)'}
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={isProcessingSplit || selectedPages.length === 0}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingSplit ? 'Creating ZIP...' : '📦 Download Selected Pages (ZIP)'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}