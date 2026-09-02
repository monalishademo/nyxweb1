'use client';

import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { colorMap, commonWatermarks } from '@/lib/colorMap';

export default function WatermarkTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkPreviews, setWatermarkPreviews] = useState<string[]>([]);
  const [isLoadingWatermarkPreviews, setIsLoadingWatermarkPreviews] = useState<boolean>(false);

  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkAngle, setWatermarkAngle] = useState<number>(-45);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.2);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(36);
  const [watermarkColor, setWatermarkColor] = useState<string>('red');
  const [watermarkPosition, setWatermarkPosition] = useState<'center' | 'top' | 'bottom'>('center');

  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkImagePreviewUrl, setWatermarkImagePreviewUrl] = useState<string | null>(null);
  const [watermarkImageScale, setWatermarkImageScale] = useState<number>(0.3);

  const [isAddingWatermark, setIsAddingWatermark] = useState<boolean>(false);

  const handleWatermarkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !pdfjs) return;
    const file = e.target.files[0];
    setWatermarkFile(file);
    setIsLoadingWatermarkPreviews(true);

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

      setWatermarkPreviews(previews);
      setIsLoadingWatermarkPreviews(false);
    } catch (err) {
      console.error(err);
      setIsLoadingWatermarkPreviews(false);
    }
  };

  const handleWatermarkImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const imgFile = e.target.files[0];
    setWatermarkImageFile(imgFile);
    setWatermarkImagePreviewUrl(URL.createObjectURL(imgFile));
  };

  const handleAddWatermark = async () => {
    if (!watermarkFile) return;
    setIsAddingWatermark(true);

    try {
      const arrayBuffer = await watermarkFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      if (watermarkType === 'text') {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const chosenColor = colorMap[watermarkColor] || colorMap.red;
        const rgbColor = rgb(chosenColor.r, chosenColor.g, chosenColor.b);

        pages.forEach((page) => {
          const { width, height } = page.getSize();
          const text = watermarkText || 'CONFIDENTIAL';
          const textWidth = font.widthOfTextAtSize(text, watermarkFontSize);

          let x = width / 2 - textWidth / 2;
          let y = height / 2;

          if (watermarkPosition === 'top') y = height - 100;
          if (watermarkPosition === 'bottom') y = 100;

          page.drawText(text, {
            x,
            y,
            size: watermarkFontSize,
            font,
            color: rgbColor,
            opacity: watermarkOpacity,
            rotate: degrees(watermarkAngle),
          });
        });
      } else if (watermarkType === 'image' && watermarkImageFile) {
        const imgArrayBuffer = await watermarkImageFile.arrayBuffer();
        let embeddedImg;

        if (watermarkImageFile.type === 'image/png') {
          embeddedImg = await pdfDoc.embedPng(imgArrayBuffer);
        } else {
          embeddedImg = await pdfDoc.embedJpg(imgArrayBuffer);
        }

        pages.forEach((page) => {
          const { width, height } = page.getSize();
          const imgWidth = embeddedImg.width * watermarkImageScale;
          const imgHeight = embeddedImg.height * watermarkImageScale;

          let x = width / 2 - imgWidth / 2;
          let y = height / 2 - imgHeight / 2;

          if (watermarkPosition === 'top') y = height - imgHeight - 50;
          if (watermarkPosition === 'bottom') y = 50;

          page.drawImage(embeddedImg, {
            x,
            y,
            width: imgWidth,
            height: imgHeight,
            opacity: watermarkOpacity,
            rotate: degrees(watermarkAngle),
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `watermarked_${watermarkFile.name}`;
      link.click();

      setIsAddingWatermark(false);
    } catch (err) {
      console.error(err);
      setIsAddingWatermark(false);
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
              NYX Watermark Tool
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
              PDF TOOL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add custom text or image logo watermarks with real-time interactive preview.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!watermarkFile ? (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleWatermarkFileUpload}
            id="watermark-pdf-input"
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload PDF Document</h3>
          <p className="text-xs text-slate-500 mb-6">Select a file to add text or image watermark protection.</p>

          <label
            htmlFor="watermark-pdf-input"
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
          {/* Watermark Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setWatermarkType('text')}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                watermarkType === 'text'
                  ? 'bg-indigo-50/80 border-indigo-600 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>✍️</span> Text Watermark
            </button>
            <button
              type="button"
              onClick={() => setWatermarkType('image')}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                watermarkType === 'image'
                  ? 'bg-indigo-50/80 border-indigo-600 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🖼️</span> Image / Logo Watermark
            </button>
          </div>

          {/* Configuration & Model Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Options Panel */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-700">
                  {watermarkType === 'text' ? 'Text Configuration' : 'Logo & Image Options'}
                </span>
                <button
                  onClick={() => setWatermarkFile(null)}
                  className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {watermarkType === 'text' ? (
                <>
                  {/* Preset quick buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Quick Presets</label>
                    <div className="flex flex-wrap gap-1.5">
                      {commonWatermarks.map((txt) => (
                        <button
                          key={txt}
                          type="button"
                          onClick={() => setWatermarkText(txt)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {txt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Watermark text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Type watermark text..."
                      className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Font Size & Color */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Font Size</label>
                      <select
                        value={watermarkFontSize}
                        onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                        className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value={24}>Small (24px)</option>
                        <option value={36}>Medium (36px)</option>
                        <option value={48}>Large (48px)</option>
                        <option value={60}>Extra Large (60px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Font Color</label>
                      <select
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="red">🔴 Red</option>
                        <option value="crimson">🍷 Crimson</option>
                        <option value="black">⚫ Black</option>
                        <option value="gray">🔘 Gray</option>
                        <option value="blue">🔵 Blue</option>
                        <option value="darkblue">🌌 Dark Navy</option>
                        <option value="green">🟢 Green</option>
                        <option value="orange">🟠 Orange</option>
                        <option value="purple">🟣 Purple</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Image input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Upload Logo / Image</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleWatermarkImageSelect}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>

                  {/* Image scale */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Image Scale Size</label>
                    <select
                      value={watermarkImageScale}
                      onChange={(e) => setWatermarkImageScale(Number(e.target.value))}
                      className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value={0.15}>Small (15%)</option>
                      <option value={0.3}>Medium (30% - Recommended)</option>
                      <option value={0.5}>Large (50%)</option>
                      <option value={0.75}>Extra Large (75%)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Rotation & Opacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Rotation Angle</label>
                  <select
                    value={watermarkAngle}
                    onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                    className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={-45}>Diagonal (-45°)</option>
                    <option value={0}>Horizontal (0°)</option>
                    <option value={90}>Vertical (90°)</option>
                    <option value={45}>Reverse Diagonal (45°)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Opacity / Density</label>
                  <select
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                    className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={0.1}>10% (Very Light)</option>
                    <option value={0.2}>20% (Standard Light)</option>
                    <option value={0.4}>40% (Medium)</option>
                    <option value={0.7}>70% (Strong)</option>
                    <option value={1.0}>100% (Solid)</option>
                  </select>
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Position</label>
                <select
                  value={watermarkPosition}
                  onChange={(e: any) => setWatermarkPosition(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="center">Center of Page (Default)</option>
                  <option value="top">Top Header</option>
                  <option value="bottom">Bottom Footer</option>
                </select>
              </div>
            </div>

            {/* Right Column: Interactive Live Preview Model */}
            <div className="lg:col-span-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-500 mb-4">🔍 Realtime Watermark Model</span>

              <div className="relative w-44 h-60 bg-white border border-slate-300 rounded-lg shadow-md p-3.5 flex flex-col justify-between overflow-hidden">
                {/* Background dummy lines */}
                <div className="space-y-2 pointer-events-none">
                  <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-4/5 h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-3/4 h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                  <div className="w-2/3 h-1.5 bg-slate-100 rounded"></div>
                </div>

                {/* Live Watermark Overlay */}
                {watermarkType === 'text' && (
                  <span
                    className="absolute left-1/2 pointer-events-none font-black whitespace-nowrap select-none transition-all"
                    style={{
                      top: watermarkPosition === 'top' ? '25%' : watermarkPosition === 'bottom' ? '75%' : '50%',
                      transform: `translate(-50%, -50%) rotate(${watermarkAngle}deg)`,
                      fontSize: `${Math.max(12, watermarkFontSize / 2.5)}px`,
                      color: (colorMap[watermarkColor] || colorMap.red).hex,
                      opacity: watermarkOpacity,
                    }}
                  >
                    {watermarkText || 'CONFIDENTIAL'}
                  </span>
                )}

                {watermarkType === 'image' && (
                  watermarkImagePreviewUrl ? (
                    <img
                      src={watermarkImagePreviewUrl}
                      alt="Watermark Logo"
                      className="absolute left-1/2 pointer-events-none object-contain select-none transition-all"
                      style={{
                        top: watermarkPosition === 'top' ? '25%' : watermarkPosition === 'bottom' ? '75%' : '50%',
                        transform: `translate(-50%, -50%) rotate(${watermarkAngle}deg)`,
                        maxWidth: `${watermarkImageScale * 140}px`,
                        maxHeight: `${watermarkImageScale * 180}px`,
                        opacity: watermarkOpacity,
                      }}
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-400">
                      Upload Image to Preview
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Previews List */}
          {isLoadingWatermarkPreviews ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-700">Loading Document Page Previews...</p>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-3">
                Document Pages Preview ({watermarkPreviews.length} Pages)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5 max-h-[320px] overflow-y-auto p-3.5 border border-slate-100 rounded-xl bg-slate-50/50">
                {watermarkPreviews.map((src, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-lg p-2 text-center shadow-xs">
                    <img src={src} alt={`Page ${index + 1}`} className="w-full h-auto rounded object-contain mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-500">Page {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleAddWatermark}
            disabled={isAddingWatermark || (watermarkType === 'image' && !watermarkImageFile)}
            className="mt-6 w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAddingWatermark ? 'Applying Watermark...' : '💧 Apply Watermark & Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}