'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import BackButton from '../BackButton';
import { formatFileSize } from '../../lib/utils';

export default function CompressPdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressPreviewUrl, setCompressPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedResult, setCompressedResult] = useState<{ size: string; downloadUrl: string; filename: string } | null>(null);

  const handleCompressFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setCompressFile(file);
    setCompressedResult(null);

    if (pdfjs) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          setCompressPreviewUrl(canvas.toDataURL('image/jpeg'));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCompressPDF = async () => {
    if (!compressFile) return;
    setIsCompressing(true);
    setCompressedResult(null);

    try {
      const arrayBuffer = await compressFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setProducer('');

      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setCompressedResult({
        size: formatFileSize(blob.size),
        downloadUrl: url,
        filename: `compressed_${compressFile.name}`,
      });

      setIsCompressing(false);
    } catch (error) {
      console.error(error);
      setIsCompressing(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>🗜️ Compress PDF File Size</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Reduce PDF file size smoothly without popup alerts.</p>

      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleCompressFileUpload}
          id="compress-pdf-input"
          style={{ display: 'none' }}
        />
        <label
          htmlFor="compress-pdf-input"
          style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
        >
          📁 Choose PDF File
        </label>

        {compressFile && (
          <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', maxWidth: '450px', margin: '20px auto 0 auto' }}>
            {compressPreviewUrl && (
              <img src={compressPreviewUrl} alt="Preview" style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Selected File Preview</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0' }}>{compressFile.name}</div>
              <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'bold' }}>
                Original Size: {formatFileSize(compressFile.size)}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleCompressPDF}
        disabled={isCompressing || !compressFile}
        style={{
          marginTop: '25px',
          width: '100%',
          padding: '14px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: compressFile ? '#8b5cf6' : '#94a3b8',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: compressFile ? 'pointer' : 'not-allowed',
        }}
      >
        {isCompressing ? 'Compressing PDF...' : '🗜️ Compress & Download PDF'}
      </button>

      {compressedResult && (
        <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '2px solid #22c55e', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#15803d' }}>🎉 Compression Complete!</h3>
          <p style={{ margin: '0 0 15px 0', color: '#166534', fontSize: '15px' }}>
            New Compressed Size: <strong>{compressedResult.size}</strong>
          </p>
          <a
            href={compressedResult.downloadUrl}
            download={compressedResult.filename}
            style={{ display: 'inline-block', backgroundColor: '#22c55e', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}
          >
            ⬇️ Download Compressed PDF
          </a>
        </div>
      )}
    </div>
  );
}
