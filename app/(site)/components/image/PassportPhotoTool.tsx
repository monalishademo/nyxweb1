'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_UPLOAD_MB = 12;
const RENDER_DEBOUNCE_MS = 120;
const SS = 2; // supersampling factor used while compositing
const PREVIEW_W = 288; // css px width of the single-photo preview

const mmToPx = (mm: number, dpi: number) => Math.round((mm / 25.4) * dpi);
const inToMm = (i: number) => i * 25.4;

type SheetKind = '4x6' | '5x7' | 'A4';

// Sheet sizes in millimetres (exact), so pixel sizes are exact at any DPI
const SHEETS: Record<SheetKind, { w: number; h: number; label: string }> = {
  '4x6': { w: inToMm(4), h: inToMm(6), label: '4×6 inch' },
  '5x7': { w: inToMm(5), h: inToMm(7), label: '5×7 inch' },
  A4: { w: 210, h: 297, label: 'A4' },
};

const PHOTO_SIZES = [
  { id: '1.2x1.5in', label: '1.2″ × 1.5″', w: inToMm(1.2), h: inToMm(1.5) },
  { id: '35x45', label: '35 × 45 mm', w: 35, h: 45 },
  { id: '45x55', label: '45 × 55 mm', w: 45, h: 55 },
  { id: '2x2in', label: '2″ × 2″', w: inToMm(2), h: inToMm(2) },
  { id: 'custom', label: 'Custom (mm)', w: 0, h: 0 },
] as const;
type SizeId = (typeof PHOTO_SIZES)[number]['id'];

const BG_PRESETS = [
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

/** All image adjustments live in one object -> one dependency, less boilerplate. */
interface Adj {
  rotation: number;
  zoom: number;
  posX: number; // % of photo width
  posY: number; // % of photo height
  brightness: number;
  contrast: number;
  saturation: number;
  red: number;
  green: number;
  blue: number;
  temp: number;
  tint: number;
  shadows: number;
  mids: number;
  highs: number;
  sharpness: number;
  beautify: number;
}
const DEFAULT_ADJ: Adj = {
  rotation: 0, zoom: 1, posX: 0, posY: 0,
  brightness: 0, contrast: 0, saturation: 0,
  red: 0, green: 0, blue: 0, temp: 0, tint: 0,
  shadows: 0, mids: 0, highs: 0,
  sharpness: 15, beautify: 10,
};

/* ------------------------------------------------------------------ */
/*  File metadata: write the REAL DPI into JPEG (JFIF) and PNG (pHYs)  */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * JFIF layout (APP0 starts at offset 2):
 *  2-3 FFE0 | 4-5 length | 6-10 "JFIF\0" | 11-12 version | 13 units | 14-15 Xdens | 16-17 Ydens
 * The old code wrote the units byte at the wrong offset and corrupted the header,
 * which is why prints came out at the wrong physical size.
 */
function patchJpegDpi(buf: Uint8Array, dpi: number): Uint8Array {
  const hi = (dpi >> 8) & 0xff;
  const lo = dpi & 0xff;
  const isJfif =
    buf[2] === 0xff && buf[3] === 0xe0 &&
    buf[6] === 0x4a && buf[7] === 0x46 && buf[8] === 0x49 && buf[9] === 0x46 && buf[10] === 0;
  if (isJfif) {
    const out = buf.slice();
    out[13] = 1; // dots per inch
    out[14] = hi; out[15] = lo;
    out[16] = hi; out[17] = lo;
    return out;
  }
  // No JFIF header: insert one right after SOI
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x01, 0x01, hi, lo, hi, lo, 0x00, 0x00,
  ]);
  const out = new Uint8Array(buf.length + app0.length);
  out.set(buf.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(buf.subarray(2), 2 + app0.length);
  return out;
}

function patchPngDpi(buf: Uint8Array, dpi: number): Uint8Array {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21); // len(4) + type(4) + data(9) + crc(4)
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  dv.setUint32(8, ppm);
  dv.setUint32(12, ppm);
  chunk[16] = 1; // unit: metre
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const at = 33; // 8 signature + 25 IHDR chunk
  const out = new Uint8Array(buf.length + chunk.length);
  out.set(buf.subarray(0, at), 0);
  out.set(chunk, at);
  out.set(buf.subarray(at), at + chunk.length);
  return out;
}

const canvasToBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode image'))), type, q)
  );

