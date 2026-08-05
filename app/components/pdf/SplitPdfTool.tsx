'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import BackButton from '../BackButton';

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
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>✂️ Split & Select PDF Pages</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Preview pages, select/deselect or delete unwanted pages before downloading.</p>

      {!splitFile ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleSplitFileUpload}
            id="split-pdf-input"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="split-pdf-input"
            style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
          >
            📁 Select PDF File
          </label>
        </div>
      ) : (
        <div>
          {isLoadingPages ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '18px', color: '#0070f3', fontWeight: 'bold' }}>Generating page previews...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px', margin: '20px 0', maxHeight: '500px', overflowY: 'auto', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                {pagesPreview.map((src, index) => {
                  const isSelected = selectedPages.includes(index);
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        border: isSelected ? '3px solid #0070f3' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px',
                        backgroundColor: 'white',
                        textAlign: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePageSelection(index)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Page {index + 1}</span>
                        <button
                          onClick={() => removePage(index)}
                          style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '11px', lineHeight: '1' }}
                          title="Delete Page"
                        >
                          ✕
                        </button>
                      </div>

                      <img
                        src={src}
                        alt={`Page ${index + 1}`}
                        onClick={() => togglePageSelection(index)}
                        style={{ width: '100%', borderRadius: '4px', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button
                  onClick={handleExtractPDF}
                  disabled={isProcessingSplit || selectedPages.length === 0}
                  style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
                >
                  {isProcessingSplit ? 'Processing...' : '📄 Download Selected Pages as PDF'}
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={isProcessingSplit || selectedPages.length === 0}
                  style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#06b6d4', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
                >
                  {isProcessingSplit ? 'Creating ZIP...' : '📦 Download Selected Pages as ZIP'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
