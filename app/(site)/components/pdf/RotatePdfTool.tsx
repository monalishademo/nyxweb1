'use client';

import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';

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
              NYX PDF Rotator
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
              PDF TOOL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rotate specific or all pages with live sample preview before saving.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!rotateFile ? (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleRotateFileUpload}
            id="rotate-pdf-input"
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload PDF Document</h3>
          <p className="text-xs text-slate-500 mb-6">Select a file to rotate pages individually or altogether.</p>

          <label
            htmlFor="rotate-pdf-input"
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
          {/* Action Toolbar */}
          <div className="flex flex-wrap gap-3 justify-between items-center mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                File: <b className="text-slate-800">{rotateFile.name}</b> ({rotatePagePreviews.length} Pages)
              </span>
              <button
                onClick={() => setRotateFile(null)}
                className="text-xs text-rose-500 hover:underline font-medium ml-2 cursor-pointer"
              >
                Change File
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => rotateAllPages('ccw')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>↶</span> Rotate All Left
              </button>
              <button
                onClick={() => rotateAllPages('cw')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>↷</span> Rotate All Right
              </button>
            </div>
          </div>

          {isLoadingRotatePreviews ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-700">Generating page previews...</p>
            </div>
          ) : (
            <>
              {/* Previews Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[480px] overflow-y-auto p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                {rotatePagePreviews.map((src, index) => {
                  const currentAngle = pageRotations[index] || 0;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-600">
                          Page {index + 1}
                        </span>
                        {currentAngle !== 0 && (
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {currentAngle}°
                          </span>
                        )}
                      </div>

                      <div className="h-40 flex items-center justify-center overflow-hidden my-2 bg-slate-50 rounded-lg border border-slate-100 p-2">
                        <img
                          src={src}
                          alt={`Page ${index + 1}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 ease-in-out"
                          style={{
                            transform: `rotate(${currentAngle}deg)`,
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        <button
                          onClick={() => rotateSinglePage(index, 'ccw')}
                          className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                          title="Rotate Left 90°"
                        >
                          ↶ 90°
                        </button>
                        <button
                          onClick={() => rotateSinglePage(index, 'cw')}
                          className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                          title="Rotate Right 90°"
                        >
                          ↷ 90°
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit / Download Button */}
              <button
                onClick={handleSaveRotatedPDF}
                disabled={isSavingRotatedPdf}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingRotatedPdf ? 'Saving Rotated PDF...' : '🔄 Save & Download Rotated PDF'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}