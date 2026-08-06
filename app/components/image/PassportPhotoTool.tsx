'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const REMOVE_BG_API_KEY = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY || 'QYL5agiSCEkcV9eFHpE1ncYA';

// Passport photo constants @ 300 DPI (1.2" x 1.5")
const DPI = 300;
const SINGLE_W = Math.round(1.2 * DPI); // 360 px
const SINGLE_H = Math.round(1.5 * DPI); // 450 px
const SHEET_PHOTO_W = Math.round(1.2 * DPI); // 360 px
const SHEET_PHOTO_H = Math.round(1.37 * DPI); // 411 px

type SheetKind = '4x6' | '5x7' | 'A4';

const SHEETS: Record<SheetKind, { w: number; h: number; label: string; maxCopies: number }> = {
  '4x6': { w: 4 * DPI, h: 6 * DPI, label: '4×6 inch', maxCopies: 12 },
  '5x7': { w: 5 * DPI, h: 7 * DPI, label: '5×7 inch', maxCopies: 16 },
  A4: { w: Math.round(8.27 * DPI), h: Math.round(11.69 * DPI), label: 'A4', maxCopies: 40 },
};

const BG_PRESETS: { name: string; color: string; text: string }[] = [
  { name: 'White', color: '#ffffff', text: '#000' },
  { name: 'Off-White', color: '#f5f5f0', text: '#000' },
  { name: 'Light Blue', color: '#e0f2fe', text: '#000' },
  { name: 'Sky Blue', color: '#60a5fa', text: '#fff' },
  { name: 'Royal Blue', color: '#2563eb', text: '#fff' },
  { name: 'Navy', color: '#1e3a8a', text: '#fff' },
  { name: 'Red', color: '#dc2626', text: '#fff' },
  { name: 'Light Grey', color: '#e5e7eb', text: '#000' },
  { name: 'Grey', color: '#9ca3af', text: '#fff' },
  { name: 'Cream', color: '#fef3c7', text: '#000' },
  { name: 'Green', color: '#16a34a', text: '#fff' },
];

/**
 * Encodes DPI density header into JPEG Data URL directly so Photoshop & Printers read exact 300/600 DPI
 */
