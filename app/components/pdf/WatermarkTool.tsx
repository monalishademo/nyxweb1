'use client';

import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import BackButton from '../BackButton';
import { colorMap, commonWatermarks } from '../../lib/colorMap';

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
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>💧 Add Watermark to PDF</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Add text or image logo watermarks with live interactive model preview.</p>

      {!watermarkFile ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleWatermarkFileUpload}
            id="watermark-pdf-input"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="watermark-pdf-input"
            style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
          >
            📁 Choose PDF File for Watermark
          </label>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <button
              onClick={() => setWatermarkType('text')}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: watermarkType === 'text' ? '2px solid #0070f3' : '1px solid #cbd5e1', backgroundColor: watermarkType === 'text' ? '#eff6ff' : 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
            >
              ✍️ Text Watermark
            </button>
            <button
              onClick={() => setWatermarkType('image')}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: watermarkType === 'image' ? '2px solid #0070f3' : '1px solid #cbd5e1', backgroundColor: watermarkType === 'image' ? '#eff6ff' : 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
            >
              🖼️ Image / Logo Watermark
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>

              {watermarkType === 'text' ? (
                <>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>⚙️ Text Watermark Options:</h4>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Quick Common Presets:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {commonWatermarks.map((txt) => (
                        <button
                          key={txt}
                          onClick={() => setWatermarkText(txt)}
                          style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: '#334155' }}
                        >
                          {txt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Watermark Text:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Type watermark text..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Text Size:</label>
                      <select
                        value={watermarkFontSize}
                        onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                      >
                        <option value={24}>Small (24px)</option>
                        <option value={36}>Medium (36px)</option>
                        <option value={48}>Large (48px)</option>
                        <option value={60}>Extra Large (60px)</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Color:</label>
                      <select
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
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
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>⚙️ Image Watermark Options:</h4>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Upload Logo/Image (PNG/JPG):</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleWatermarkImageSelect}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Image Size Scale:</label>
                    <select
                      value={watermarkImageScale}
                      onChange={(e) => setWatermarkImageScale(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    >
                      <option value={0.15}>Small (15%)</option>
                      <option value={0.3}>Medium (30% - Recommended)</option>
                      <option value={0.5}>Large (50%)</option>
                      <option value={0.75}>Extra Large (75%)</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Rotation Angle:</label>
                <select
                  value={watermarkAngle}
                  onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value={-45}>Diagonal (-45°) [Recommended]</option>
                  <option value={0}>Horizontal (0°)</option>
                  <option value={90}>Vertical (90°)</option>
                  <option value={45}>Reverse Diagonal (45°)</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Opacity / Density:</label>
                <select
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value={0.1}>10% (Very Light)</option>
                  <option value={0.2}>20% (Standard Light / Recommended)</option>
                  <option value={0.4}>40% (Medium Density)</option>
                  <option value={0.7}>70% (Strong Density)</option>
                  <option value={1.0}>100% (Solid / No Transparency)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Position:</label>
                <select
                  value={watermarkPosition}
                  onChange={(e: any) => setWatermarkPosition(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="center">Center of Page (Default)</option>
                  <option value="top">Top Header</option>
                  <option value="bottom">Bottom Footer</option>
                </select>
              </div>

            </div>

            <div style={{ backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#475569' }}>🔍 Live Interactive Page Model</h5>

              <div
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '240px',
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ position: 'absolute', top: '15px', left: '12px', right: '12px' }}>
                  <div style={{ borderBottom: '2px solid #e2e8f0', width: '60%', height: '8px', marginBottom: '10px' }}></div>
                  <div style={{ backgroundColor: '#f1f5f9', width: '100%', height: '6px', marginBottom: '6px' }}></div>
                  <div style={{ backgroundColor: '#f1f5f9', width: '80%', height: '6px', marginBottom: '6px' }}></div>
                  <div style={{ backgroundColor: '#f1f5f9', width: '90%', height: '6px', marginBottom: '6px' }}></div>
                </div>

                {watermarkType === 'text' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: watermarkPosition === 'top' ? '25%' : watermarkPosition === 'bottom' ? '75%' : '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${watermarkAngle}deg)`,
                      fontSize: `${watermarkFontSize / 2}px`,
                      color: (colorMap[watermarkColor] || colorMap.red).hex,
                      opacity: watermarkOpacity,
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 5,
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
                      style={{
                        position: 'absolute',
                        top: watermarkPosition === 'top' ? '25%' : watermarkPosition === 'bottom' ? '75%' : '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${watermarkAngle}deg)`,
                        maxWidth: `${watermarkImageScale * 180}px`,
                        maxHeight: `${watermarkImageScale * 240}px`,
                        opacity: watermarkOpacity,
                        pointerEvents: 'none',
                        zIndex: 5,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8', zIndex: 5 }}>Upload Image to Preview</span>
                  )
                )}
              </div>
            </div>

          </div>

          {isLoadingWatermarkPreviews ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ color: '#0070f3', fontWeight: 'bold' }}>Loading Document Page Previews...</p>
            </div>
          ) : (
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>Document Pages Preview ({watermarkPreviews.length} Pages):</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', maxHeight: '350px', overflowY: 'auto', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                {watermarkPreviews.map((src, index) => (
                  <div key={index} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', backgroundColor: 'white', textAlign: 'center' }}>
                    <img src={src} alt={`Page ${index + 1}`} style={{ width: '100%', borderRadius: '4px' }} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Page {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddWatermark}
            disabled={isAddingWatermark || (watermarkType === 'image' && !watermarkImageFile)}
            style={{
              marginTop: '25px',
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: (watermarkType === 'image' && !watermarkImageFile) ? '#94a3b8' : '#8b5cf6',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (watermarkType === 'image' && !watermarkImageFile) ? 'not-allowed' : 'pointer',
            }}
          >
            {isAddingWatermark ? 'Applying Watermark...' : '💧 Apply Watermark & Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