async function encodeWithDpi(canvas: HTMLCanvasElement, png: boolean, dpi: number): Promise<Blob> {
  const blob = await canvasToBlob(canvas, png ? 'image/png' : 'image/jpeg', 0.98);
  const buf = new Uint8Array(await blob.arrayBuffer());
  const patched = png ? patchPngDpi(buf, dpi) : patchJpegDpi(buf, dpi);
  return new Blob([patched as BlobPart], { type: blob.type });
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** Cross-browser blur (ctx.filter is missing in some Safari versions): down/up-scale. */
function blurCanvas(src: HTMLCanvasElement, factor: number) {
  const f = Math.max(1, factor);
  const small = makeCanvas(Math.max(1, Math.round(src.width / f)), Math.max(1, Math.round(src.height / f)));
  const sctx = small.getContext('2d')!;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(src, 0, 0, small.width, small.height);
  const big = makeCanvas(src.width, src.height);
  const bctx = big.getContext('2d')!;
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}

/** Real 3x3 sharpen (unsharp style). amount 0..1 */
function sharpen(canvas: HTMLCanvasElement, amount: number) {
  const ctx = canvas.getContext('2d')!;
  const { width: w, height: h } = canvas;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  dst.data.set(src.data);
  const s = src.data;
  const d = dst.data;
  const a = amount * 0.9;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (s[i + 3] === 0) continue;
      for (let c = 0; c < 3; c++) {
        const k = i + c;
        d[k] = (1 + 4 * a) * s[k] - a * (s[k - 4] + s[k + 4] + s[k - w * 4] + s[k + w * 4]);
      }
    }
  }
  ctx.putImageData(dst, 0, 0);
}

interface RenderOpts {
  adj: Adj;
  bgColor: string;
  transparent: boolean;
  border: boolean;
}

function renderPhoto(img: HTMLImageElement, pw: number, ph: number, o: RenderOpts): HTMLCanvasElement {
  const { adj } = o;
  const iw = pw * SS;
  const ih = ph * SS;
  const inner = makeCanvas(iw, ih);
  const ictx = inner.getContext('2d', { willReadFrequently: true })!;
  ictx.imageSmoothingEnabled = true;
  ictx.imageSmoothingQuality = 'high';

  if (!o.transparent) {
    ictx.fillStyle = o.bgColor;
    ictx.fillRect(0, 0, iw, ih);
  }

  // "cover" fit, then user zoom / rotation / offset (offset is resolution independent: %)
  const baseScale = img.width / img.height > iw / ih ? ih / img.height : iw / img.width;
  const scale = baseScale * adj.zoom;
  ictx.save();
  ictx.translate(iw / 2 + (adj.posX / 100) * iw, ih / 2 + (adj.posY / 100) * ih);
  ictx.rotate((adj.rotation * Math.PI) / 180);
  ictx.scale(scale, scale);
  ictx.drawImage(img, -img.width / 2, -img.height / 2);
  ictx.restore();

  // Tone LUTs
  const lutR = new Uint8ClampedArray(256);
  const lutG = new Uint8ClampedArray(256);
  const lutB = new Uint8ClampedArray(256);
  const cFactor = (259 * (adj.contrast + 255)) / (255 * (259 - adj.contrast));
  const bShift = adj.brightness * 2.55;
  const rShift = adj.red * 2 + adj.temp * 1.5 + adj.tint * 0.8;
  const gShift = adj.green * 2 - adj.tint * 1.2;
  const bShiftC = adj.blue * 2 - adj.temp * 1.8;
  for (let i = 0; i < 256; i++) {
    let val = cFactor * (i - 128) + 128 + bShift;
    const norm = Math.min(1, Math.max(0, val / 255));
    const bell = Math.sin(norm * Math.PI);
    val += (norm < 0.5 ? adj.shadows : adj.highs) * bell * 0.8;
    val += adj.mids * bell * 0.5;
    lutR[i] = val + rShift;
    lutG[i] = val + gShift;
    lutB[i] = val + bShiftC;
  }

  const imgData = ictx.getImageData(0, 0, iw, ih);
  const px = imgData.data;
  const satMult = (adj.saturation + 100) / 100;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    let r = lutR[px[i]];
    let g = lutG[px[i + 1]];
    let b = lutB[px[i + 2]];
    if (adj.saturation !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + satMult * (r - gray);
      g = gray + satMult * (g - gray);
      b = gray + satMult * (b - gray);
    }
    px[i] = r; px[i + 1] = g; px[i + 2] = b; // Uint8ClampedArray clamps for us
  }
  ictx.putImageData(imgData, 0, 0);

  // Skin smoothing: soft-light blend of a blurred copy
  if (adj.beautify > 0) {
    const bl = adj.beautify / 100;
    const blurred = blurCanvas(inner, 1 + bl * 4 * SS);
    ictx.save();
    ictx.globalAlpha = bl * 0.45;
    ictx.globalCompositeOperation = 'soft-light';
    ictx.drawImage(blurred, 0, 0);
    ictx.restore();
  }

  // Downscale to the exact target pixel size
  const out = makeCanvas(pw, ph);
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(inner, 0, 0, pw, ph);

  if (adj.sharpness > 0) sharpen(out, adj.sharpness / 100);

  if (o.border) {
    const bw = Math.max(2, Math.round(pw / 120));
    octx.strokeStyle = '#000';
    octx.lineWidth = bw;
    octx.strokeRect(bw / 2, bw / 2, pw - bw, ph - bw);
  }
  return out;
}