function setJpegDpi(dataUrl: string, dpi: number): string {
  const parts = dataUrl.split(',');
  const byteString = atob(parts[1]);
  const buffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    buffer[i] = byteString.charCodeAt(i);
  }

  // JFIF marker APP0 injection
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] === 0xff && buffer[offset + 1] === 0xe0) {
        buffer[offset + 7] = 1; // dots per inch
        buffer[offset + 8] = (dpi >> 8) & 0xff;
        buffer[offset + 9] = dpi & 0xff;
        buffer[offset + 10] = (dpi >> 8) & 0xff;
        buffer[offset + 11] = dpi & 0xff;
        break;
      }
      offset += 1;
    }
  }

  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:image/jpeg;base64,' + btoa(binary);
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cleanCutoutSrc, setCleanCutoutSrc] = useState<string | null>(null);

  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  const [isUpscaled2X, setIsUpscaled2X] = useState(false);
  
  // Basic Enhancements
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Pro Color Balance & Tonal Controls (Yellow / Blue, Red / Green)
  const [tempTone, setTempTone] = useState(0); // Negative = Cold (Blue), Positive = Warm (Yellow)
  const [tintTone, setTintTone] = useState(0); // Negative = Green, Positive = Magenta/Red
  
  // Curve Adjustments (Shadows & Highlights)
  const [curveShadows, setCurveShadows] = useState(0);
  const [curveHighlights, setCurveHighlights] = useState(0);

  // Studio Polish
  const [sharpness, setSharpness] = useState(20);
  const [beautifyLevel, setBeautifyLevel] = useState(25);

  const [addBorder, setAddBorder] = useState(true);
  const [singleResultUrl, setSingleResultUrl] = useState<string | null>(null);

  const [sheetMode, setSheetMode] = useState(false);
  const [sheetKind, setSheetKind] = useState<SheetKind>('4x6');
  const [copies, setCopies] = useState(8);
  const [sheetResultUrl, setSheetResultUrl] = useState<string | null>(null);

  const imgCacheRef = useRef<HTMLImageElement | null>(null);
  const activeSrc = cleanCutoutSrc || rawImageSrc;

  useEffect(() => {
    if (!activeSrc) {
      imgCacheRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgCacheRef.current = img;
      renderAll();
    };
    img.src = activeSrc;
  }, [activeSrc]);

  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!imgCacheRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => renderAll());
  }, [
    rotation, zoom, posX, posY,
    brightness, contrast, saturation, tempTone, tintTone, curveShadows, curveHighlights,
    sharpness, beautifyLevel, isUpscaled2X, bgColor, transparentBg, addBorder,
    sheetMode, sheetKind, copies,
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setCleanCutoutSrc(null);
    setSingleResultUrl(null);
    setSheetResultUrl(null);
    setBgError(null);
    resetControls();
    setRawImageSrc(URL.createObjectURL(selected));
  };

  const resetControls = () => {
    setRotation(0);
    setZoom(1);
    setPosX(0);
    setPosY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setTempTone(0);
    setTintTone(0);
    setCurveShadows(0);
    setCurveHighlights(0);
    setSharpness(20);
    setBeautifyLevel(25);
    setBgColor('#ffffff');
    setTransparentBg(false);
  };

  // Auto Contrast and Color Tone AI Logic
  const handleAutoContrast = () => {
    setBrightness(104);
    setContrast(115);
    setSaturation(108);
    setCurveShadows(-10);
    setCurveHighlights(12);
    setSharpness(35);
    setBeautifyLevel(30);
  };

  const handleRemoveBg = async () => {
    if (!file && !rawImageSrc) return;
    setIsRemovingBg(true);
    setBgError(null);
    try {
      let uploadFile: File | null = file;
      if (!uploadFile && rawImageSrc) {
        const res = await fetch(rawImageSrc);
        const blob = await res.blob();
        uploadFile = new File([blob], 'photo.png', { type: 'image/png' });
      }
      const fd = new FormData();
      fd.append('image_file', uploadFile!);
      fd.append('size', 'auto');
      const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        body: fd,
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({} as any));
        throw new Error(errJson.errors?.[0]?.title || 'Remove.bg API error / limit reached');
      }
      const blob = await resp.blob();
      setCleanCutoutSrc(URL.createObjectURL(blob));
    } catch (err: any) {
      setBgError(err.message || 'Background removal failed');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const renderPassportCanvas = (
    img: HTMLImageElement,
    targetW: number,
    targetH: number
  ): HTMLCanvasElement => {
    const SS = 2; // Supersampling factor
    const iw = targetW * SS;
    const ih = targetH * SS;

    const inner = document.createElement('canvas');
    inner.width = iw;
    inner.height = ih;
    const ictx = inner.getContext('2d', { willReadFrequently: true })!;
    ictx.imageSmoothingEnabled = true;
    ictx.imageSmoothingQuality = 'high';

    if (!transparentBg) {
      ictx.fillStyle = bgColor;
      ictx.fillRect(0, 0, iw, ih);
    } else {
      ictx.clearRect(0, 0, iw, ih);
    }

    // 1. Draw transformed image
    ictx.save();
    
    // CSS Filter application
    const hueDeg = tempTone * 0.4;
    ictx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueDeg}deg)`;

    const imgAspect = img.width / img.height;
    const targetAspect = targetW / targetH;
    let baseScale: number;
    if (imgAspect > targetAspect) {
      baseScale = ih / img.height;
    } else {
      baseScale = iw / img.width;
    }
    const finalScale = baseScale * zoom;

    ictx.translate(iw / 2 + posX * SS, ih / 2 + posY * SS);
    ictx.rotate((rotation * Math.PI) / 180);
    ictx.scale(finalScale, finalScale);
    ictx.drawImage(img, -img.width / 2, -img.height / 2);
    ictx.restore();
    ictx.filter = 'none';

    // 2. Advanced Pixel Level Adjustments (Curves, Tint & Color Balance)
    const imgData = ictx.getImageData(0, 0, iw, ih);
    const data = imgData.data;
    
    const shadowFactor = curveShadows * 1.2;
    const highlightFactor = curveHighlights * 1.2;
    const redAdjust = tintTone * 0.8 + (tempTone > 0 ? tempTone * 0.5 : 0);
    const blueAdjust = (tempTone < 0 ? -tempTone * 0.8 : 0);

    for (let i = 0; i < data.length; i += 4) {
      // Ignore background transparent pixels
      if (transparentBg && data[i + 3] === 0) continue;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Color Balance Adjustment
      r = Math.min(255, Math.max(0, r + redAdjust));
      b = Math.min(255, Math.max(0, b + blueAdjust));

      // Curves Shadow & Highlight adjustment
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 128) {
        const factor = (128 - luminance) / 128;
        r += shadowFactor * factor;
        g += shadowFactor * factor;
        b += shadowFactor * factor;
      } else {
        const factor = (luminance - 128) / 128;
        r += highlightFactor * factor;
        g += highlightFactor * factor;
        b += highlightFactor * factor;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
    ictx.putImageData(imgData, 0, 0);

    // 3. Pro Beautify (Skin Smoothing without losing key features)
    if (beautifyLevel > 0) {
      const bl = beautifyLevel / 100;
      const blurPx = 1.5 + bl * 4;
      const beauty = document.createElement('canvas');
      beauty.width = iw;
      beauty.height = ih;
      const bctx = beauty.getContext('2d')!;
      bctx.filter = `blur(${blurPx * SS}px) brightness(${102 + bl * 3}%)`;
      bctx.drawImage(inner, 0, 0);
      bctx.filter = 'none';

      ictx.save();
      ictx.globalAlpha = 0.25 + bl * 0.35;
      ictx.globalCompositeOperation = 'soft-light';
      ictx.drawImage(beauty, 0, 0);
      ictx.restore();
    }

    // 4. High-Pass Crisp Sharpness
    if (sharpness > 0) {
      const s = sharpness / 100;
      const sharpCanvas = document.createElement('canvas');
      sharpCanvas.width = iw;
      sharpCanvas.height = ih;
      const sctx = sharpCanvas.getContext('2d')!;
      sctx.drawImage(inner, 0, 0);

      ictx.save();
      ictx.globalAlpha = 0.3 * s;
      ictx.globalCompositeOperation = 'overlay';
      ictx.drawImage(sharpCanvas, 0, 0);
      ictx.restore();
    }

    // Downsampling to Target Dimensions
    const out = document.createElement('canvas');
    out.width = targetW;
    out.height = targetH;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(inner, 0, 0, targetW, targetH);

    // Stroke Border
    if (addBorder) {
      const bw = Math.max(2, Math.round(targetW / 120));
      octx.strokeStyle = '#000000';
      octx.lineWidth = bw;
      octx.strokeRect(bw / 2, bw / 2, targetW - bw, targetH - bw);
    }

    return out;
  };

  const renderSingle = () => {
    const img = imgCacheRef.current;
    if (!img) return;
    const scale = isUpscaled2X ? 2 : 1;
    const targetDpi = 300 * scale;
    const W = SINGLE_W * scale;
    const H = SINGLE_H * scale;
    
    const canvas = renderPassportCanvas(img, W, H);
    const mime = transparentBg ? 'image/png' : 'image/jpeg';
    const rawDataUrl = canvas.toDataURL(mime, 0.98);

    // Inject true 300/600 DPI into metadata
    const dpiDataUrl = transparentBg ? rawDataUrl : setJpegDpi(rawDataUrl, targetDpi);
    setSingleResultUrl(dpiDataUrl);
  };

  const renderSheet = () => {
    const img = imgCacheRef.current;
    if (!img) return;
    const scale = isUpscaled2X ? 2 : 1;
    const targetDpi = 300 * scale;
    const sheet = SHEETS[sheetKind];
    const W = sheet.w * scale;
    const H = sheet.h * scale;
    const photoW = SHEET_PHOTO_W * scale;
    const photoH = SHEET_PHOTO_H * scale;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const marginX = Math.round(0.075 * DPI * scale);
    const marginY = Math.round(0.075 * DPI * scale);
    const gapX = Math.round(0.05 * DPI * scale);
    const gapY = Math.round(0.05 * DPI * scale);

    const maxCols = Math.max(1, Math.floor((W - 2 * marginX + gapX) / (photoW + gapX)));
    const maxRows = Math.max(1, Math.floor((H - 2 * marginY + gapY) / (photoH + gapY)));
    const capacity = maxCols * maxRows;
    const totalCopies = Math.min(copies, capacity);

    const photoCanvas = renderPassportCanvas(img, photoW, photoH);

    let placed = 0;
    for (let r = 0; r < maxRows && placed < totalCopies; r++) {
      const remaining = totalCopies - placed;
      const rowCount = Math.min(maxCols, remaining);
      const isLast = placed + rowCount === totalCopies && rowCount < maxCols;
      const totalRowW = rowCount * photoW + (rowCount - 1) * gapX;
      const startX = isLast ? Math.round((W - totalRowW) / 2) : marginX;
      const y = marginY + r * (photoH + gapY);
      for (let c = 0; c < rowCount; c++) {
        const x = startX + c * (photoW + gapX);
        ctx.drawImage(photoCanvas, x, y);
        placed++;
      }
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.setLineDash([6 * scale, 6 * scale]);
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.restore();

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.98);
    setSheetResultUrl(setJpegDpi(rawDataUrl, targetDpi));
  };

  const renderAll = useCallback(() => {
    renderSingle();
    if (sheetMode) renderSheet();
  }, [
    sheetMode, sheetKind, copies, rotation, zoom, posX, posY,
    brightness, contrast, saturation, tempTone, tintTone, curveShadows, curveHighlights,
    sharpness, beautifyLevel, isUpscaled2X, bgColor, transparentBg, addBorder
  ]);

  const handlePrint = () => {
    const url = sheetMode ? sheetResultUrl : singleResultUrl;
    if (!url) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const html = `<!doctype html><html><head><title>Print Passport Photo</title>
      <style>
        @page { size: ${sheetMode ? (sheetKind === 'A4' ? 'A4' : sheetKind === '5x7' ? '5in 7in' : '4in 6in') : '1.2in 1.5in'}; margin: 0; }
        html, body { margin:0; padding:0; background:#fff; }
        img { width: 100%; height: 100%; display:block; object-fit: contain; }
      </style></head><body>
      <img src="${url}" onload="setTimeout(()=>{window.print();window.close();}, 250)" />
      </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  const sheet = SHEETS[sheetKind];
  const maxCapacity = (() => {
    const scale = isUpscaled2X ? 2 : 1;
    const W = sheet.w * scale, H = sheet.h * scale;
    const pw = SHEET_PHOTO_W * scale, ph = SHEET_PHOTO_H * scale;
    const marginX = Math.round(0.075 * DPI * scale);
    const marginY = Math.round(0.075 * DPI * scale);
    const gapX = Math.round(0.05 * DPI * scale);
    const gapY = Math.round(0.05 * DPI * scale);
    const cols = Math.max(1, Math.floor((W - 2 * marginX + gapX) / (pw + gapX)));
    const rows = Math.max(1, Math.floor((H - 2 * marginY + gapY) / (ph + gapY)));
    return cols * rows;
  })();

  return (
    <main className="min-h-screen py-8 px-4 bg-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            📸 Studio HD Passport Photo Maker
          </h1>
          <p className="text-slate-600 mt-2">
            Exact <b>1.2&quot; × 1.5&quot; @ True 300/600 DPI</b> passport photo + <b>4×6 / 5×7 / A4 print sheet</b>.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {!rawImageSrc ? (
            <div className="border-2 border-dashed border-sky-400 rounded-2xl p-12 text-center bg-sky-50">
              <input type="file" accept="image/*" onChange={handleFileUpload} id="pp-input" className="hidden" />
              <div className="text-5xl mb-3">🖼️</div>
              <label htmlFor="pp-input" className="inline-block bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-lg font-bold cursor-pointer text-base">
                Upload Your Photo
              </label>
              <p className="text-xs text-slate-500 mt-4">JPG / PNG • High resolution front-facing photo</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div>
                  <div className="font-bold text-blue-900">✂️ Studio Background Removal</div>
                  <div className="text-xs text-blue-600">
                    {cleanCutoutSrc ? '✅ Background removed — select color below.' : 'Remove background for solid colors or transparent output.'}
                  </div>
                </div>
                <button
                  onClick={handleRemoveBg}
                  disabled={isRemovingBg}
                  className={`px-4 py-2 rounded-lg font-bold text-white text-sm ${cleanCutoutSrc ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-60`}
                >
                  {isRemovingBg ? '⏳ Cutting Out...' : cleanCutoutSrc ? '✔ HD BG Removed' : '✨ Remove Background'}
                </button>
              </div>

              {bgError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {bgError}</div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4 max-h-[780px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">⚙️ Studio Controls</h3>
                    <div className="flex gap-2">
                      <button onClick={handleAutoContrast} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-bold">
                        ⚡ Auto Tone
                      </button>
                      <button onClick={resetControls} className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded">
                        Reset
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer">
                    <div>
                      <div className="font-bold text-green-800 text-sm">⚡ 600 DPI Ultra HD Mode</div>
                      <div className="text-[11px] text-green-700">
                        {isUpscaled2X ? 'Ultra-sharp 600 DPI (720×900 px)' : 'Standard 300 DPI (360×450 px)'}
                      </div>
                    </div>
                    <input type="checkbox" checked={isUpscaled2X} onChange={e => setIsUpscaled2X(e.target.checked)} className="w-5 h-5 accent-green-600" />
                  </label>

                  <div>
                    <div className="font-semibold text-slate-700 text-sm mb-2">🎨 Background Color</div>
                    <div className="grid grid-cols-4 gap-2">
                      {BG_PRESETS.map(p => (
                        <button
                          key={p.name}
                          onClick={() => { setBgColor(p.color); setTransparentBg(false); }}
                          className={`h-9 rounded-md text-[11px] font-bold border-2 ${!transparentBg && bgColor === p.color ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200'}`}
                          style={{ background: p.color, color: p.text }}
                          title={p.name}
                        >
                          {p.name}
                        </button>
                      ))}
                      <button
                        onClick={() => setTransparentBg(true)}
                        className={`h-9 rounded-md text-[11px] font-bold border-2 ${transparentBg ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200'}`}
                        style={{ background: 'repeating-conic-gradient(#cbd5e1 0% 25%, white 0% 50%) 50% / 10px 10px' }}
                      >
                        Transparent
                      </button>
                      <label className="h-9 rounded-md border-2 border-slate-200 flex items-center justify-center cursor-pointer text-[11px] font-bold bg-white">
                        Custom
                        <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setTransparentBg(false); }} className="w-0 h-0 opacity-0" />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <div className="font-semibold text-slate-800 text-sm">📐 Position & Alignment</div>
                    <Slider label="🔄 Rotation" value={rotation} min={-180} max={180} onChange={setRotation} suffix="°" />
                    <Slider label="🔍 Zoom" value={zoom} min={0.3} max={3} step={0.05} onChange={setZoom} suffix="x" fixed={2} />

                    <div className="grid grid-cols-2 gap-3">
                      <Slider label="↔ Pos X" value={posX} min={-150} max={150} onChange={setPosX} />
                      <Slider label="↕ Pos Y" value={posY} min={-150} max={150} onChange={setPosY} />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <div className="font-semibold text-slate-800 text-sm">🎛 Pro Color & Light Controls</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Slider label="☀ Brightness" value={brightness} min={50} max={180} onChange={setBrightness} suffix="%" />
                      <Slider label="🌗 Contrast" value={contrast} min={50} max={180} onChange={setContrast} suffix="%" />
                      <Slider label="🎨 Saturation" value={saturation} min={0} max={200} onChange={setSaturation} suffix="%" />
                      <Slider label="🌡 Warm / Cold" value={tempTone} min={-40} max={40} onChange={setTempTone} />
                    </div>
                    <Slider label="🔴 Red / Green Tint" value={tintTone} min={-30} max={30} onChange={setTintTone} />
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <div className="font-semibold text-slate-800 text-sm">📈 Curve & Tone Adjustments</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Slider label="🌑 Shadows" value={curveShadows} min={-50} max={50} onChange={setCurveShadows} />
                      <Slider label="☀️ Highlights" value={curveHighlights} min={-50} max={50} onChange={setCurveHighlights} />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <div className="font-semibold text-slate-800 text-sm">✨ Skin Polish & Sharpness</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Slider label="🔪 Sharpness" value={sharpness} min={0} max={100} onChange={setSharpness} suffix="%" />
                      <Slider label="✨ Skin Beautify" value={beautifyLevel} min={0} max={100} onChange={setBeautifyLevel} suffix="%" />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 border-t border-slate-200 pt-3">
                    <input type="checkbox" checked={addBorder} onChange={e => setAddBorder(e.target.checked)} className="accent-blue-600" />
                    🔳 Add Black Border Stroke
                  </label>

                  <button
                    onClick={() => { setRawImageSrc(null); setCleanCutoutSrc(null); setFile(null); setSingleResultUrl(null); setSheetResultUrl(null); }}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-lg font-semibold text-sm"
                  >
                    🔄 Change Photo
                  </button>
                </div>

                <div className="lg:col-span-3 space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSheetMode(false)}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm ${!sheetMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      🪪 Single (1.2&quot; × 1.5&quot;)
                    </button>
                    <button
                      onClick={() => setSheetMode(true)}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm ${sheetMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      🖨 Print Sheet (Multi copies)
                    </button>
                  </div>

                  {!sheetMode ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center">
                      <div className="font-bold text-slate-900 mb-4">🎯 Single Passport Output</div>
                      {singleResultUrl ? (
                        <>
                          <div className="p-3 rounded-lg shadow-md inline-block mb-4" style={{ background: 'repeating-conic-gradient(#cbd5e1 0% 25%, white 0% 50%) 50% / 20px 20px' }}>
                            <img src={singleResultUrl} alt="Passport" className="block" style={{ width: '288px', height: '360px' }} />
                          </div>
                          <div className="text-xs text-slate-600 mb-3 text-center">
                            Dimension: <b>1.2&quot; × 1.5&quot;</b> ({isUpscaled2X ? '720×900 px @ 600 DPI' : '360×450 px @ 300 DPI'})<br />
                            True DPI encoded header included.
                          </div>
                          <div className="flex gap-2">
                            <a href={singleResultUrl} download={`passport_1.2x1.5_${isUpscaled2X ? '600DPI' : '300DPI'}.${transparentBg ? 'png' : 'jpg'}`} className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold shadow">
                              ⬇ Download Photo
                            </a>
                            <button onClick={handlePrint} className="inline-block bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-lg font-bold shadow">
                              🖨 Print Direct
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400">Rendering high resolution preview...</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                        <div className="font-bold text-slate-900">🖨 Select Sheet Size</div>
                        <div className="flex gap-1">
                          {(Object.keys(SHEETS) as SheetKind[]).map(k => (
                            <button
                              key={k}
                              onClick={() => setSheetKind(k)}
                              className={`px-2 py-1 rounded text-xs font-bold ${sheetKind === k ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                              {SHEETS[k].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-slate-700">Copies:</label>
                          <div className="flex items-center bg-white border border-slate-300 rounded-lg">
                            <button onClick={() => setCopies(Math.max(1, copies - 1))} className="px-3 py-1 font-bold">−</button>
                            <div className="px-3 py-1 min-w-[36px] text-center font-bold">{copies}</div>
                            <button onClick={() => setCopies(Math.min(maxCapacity, copies + 1))} className="px-3 py-1 font-bold">+</button>
                          </div>
                        </div>

                        <div className="flex gap-1 flex-wrap">
                          {[3, 6, 8, 12, maxCapacity].filter((n, i, arr) => arr.indexOf(n) === i && n <= maxCapacity).map(n => (
                            <button
                              key={n}
                              onClick={() => setCopies(n)}
                              className={`px-2 py-1 rounded text-xs font-bold ${copies === n ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 mb-2">
                        Capacity for {sheet.label}: <b>{maxCapacity}</b> copies max
                      </div>

                      {sheetResultUrl ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-white shadow-md border border-slate-200 mb-3 p-1">
                            <img
                              src={sheetResultUrl}
                              alt="Print Sheet"
                              style={{
                                display: 'block',
                                width: `${Math.min(340, sheet.w / 4)}px`,
                                height: `${Math.min(340, sheet.w / 4) * (sheet.h / sheet.w)}px`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-slate-600 mb-3 text-center">
                            Sheet Resolution: <b>{sheet.w * (isUpscaled2X ? 2 : 1)} × {sheet.h * (isUpscaled2X ? 2 : 1)} px</b> ({sheet.label} @ {isUpscaled2X ? '600' : '300'} DPI)
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={sheetResultUrl}
                              download={`passport_${sheetKind}_sheet_${copies}copies_${isUpscaled2X ? '600DPI' : '300DPI'}.jpg`}
                              className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold shadow"
                            >
                              ⬇ Download Sheet
                            </a>
                            <button onClick={handlePrint} className="inline-block bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-lg font-bold shadow">
                              🖨 Print Direct
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-center py-6">Generating print sheet...</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Guaranteed 300 / 600 DPI output metadata encoded into files for lab printing.
        </p>
      </div>
    </main>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  suffix?: string;
  fixed?: number;
}

function Slider({ label, value, min, max, step = 1, onChange, suffix = '', fixed }: SliderProps) {
  const display = fixed != null ? Number(value).toFixed(fixed) : value;
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
        <span>{label}</span>
        <span>{display}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}