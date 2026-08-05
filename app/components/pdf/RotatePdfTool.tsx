'use client';

import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import BackButton from '../BackButton';

export default function RotatePdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotatePagePreviews, setRotatePagePreviews] = useState<string[]>([]);
  const [pageRotations, setPageRotations] = useState<number[]>([]);
  const [isLoadingRotatePreviews, setIsLoadingNumRotatePreviews] = useState<boolean>(false);
  const [isSavingRotatedPdf, setIsSavingRotatedPdf] = useState<boolean>(false);

  const handleRotateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !pdfjs) return;
    const file = e.target.files[0];
    setRotateFile(file);
    setIsLoadingNumRotatePreviews(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const previews: string[] = [];
      const initialRotations: number[] = [];

      for (let i = 1; i <= totalPages; i++) {
        initialRotations.push(0);
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

      setRotatePagePreviews(previews);
      setPageRotations(initialRotations);
      setIsLoadingNumRotatePreviews(false);
    } catch (err) {
      console.error(err);
      setIsLoadingNumRotatePreviews(false);
    }
  };

  const rotateSinglePage = (index: number, direction: 'cw' | 'ccw') => {
    setPageRotations((prev) => {
      const updated = [...prev];
      const currentAngle = updated[index] || 0;
      const change = direction === 'cw' ? 90 : -90;
      updated[index] = (currentAngle + change + 360) % 360;
      return updated;
    });
  };

  const rotateAllPages = (direction: 'cw' | 'ccw') => {
    setPageRotations((prev) => {
      const change = direction === 'cw' ? 90 : -90;
      return prev.map((angle) => (angle + change + 360) % 360);
    });
  };

  const handleSaveRotatedPDF = async () => {
    if (!rotateFile) return;
    setIsSavingRotatedPdf(true);

    try {
      const arrayBuffer = await rotateFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page, idx) => {
        const addedRotation = pageRotations[idx] || 0;
        if (addedRotation !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + addedRotation) % 360));
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `rotated_${rotateFile.name}`;
      link.click();

      setIsSavingRotatedPdf(false);
    } catch (err) {
      console.error(err);
      setIsSavingRotatedPdf(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>🔄 Rotate PDF Pages</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Rotate specific or all pages with live sample preview before saving.</p>

      {!rotateFile ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleRotateFileUpload}
            id="rotate-pdf-input"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="rotate-pdf-input"
            style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
          >
            📁 Choose PDF File to Rotate
          </label>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '15px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <span style={{ fontWeight: 'bold', color: '#334155' }}>Selected File: {rotateFile.name} ({rotatePagePreviews.length} Pages)</span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => rotateAllPages('ccw')}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                ↶ Rotate All Left
              </button>
              <button
                onClick={() => rotateAllPages('cw')}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                ↷ Rotate All Right
              </button>
            </div>
          </div>

          {isLoadingRotatePreviews ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ color: '#0070f3', fontWeight: 'bold' }}>Generating Page Previews...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', maxHeight: '450px', overflowY: 'auto', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
              {rotatePagePreviews.map((src, index) => {
                const currentAngle = pageRotations[index] || 0;
                return (
                  <div key={index} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: 'white', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                      Page {index + 1} {currentAngle !== 0 && `(${currentAngle}°)`}
                    </span>

                    <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '10px 0' }}>
                      <img
                        src={src}
                        alt={`Page ${index + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          borderRadius: '4px',
                          transition: 'transform 0.2s ease',
                          transform: `rotate(${currentAngle}deg)`,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                      <button
                        onClick={() => rotateSinglePage(index, 'ccw')}
                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        title="Rotate Left 90°"
                      >
                        ↶ 90°
                      </button>
                      <button
                        onClick={() => rotateSinglePage(index, 'cw')}
                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        title="Rotate Right 90°"
                      >
                        ↷ 90°
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleSaveRotatedPDF}
            disabled={isSavingRotatedPdf}
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
            {isSavingRotatedPdf ? 'Saving Rotated PDF...' : '🔄 Save & Download Rotated PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
