'use client';

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { formatFileSize } from '@/lib/utils';

export default function CompressPdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressPreviewUrl, setCompressPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'preset' | 'target'>('target');
  const [compressionLevel, setCompressionLevel] = useState<'extreme' | 'recommended' | 'low'>('recommended');
  
  // Custom Target Size States
  const [targetSizeVal, setTargetSizeVal] = useState<string>('500');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [compressedResult, setCompressedResult] = useState<{ 
    size: string; 
    downloadUrl: string; 
    filename: string;
    savedPercent: number;
  } | null>(null);

  const handleCompressFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setCompressFile(file);
    setCompressedResult(null);
    setProgress(0);

    // Default target size calculation (original size er 50%)
    const defaultTargetKB = Math.max(50, Math.round((file.size / 1024) * 0.5));
    setTargetSizeVal(defaultTargetKB.toString());
    setTargetUnit('KB');

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

    if (!pdfjs) {
      alert("PDF Engine প্রস্তুত হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।");
      return;
    }

    setIsCompressing(true);
    setCompressedResult(null);
    setProgress(0);

    try {
      const arrayBuffer = await compressFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let scale = 1.5;
      let quality = 0.65;

      if (mode === 'target') {
        // Target calculation
        const targetBytes = (Number(targetSizeVal) || 500) * (targetUnit === 'MB' ? 1024 * 1024 : 1024);
        const ratio = targetBytes / compressFile.size;

        if (ratio <= 0.25) {
          scale = 0.85;
          quality = 0.35;
        } else if (ratio <= 0.5) {
          scale = 1.1;
          quality = 0.55;
        } else if (ratio <= 0.75) {
          scale = 1.4;
          quality = 0.70;
        } else {
          scale = 1.8;
          quality = 0.85;
        }
      } else {
        if (compressionLevel === 'extreme') {
          scale = 1.0;
          quality = 0.45;
        } else if (compressionLevel === 'low') {
          scale = 2.0;
          quality = 0.85;
        }
      }

      let doc: jsPDF | null = null;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const origViewport = page.getViewport({ scale: 1.0 });
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'medium';

          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/jpeg', quality);

          const orientation = origViewport.width > origViewport.height ? 'l' : 'p';

          if (pageNum === 1) {
            doc = new jsPDF({
              orientation: orientation,
              unit: 'px',
              format: [origViewport.width, origViewport.height],
              compress: true,
            });
            doc.addImage(imgData, 'JPEG', 0, 0, origViewport.width, origViewport.height, undefined, 'FAST');
          } else if (doc) {
            doc.addPage([origViewport.width, origViewport.height], orientation);
            doc.addImage(imgData, 'JPEG', 0, 0, origViewport.width, origViewport.height, undefined, 'FAST');
          }
        }

        setProgress(Math.round((pageNum / totalPages) * 100));
      }

      if (doc) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);

        const savedBytes = Math.max(0, compressFile.size - blob.size);
        const savedPercent = Math.round((savedBytes / compressFile.size) * 100);

        setCompressedResult({
          size: formatFileSize(blob.size),
          downloadUrl: url,
          filename: `compressed_${compressFile.name}`,
          savedPercent: savedPercent > 0 ? savedPercent : 0,
        });

        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${compressFile.name}`;
        link.click();
      }

      setIsCompressing(false);
    } catch (error) {
      console.error('Compression error:', error);
      alert('PDF Compress করতে সমস্যা হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।');
      setIsCompressing(false);
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
              NYX PDF Compressor
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
              PDF TOOL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Reduce PDF file size by setting exact target file size or presets.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!compressFile ? (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleCompressFileUpload}
            id="compress-pdf-input"
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload PDF Document</h3>
          <p className="text-xs text-slate-500 mb-6">Select a file to compress to your desired file size.</p>

          <label
            htmlFor="compress-pdf-input"
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
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setMode('target')}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                mode === 'target'
                  ? 'bg-indigo-50/80 border-indigo-600 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🎯</span> Set Custom Target Size (KB / MB)
            </button>
            <button
              type="button"
              onClick={() => setMode('preset')}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                mode === 'preset'
                  ? 'bg-indigo-50/80 border-indigo-600 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>⚡</span> Standard Presets
            </button>
          </div>

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Compression Options Panel */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-700">
                  {mode === 'target' ? 'Custom Size Settings' : 'Preset Compression Levels'}
                </span>
                <button
                  onClick={() => setCompressFile(null)}
                  className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {mode === 'target' ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Desired Target Size
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="10"
                        value={targetSizeVal}
                        onChange={(e) => setTargetSizeVal(e.target.value)}
                        placeholder="e.g. 200, 500"
                        className="flex-1 py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <select
                        value={targetUnit}
                        onChange={(e: any) => setTargetUnit(e.target.value)}
                        className="w-24 py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Pill Buttons */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Quick Target Presets:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['100', '200', '500', '1000'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setTargetSizeVal(size);
                            setTargetUnit('KB');
                          }}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer shadow-2xs transition-colors"
                        >
                          {Number(size) >= 1000 ? '1 MB' : `${size} KB`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    * The engine will optimize rendering resolution and image streams to closely match your target size.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCompressionLevel('extreme')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      compressionLevel === 'extreme'
                        ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">Extreme Compression</p>
                      <p className="text-[11px] text-slate-500">Smallest file size (~70-80% reduction)</p>
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${compressionLevel === 'extreme' ? 'border-indigo-600' : 'border-slate-300'}`}>
                      {compressionLevel === 'extreme' && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompressionLevel('recommended')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      compressionLevel === 'recommended'
                        ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">Recommended Compression</p>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">Optimal</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Good balance between quality and size</p>
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${compressionLevel === 'recommended' ? 'border-indigo-600' : 'border-slate-300'}`}>
                      {compressionLevel === 'recommended' && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompressionLevel('low')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      compressionLevel === 'low'
                        ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">Low Compression</p>
                      <p className="text-[11px] text-slate-500">Maximum visual fidelity</p>
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${compressionLevel === 'low' ? 'border-indigo-600' : 'border-slate-300'}`}>
                      {compressionLevel === 'low' && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Document Info Card */}
            <div className="lg:col-span-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              {compressPreviewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-md bg-white p-1">
                  <img
                    src={compressPreviewUrl}
                    alt="PDF Preview"
                    className="w-24 h-32 object-cover rounded"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
                  📄
                </div>
              )}

              <div className="mt-3">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                  {compressFile.name}
                </p>
                <div className="mt-1 text-xs">
                  <span className="text-slate-500">Original Size: </span>
                  <span className="font-bold text-rose-600">{formatFileSize(compressFile.size)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compress Action Button */}
          <button
            onClick={handleCompressPDF}
            disabled={isCompressing}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCompressing ? `Compressing (${progress}%)...` : `🗜️ Compress PDF ${mode === 'target' ? `to ~${targetSizeVal} ${targetUnit}` : ''}`}
          </button>

          {/* Result Banner */}
          {compressedResult && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
              <h3 className="text-xs font-bold text-emerald-800">
                🎉 PDF Compressed Successfully!
              </h3>
              <p className="text-xs text-emerald-700">
                New Size: <b>{compressedResult.size}</b> 
                {compressedResult.savedPercent > 0 && ` (Reduced by ~${compressedResult.savedPercent}%)`}
              </p>
              <a
                href={compressedResult.downloadUrl}
                download={compressedResult.filename}
                className="mt-1 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                ⬇️ Download Compressed PDF Again
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}