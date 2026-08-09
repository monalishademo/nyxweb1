'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import BackButton from '../BackButton';

interface ImageToPdfItem {
  file: File;
  previewUrl: string;
}

export default function ImageToPdfTool({ onBack }: { onBack: () => void }) {
  const [imageFiles, setImageFiles] = useState<ImageToPdfItem[]>([]);
  const [isConvertingImageToPdf, setIsConvertingImageToPdf] = useState<boolean>(false);

  const handleImageUploadForPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const newItems: ImageToPdfItem[] = filesArray.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImageFiles((prev) => [...prev, ...newItems]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleConvertImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    setIsConvertingImageToPdf(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of imageFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        let embeddedImg;

        if (item.file.type === 'image/png') {
          embeddedImg = await pdfDoc.embedPng(arrayBuffer);
        } else {
          embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
        }

        const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: embeddedImg.width,
          height: embeddedImg.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'images_converted.pdf';
      link.click();

      setIsConvertingImageToPdf(false);
    } catch (err) {
      console.error(err);
      setIsConvertingImageToPdf(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>🖼️ Convert Images to PDF</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Convert JPG, PNG images into a single PDF document.</p>

      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <input
          type="file"
          accept="image/jpeg, image/png"
          multiple
          onChange={handleImageUploadForPdf}
          id="image-to-pdf-input"
          style={{ display: 'none' }}
        />
        <label
          htmlFor="image-to-pdf-input"
          style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
        >
          📁 Choose Images (JPG/PNG)
        </label>
      </div>

      {imageFiles.length > 0 && (
        <div style={{ marginTop: '25px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Selected Images ({imageFiles.length}):</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px', maxHeight: '450px', overflowY: 'auto', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
            {imageFiles.map((item, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  backgroundColor: 'white',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <button
                  onClick={() => removeImageFile(index)}
                  style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '11px', zIndex: 2 }}
                  title="Remove Image"
                >
                  ✕
                </button>

                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                />

                <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '6px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.file.name}>
                  {item.file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleConvertImagesToPdf}
        disabled={isConvertingImageToPdf || imageFiles.length === 0}
        style={{
          marginTop: '25px',
          width: '100%',
          padding: '14px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: imageFiles.length > 0 ? '#8b5cf6' : '#94a3b8',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: imageFiles.length > 0 ? 'pointer' : 'not-allowed',
        }}
      >
        {isConvertingImageToPdf ? 'Converting Images...' : '📄 Convert & Download PDF'}
      </button>
    </div>
  );
}