/** Best grid for the sheet; tries both portrait and landscape and keeps the one that fits more. */
function computeLayout(sheet: { w: number; h: number }, pw: number, ph: number, dpi: number) {
  const margin = mmToPx(4, dpi);
  const gap = mmToPx(1.5, dpi);
  const tries = [false, true].map((land) => {
    const W = mmToPx(land ? sheet.h : sheet.w, dpi);
    const H = mmToPx(land ? sheet.w : sheet.h, dpi);
    const cols = Math.max(0, Math.floor((W - 2 * margin + gap) / (pw + gap)));
    const rows = Math.max(0, Math.floor((H - 2 * margin + gap) / (ph + gap)));
    return { W, H, cols, rows, cap: cols * rows, land, gap };
  });
  return tries[1].cap > tries[0].cap ? tries[1] : tries[0];
}

/** Downscale very large uploads before sending (Vercel functions accept ~4.5 MB bodies). */
async function shrinkForUpload(src: string, maxSide = 2400): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Could not read image'));
    i.src = src;
  });
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const c = makeCanvas(Math.round(img.width * k), Math.round(img.height * k));
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return canvasToBlob(c, 'image/jpeg', 0.92);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function App() {
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cleanCutoutSrc, setCleanCutoutSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [adj, setAdj] = useState<Adj>(DEFAULT_ADJ);
  const [dpi, setDpi] = useState<300 | 600>(300);
  const [showGuide, setShowGuide] = useState(true);
  const [addBorder, setAddBorder] = useState(true);

  const [sizeId, setSizeId] = useState<SizeId>('1.2x1.5in');
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);

  const [sheetMode, setSheetMode] = useState(false);
  const [sheetKind, setSheetKind] = useState<SheetKind>('4x6');
  const [copies, setCopies] = useState(8);

  const [singleUrl, setSingleUrl] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  const originalUrlRef = useRef<string | null>(null);
  const cutoutUrlRef = useRef<string | null>(null);
  const resultUrls = useRef<{ single?: string; sheet?: string }>({});
  const renderId = useRef(0);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const activeSrc = cleanCutoutSrc || rawImageSrc;
  const set = (k: keyof Adj) => (v: number) => setAdj((a) => ({ ...a, [k]: v }));

  /* ---- derived sizes (single source of truth for UI + rendering) ---- */
  const photoMm = useMemo(() => {
    if (sizeId === 'custom') {
      return { w: Math.min(100, Math.max(15, customW || 35)), h: Math.min(100, Math.max(15, customH || 45)) };
    }
    const p = PHOTO_SIZES.find((s) => s.id === sizeId)!;
    return { w: p.w, h: p.h };
  }, [sizeId, customW, customH]);
  const pw = mmToPx(photoMm.w, dpi);
  const ph = mmToPx(photoMm.h, dpi);
  const layout = useMemo(() => computeLayout(SHEETS[sheetKind], pw, ph, dpi), [sheetKind, pw, ph, dpi]);
  const effectiveCopies = Math.min(copies, layout.cap);
  const sheetPxW = layout.W;
  const sheetPxH = layout.H;

  /* ---- cleanup ---- */
  useEffect(() => {
    return () => {
      [originalUrlRef.current, cutoutUrlRef.current, resultUrls.current.single, resultUrls.current.sheet].forEach(
        (u) => u && URL.revokeObjectURL(u)
      );
    };
  }, []);

  /* ---- load image element whenever the active source changes ---- */
  useEffect(() => {
    if (!activeSrc) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => {
      setUploadError('Could not load this image. The file may be corrupt — try another one.');
      setImg(null);
    };
    i.src = activeSrc;
  }, [activeSrc]);

  /* ---- debounced render of single + sheet outputs ---- */
  useEffect(() => {
    if (!img) return;
    setIsRendering(true);
    const id = ++renderId.current;
    const t = setTimeout(async () => {
      try {
        const opts: RenderOpts = { adj, bgColor, transparent: transparentBg, border: addBorder };
        const png = transparentBg;

        const single = renderPhoto(img, pw, ph, opts);
        const singleBlob = await encodeWithDpi(single, png, dpi);

        let sheetBlob: Blob | null = null;
        if (sheetMode && layout.cap > 0) {
          const { W, H, cols, rows, gap } = layout;
          const canvas = makeCanvas(W, H);
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, W, H);
          const n = Math.min(copies, cols * rows);
          const usedCols = Math.min(cols, n);
          const usedRows = Math.ceil(n / cols);
          const blockW = usedCols * pw + (usedCols - 1) * gap;
          const blockH = usedRows * ph + (usedRows - 1) * gap;
          const x0 = Math.round((W - blockW) / 2);
          const y0 = Math.round((H - blockH) / 2);
          for (let k = 0; k < n; k++) {
            const r = Math.floor(k / cols);
            const c = k % cols;
            ctx.drawImage(single, x0 + c * (pw + gap), y0 + r * (ph + gap));
          }
          sheetBlob = await encodeWithDpi(canvas, false, dpi);
        }

        if (id !== renderId.current) return; // a newer render superseded this one

        const old = { ...resultUrls.current };
        resultUrls.current.single = URL.createObjectURL(singleBlob);
        setSingleUrl(resultUrls.current.single);
        if (sheetBlob) {
          resultUrls.current.sheet = URL.createObjectURL(sheetBlob);
          setSheetUrl(resultUrls.current.sheet);
        }
        setTimeout(() => {
          if (old.single) URL.revokeObjectURL(old.single);
          if (old.sheet && sheetBlob) URL.revokeObjectURL(old.sheet);
        }, 1000);
        setUploadError(null);
      } catch (e: any) {
        if (id === renderId.current) setUploadError(e?.message || 'Rendering failed');
      } finally {
        if (id === renderId.current) setIsRendering(false);
      }
    }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [img, adj, bgColor, transparentBg, addBorder, dpi, pw, ph, sheetMode, layout, copies]);

  /* ---- upload ---- */
  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return setUploadError('Please upload an image file (JPG or PNG).');
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return setUploadError(`File must be smaller than ${MAX_UPLOAD_MB} MB.`);
    setUploadError(null);
    setBgError(null);
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (cutoutUrlRef.current) URL.revokeObjectURL(cutoutUrlRef.current);
    cutoutUrlRef.current = null;
    setCleanCutoutSrc(null);
    setSingleUrl(null);
    setSheetUrl(null);
    setAdj(DEFAULT_ADJ);
    setBgColor('#ffffff');
    setTransparentBg(false);
    originalUrlRef.current = URL.createObjectURL(f);
    setRawImageSrc(originalUrlRef.current);
  };

  const changePhoto = () => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (cutoutUrlRef.current) URL.revokeObjectURL(cutoutUrlRef.current);
    originalUrlRef.current = cutoutUrlRef.current = null;
    setRawImageSrc(null);
    setCleanCutoutSrc(null);
    setSingleUrl(null);
    setSheetUrl(null);
    setUploadError(null);
  };

  /* ---- background removal via server route (API key stays on the server) ---- */
  const handleRemoveBg = async () => {
    if (!rawImageSrc) return;
    setIsRemovingBg(true);
    setBgError(null);
    try {
      const small = await shrinkForUpload(rawImageSrc);
      const fd = new FormData();
      fd.append('image_file', small, 'photo.jpg');
      const resp = await fetch('/api/remove-bg', { method: 'POST', body: fd });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({} as any));
        throw new Error(j.error || 'Background removal failed');
      }
      const blob = await resp.blob();
      if (cutoutUrlRef.current) URL.revokeObjectURL(cutoutUrlRef.current);
      cutoutUrlRef.current = URL.createObjectURL(blob);
      setCleanCutoutSrc(cutoutUrlRef.current);
    } catch (e: any) {
      setBgError(e?.message || 'Background removal failed');
    } finally {
      setIsRemovingBg(false);
    }
  };

  /* ---- auto contrast (uses 1% / 99% percentiles, ignores outliers) ---- */
  const handleAutoContrast = () => {
    if (!img) return;
    const c = makeCanvas(120, 120);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, 120, 120);
    const d = ctx.getImageData(0, 0, 120, 120).data;
    const hist = new Uint32Array(256);
    let total = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 100) continue;
      hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++;
      total++;
    }
    if (!total) return;
    let acc = 0, lo = 0, hi = 255;
    for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * 0.01) { lo = i; break; } }
    acc = 0;
    for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= total * 0.01) { hi = i; break; } }
    if (hi <= lo) return;
    const contrast = Math.min(50, Math.max(0, Math.round(((255 - (hi - lo)) / 255) * 45)));
    const brightness = Math.round(((128 - (lo + hi) / 2) / 128) * 20);
    setAdj((a) => ({ ...a, contrast, brightness, shadows: -10, highs: 10, sharpness: 25 }));
  };

  /* ---- drag the preview to reposition ---- */
  const previewH = Math.round((PREVIEW_W * ph) / pw);
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: adj.posX, py: adj.posY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const nx = d.px + ((e.clientX - d.x) / PREVIEW_W) * 100;
    const ny = d.py + ((e.clientY - d.y) / previewH) * 100;
    setAdj((a) => ({ ...a, posX: Math.max(-100, Math.min(100, nx)), posY: Math.max(-100, Math.min(100, ny)) }));
  };
  const onPointerUp = () => { drag.current = null; };

  /* ---- print at exact physical size ---- */
  const handlePrint = () => {
    const url = sheetMode ? sheetUrl : singleUrl;
    if (!url) return;
    const pageMm = sheetMode
      ? layout.land ? `${SHEETS[sheetKind].h}mm ${SHEETS[sheetKind].w}mm` : `${SHEETS[sheetKind].w}mm ${SHEETS[sheetKind].h}mm`
      : `${photoMm.w}mm ${photoMm.h}mm`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Print</title><style>
      @page { size: ${pageMm}; margin: 0; }
      html, body { margin:0; padding:0; background:#fff; }
      img { width:100vw; height:100vh; display:block; object-fit:fill; }
    </style></head><body><img src="${url}" onload="setTimeout(()=>{window.print();window.close();},250)" /></body></html>`);
    win.document.close();
  };

  const ext = transparentBg ? 'png' : 'jpg';
  const sizeLabel = `${photoMm.w.toFixed(1)} × ${photoMm.h.toFixed(1)} mm`;
  const sheetPreviewW = 340;
  const sheetPreviewH = Math.round((sheetPreviewW * sheetPxH) / sheetPxW);

  /* ---------------------------------------------------------------- */

  return (
    <main className="min-h-screen py-8 px-4 bg-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">📸 Studio Pro Passport Photo Maker</h1>
          <p className="text-slate-600 mt-2">
            Exact size output with real <b>300 / 600 DPI</b> metadata, color balance and curves.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {!rawImageSrc ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${isDragOver ? 'border-sky-600 bg-sky-100' : 'border-sky-400 bg-sky-50'}`}
            >
              <input type="file" accept="image/*" id="pp-input" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }} />
              <div className="text-5xl mb-3">🖼️</div>
              <label htmlFor="pp-input" className="inline-block bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-lg font-bold cursor-pointer">
                Upload your photo
              </label>
              <p className="text-xs text-slate-500 mt-4">
                JPG / PNG • front-facing, high resolution • or drag and drop here (max {MAX_UPLOAD_MB} MB)
              </p>
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm max-w-md mx-auto">⚠️ {uploadError}</div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {uploadError}</div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div>
                  <div className="font-bold text-blue-900">✂️ Background removal</div>
                  <div className="text-xs text-blue-600">
                    {cleanCutoutSrc ? '✅ Background removed — pick a color below.' : 'Remove the background for a solid color or transparent PNG.'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {cleanCutoutSrc && (
                    <button onClick={() => setCleanCutoutSrc(null)} className="px-3 py-2 rounded-lg font-semibold text-sm bg-white border border-blue-200 text-blue-700">
                      Use original
                    </button>
                  )}
                  <button
                    onClick={handleRemoveBg}
                    disabled={isRemovingBg || !!cleanCutoutSrc}
                    className={`px-4 py-2 rounded-lg font-bold text-white text-sm ${cleanCutoutSrc ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-70`}
                  >
                    {isRemovingBg ? '⏳ Cutting out…' : cleanCutoutSrc ? '✔ Background removed' : '✨ Remove background'}
                  </button>
                </div>
              </div>
              {bgError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {bgError}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ---------------- controls ---------------- */}
                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4 max-h-[860px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">⚙️ Studio controls</h3>
                    <div className="flex gap-2">
                      <button onClick={handleAutoContrast} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-bold shadow">⚡ Auto contrast</button>
                      <button onClick={() => { setAdj(DEFAULT_ADJ); setBgColor('#ffffff'); setTransparentBg(false); }} className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded font-semibold">Reset</button>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-700 text-sm mb-2">📏 Photo size</div>
                    <select value={sizeId} onChange={(e) => setSizeId(e.target.value as SizeId)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                      {PHOTO_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    {sizeId === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="text-xs font-semibold text-slate-600">Width (mm)
                          <input type="number" min={15} max={100} value={customW} onChange={(e) => setCustomW(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-2 py-1 mt-1 bg-white" />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">Height (mm)
                          <input type="number" min={15} max={100} value={customH} onChange={(e) => setCustomH(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-2 py-1 mt-1 bg-white" />
                        </label>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer">
                    <div>
                      <div className="font-bold text-green-800 text-sm">⚡ 600 DPI ultra HD</div>
                      <div className="text-[11px] text-green-700">{pw} × {ph} px at {dpi} DPI</div>
                    </div>
                    <input type="checkbox" checked={dpi === 600} onChange={(e) => setDpi(e.target.checked ? 600 : 300)} className="w-5 h-5 accent-green-600" />
                  </label>

                  <label className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer">
                    <div>
                      <div className="font-bold text-purple-800 text-sm">🧭 Alignment guide</div>
                      <div className="text-[11px] text-purple-700">Head, eye and chin guide (preview only, never printed)</div>
                    </div>
                    <input type="checkbox" checked={showGuide} onChange={(e) => setShowGuide(e.target.checked)} className="w-5 h-5 accent-purple-600" />
                  </label>

                  <div>
                    <div className="font-semibold text-slate-700 text-sm mb-2">🎨 Background color</div>
                    <div className="grid grid-cols-4 gap-2">
                      {BG_PRESETS.map((p) => (
                        <button key={p.name} onClick={() => { setBgColor(p.color); setTransparentBg(false); }}
                          className={`h-9 rounded-md text-[11px] font-bold border-2 ${!transparentBg && bgColor === p.color ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200'}`}
                          style={{ background: p.color, color: p.text }} title={p.name}>{p.name}</button>
                      ))}
                      <button onClick={() => setTransparentBg(true)}
                        className={`h-9 rounded-md text-[11px] font-bold border-2 ${transparentBg ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200'}`}
                        style={{ background: 'repeating-conic-gradient(#cbd5e1 0% 25%, white 0% 50%) 50% / 10px 10px' }}>Transparent</button>
                      <label className="h-9 rounded-md border-2 border-slate-200 flex items-center justify-center cursor-pointer text-[11px] font-bold bg-white relative">
                        Custom
                        <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setTransparentBg(false); }}
                          className="absolute inset-0 opacity-0 cursor-pointer" />
                      </label>
                    </div>
                    {transparentBg && <p className="text-[11px] text-slate-500 mt-1">Transparent exports as PNG. The print sheet still uses a white background.</p>}
                  </div>

                  <Group title="📐 Position & alignment">
                    <Slider label="🔄 Rotation" value={adj.rotation} min={-45} max={45} step={0.5} onChange={set('rotation')} suffix="°" />
                    <Slider label="🔍 Zoom" value={adj.zoom} min={0.3} max={3} step={0.01} onChange={set('zoom')} suffix="x" fixed={2} />
                    <div className="grid grid-cols-2 gap-3">
                      <Slider label="↔ Pos X" value={adj.posX} min={-100} max={100} step={0.5} onChange={set('posX')} suffix="%" fixed={1} />
                      <Slider label="↕ Pos Y" value={adj.posY} min={-100} max={100} step={0.5} onChange={set('posY')} suffix="%" fixed={1} />
                    </div>
                    <button onClick={() => setAdj((a) => ({ ...a, zoom: 1, posX: 0, posY: 0, rotation: 0 }))}
                      className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded font-semibold">Re-center</button>
                    <p className="text-[11px] text-slate-500">Tip: drag the preview to move the photo.</p>
                  </Group>

                  <Group title="🎨 RGB color balance">
                    <Slider label="🔴 Red" value={adj.red} min={-50} max={50} onChange={set('red')} />
                    <Slider label="🟢 Green" value={adj.green} min={-50} max={50} onChange={set('green')} />
                    <Slider label="🔵 Blue" value={adj.blue} min={-50} max={50} onChange={set('blue')} />
                  </Group>

                  <Group title="🌡 Temperature & tint">
                    <Slider label="🟡 Warm / 🔵 Cold" value={adj.temp} min={-50} max={50} onChange={set('temp')} />
                    <Slider label="🟣 Magenta / 🟢 Green" value={adj.tint} min={-50} max={50} onChange={set('tint')} />
                  </Group>

                  <Group title="📈 Curves">
                    <Slider label="🌑 Shadows" value={adj.shadows} min={-50} max={50} onChange={set('shadows')} />
                    <Slider label="🔆 Midtones" value={adj.mids} min={-50} max={50} onChange={set('mids')} />
                    <Slider label="☀️ Highlights" value={adj.highs} min={-50} max={50} onChange={set('highs')} />
                  </Group>

                  <Group title="☀ Exposure & contrast">
                    <div className="grid grid-cols-2 gap-3">
                      <Slider label="☀ Brightness" value={adj.brightness} min={-50} max={50} onChange={set('brightness')} />
                      <Slider label="🌗 Contrast" value={adj.contrast} min={-50} max={50} onChange={set('contrast')} />
                    </div>
                    <Slider label="🎨 Saturation" value={adj.saturation} min={-100} max={100} onChange={set('saturation')} />
                  </Group>

                  <Group title="✨ Sharpness & skin smoothing">
                    <div className="grid grid-cols-2 gap-3">
                      <Slider label="🔪 Sharpness" value={adj.sharpness} min={0} max={100} onChange={set('sharpness')} suffix="%" />
                      <Slider label="✨ Beautify" value={adj.beautify} min={0} max={100} onChange={set('beautify')} suffix="%" />
                    </div>
                  </Group>

                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 border-t border-slate-200 pt-3">
                    <input type="checkbox" checked={addBorder} onChange={(e) => setAddBorder(e.target.checked)} className="accent-blue-600" />
                    🔳 Thin black border (helps cutting)
                  </label>

                  <button onClick={changePhoto} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-lg font-semibold text-sm">🔄 Change photo</button>
                </div>

                {/* ---------------- output ---------------- */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => setSheetMode(false)} className={`flex-1 py-2 rounded-lg font-bold text-sm ${!sheetMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>🪪 Single photo</button>
                    <button onClick={() => setSheetMode(true)} className={`flex-1 py-2 rounded-lg font-bold text-sm ${sheetMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>🖨 Print sheet</button>
                  </div>

                  {!sheetMode ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center">
                      <div className="font-bold text-slate-900 mb-4">🎯 Single photo output</div>
                      {singleUrl ? (
                        <>
                          <div
                            className="relative p-3 rounded-lg shadow-md inline-block mb-4 select-none"
                            style={{ background: 'repeating-conic-gradient(#cbd5e1 0% 25%, white 0% 50%) 50% / 20px 20px' }}
                          >
                            <div
                              className="relative cursor-grab active:cursor-grabbing touch-none"
                              style={{ width: PREVIEW_W, height: previewH }}
                              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                            >
                              <img src={singleUrl} alt="Passport preview" draggable={false} style={{ width: PREVIEW_W, height: previewH, display: 'block' }} />
                              {isRendering && (
                                <div className="absolute inset-0 bg-white/40 flex items-center justify-center pointer-events-none">
                                  <span className="text-xs font-bold text-slate-600">Updating…</span>
                                </div>
                              )}
                              {showGuide && (
                                <svg className="absolute inset-0 pointer-events-none" width={PREVIEW_W} height={previewH} viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <ellipse cx="50" cy="48" rx="26" ry="38" fill="none" stroke="#22c55e" strokeDasharray="2 2" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                                  <line x1="4" y1="42" x2="96" y2="42" stroke="#3b82f6" strokeDasharray="2 2" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                                  <line x1="4" y1="86" x2="96" y2="86" stroke="#f59e0b" strokeDasharray="2 2" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 mb-3 text-center">
                            Size: <b>{sizeLabel}</b> — <b>{pw} × {ph} px @ {dpi} DPI</b><br />
                            DPI is written into the file, so it prints at exactly this size.
                          </div>
                          <div className="flex gap-2">
                            <a href={singleUrl} download={`passport_${Math.round(photoMm.w)}x${Math.round(photoMm.h)}mm_${dpi}dpi.${ext}`}
                              className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold shadow">⬇ Download photo</a>
                            <button onClick={handlePrint} className="inline-block bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-lg font-bold shadow">🖨 Print</button>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400">Rendering preview…</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                        <div className="font-bold text-slate-900">🖨 Sheet size</div>
                        <div className="flex gap-1">
                          {(Object.keys(SHEETS) as SheetKind[]).map((k) => (
                            <button key={k} onClick={() => setSheetKind(k)}
                              className={`px-2 py-1 rounded text-xs font-bold ${sheetKind === k ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{SHEETS[k].label}</button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">Copies:</span>
                          <div className="flex items-center bg-white border border-slate-300 rounded-lg">
                            <button onClick={() => setCopies(Math.max(1, effectiveCopies - 1))} className="px-3 py-1 font-bold">−</button>
                            <div className="px-3 py-1 min-w-[36px] text-center font-bold">{effectiveCopies}</div>
                            <button onClick={() => setCopies(Math.min(layout.cap, effectiveCopies + 1))} className="px-3 py-1 font-bold">+</button>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {[3, 6, 8, 12, layout.cap].filter((n, i, a) => n > 0 && a.indexOf(n) === i && n <= layout.cap).map((n) => (
                            <button key={n} onClick={() => setCopies(n)}
                              className={`px-2 py-1 rounded text-xs font-bold ${effectiveCopies === n ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              {n === layout.cap ? `Fill (${n})` : n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {layout.cap === 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                          This photo size does not fit on {SHEETS[sheetKind].label}. Choose a larger sheet or a smaller photo.
                        </div>
                      ) : (
                        <>
                          <div className="text-[11px] text-slate-500 mb-2">
                            {SHEETS[sheetKind].label} holds up to <b>{layout.cap}</b> photos of {sizeLabel}
                            {layout.land ? ' (landscape layout chosen automatically)' : ''}.
                          </div>
                          {sheetUrl ? (
                            <div className="flex flex-col items-center">
                              <div className="relative bg-white shadow-md border border-slate-200 mb-3 p-1">
                                <img src={sheetUrl} alt="Print sheet" style={{ display: 'block', width: sheetPreviewW, height: sheetPreviewH }} />
                                {isRendering && (
                                  <div className="absolute inset-1 bg-white/60 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-600">Updating…</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-600 mb-3 text-center">
                                Sheet: <b>{sheetPxW} × {sheetPxH} px @ {dpi} DPI</b> ({SHEETS[sheetKind].label}).<br />
                                Print at <b>100% / Actual size</b> — turn off “Fit to page”.
                              </div>
                              <div className="flex gap-2">
                                <a href={sheetUrl} download={`passport_${sheetKind}_${effectiveCopies}copies_${dpi}dpi.jpg`}
                                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold shadow">⬇ Download sheet</a>
                                <button onClick={handlePrint} className="inline-block bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-lg font-bold shadow">🖨 Print</button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-center py-6">Generating print sheet…</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Output is encoded with true 300 / 600 DPI metadata for lab printing.
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-200 pt-3 space-y-3">
      <div className="font-semibold text-slate-800 text-sm">{title}</div>
      {children}
    </div>
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
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => onChange(label.includes('Zoom') ? 1 : label.includes('Sharp') ? 15 : label.includes('Beautify') ? 10 : 0)}
        aria-label={label}
        className="w-full accent-blue-600"
      />
    </div>
  );
}