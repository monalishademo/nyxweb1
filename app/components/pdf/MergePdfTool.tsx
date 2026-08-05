'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import BackButton from '../BackButton';

interface MergeFileItem {
  file: File;
  previewUrl: string;
  pageCount: number;
}

export default function MergePdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [mergeFiles, setMergeFiles] = useState<MergeFileItem[]>([]);
  const [isLoadingMergePreviews, setIsLoadingMergePreviews] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);

  const handleMergeFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !pdfjs) return;
    const filesArray = Array.from(e.target.files);
    setIsLoadingMergePreviews(true);

    const newMergeItems: MergeFileItem[] = [];

    for (const file of filesArray) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          newMergeItems.push({
            file,
            previewUrl: canvas.toDataURL('image/jpeg'),
            pageCount,
          });
        }
      } catch (err) {
        console.error('Error loading preview:', err);
      }
    }

    setMergeFiles((prev) => [...prev, ...newMergeItems]);
    setIsLoadingMergePreviews(false);
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(mergeFiles.filter((_, i) => i !== index));
  };

  const handleMergePDFs = async () => {
    if (mergeFiles.length < 2) return;

    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged_document.pdf';
      link.click();
      setIsMerging(false);
    } catch (error) {
      console.error(error);
      setIsMerging(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>📄 Merge PDF Files</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Combine multiple PDF files into one document. Preview files and remove unwanted ones.</p>

      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleMergeFilesUpload}
          id="pdf-merge-input"
          style={{ display: 'none' }}
        />
        <label
          htmlFor="pdf-merge-input"
          style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
        >
          📁 Add PDF Files
        </label>
      </div>

      {isLoadingMergePreviews && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#0070f3', fontWeight: 'bold' }}>Generating PDF Previews...</p>
        </div>
      )}

      {mergeFiles.length > 0 && (
        <div style={{ marginTop: '25px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Selected PDF Files ({mergeFiles.length}):</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', maxHeight: '450px', overflowY: 'auto', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
            {mergeFiles.map((item, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: 'white',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <button
                  onClick={() => removeMergeFile(index)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px', zIndex: 2 }}
                  title="Remove File"
                >
                  ✕
                </button>

                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f1f5f9' }}
                />

                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '8px 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.file.name}>
                  {item.file.name}
                </p>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{item.pageCount} Pages</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleMergePDFs}
        disabled={isMerging || mergeFiles.length < 2}
        style={{
          marginTop: '25px',
          width: '100%',
          padding: '14px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: mergeFiles.length >= 2 ? '#8b5cf6' : '#94a3b8',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: mergeFiles.length >= 2 ? 'pointer' : 'not-allowed',
        }}
      >
        {isMerging ? 'Merging PDFs...' : '⚡ Merge & Download PDF'}
      </button>
    </div>
  );
}
