'use client';

import React, { useState, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, Download, Layers, Loader2, RefreshCw, Move } from 'lucide-react';
import { toPng } from 'html-to-image';

interface Props {
  onBack: () => void;
}

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function TextBehindImageTool({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [cutout, setCutout] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imgWidth, setImgWidth] = useState(0);

  const [text, setText] = useState('NYX WEB');
  const [textSize, setTextSize] = useState(120);
  const [textColor, setTextColor] = useState('#ffffff');
  
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const previewRef = useRef<HTMLDivElement>(null);

  const runRemoval = async (source: File) => {
    setError(null);
    setCutout(null);
    setProgress(0);
    setProcessing(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(source, {
        model: 'isnet_quint8',
        output: { format: 'image/png' },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.min(100, Math.round((current / total) * 100)));
        },
      });
      setCutout(await readAsDataUrl(blob));
    } catch (err) {
      console.error('Background removal failed:', err);
      setError('Background removal failed. Please check your internet connection and click Retry.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setImage(await readAsDataUrl(selected));
    setOffsetX(0);
    setOffsetY(0);
    runRemoval(selected);
  };

  const handleDownload = () => {
    if (!previewRef.current) return;
    toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'text-behind-image.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Download failed:', err);
        alert('Image download failed.');
      });
  };

  const fontPx = imgWidth ? (textSize / 600) * imgWidth : textSize;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Text Behind Image</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
              Creative
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Place bold typography behind the main subject of your photo for a stunning editorial look.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-6 mt-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-800/50">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="behind-text-upload"
            />
            <label htmlFor="behind-text-upload" className="cursor-pointer flex flex-col items-center">
              <ImageIcon className="w-8 h-8 text-purple-500 mb-2" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {image ? 'Change Photo' : 'Upload Subject Photo'}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Typography Text
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Font Size: {textSize}
            </label>
            <input
              type="range"
              min="60"
              max="220"
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          {/* Manual Position Adjusters */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Move className="w-3.5 h-3.5" /> Manual Position
              </span>
              <button
                onClick={() => { setOffsetX(0); setOffsetY(0); }}
                className="text-[10px] text-purple-600 hover:underline font-medium"
              >
                Reset
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Horizontal (X): {offsetX}px</span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Vertical (Y): {offsetY}px</span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Text Color</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={!image || !cutout || processing}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer text-xs"
          >
            <Download className="w-4 h-4" /> Download Artwork
          </button>
        </div>

        {/* Preview */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden min-h-[400px]">
          {!image ? (
            <div className="text-center text-slate-400 p-8">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-xs">Upload an image to preview the text-behind effect.</p>
            </div>
          ) : (
            <>
              <div
                ref={previewRef}
                className="relative inline-block max-w-full overflow-hidden rounded-xl shadow-2xl bg-black"
              >
                <img
                  src={image}
                  alt="Background base"
                  className="block max-w-full max-h-[500px]"
                  onLoad={(e) => setImgWidth(e.currentTarget.clientWidth)}
                />

                {cutout && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <span
                      style={{
                        fontSize: `${fontPx}px`,
                        color: textColor,
                        lineHeight: 1,
                        transform: `translate(${offsetX}px, ${offsetY}px)`,
                      }}
                      className="font-black uppercase tracking-wider text-center whitespace-nowrap transition-transform"
                    >
                      {text}
                    </span>
                  </div>
                )}

                {cutout && (
                  <img
                    src={cutout}
                    alt="Subject cutout"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                )}

                {processing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span className="text-xs font-medium">
                      {progress > 0 ? `Preparing... ${progress}%` : 'Preparing...'}
                    </span>
                  </div>
                )}
              </div>

              {processing && (
                <p className="mt-4 text-xs text-slate-500">
                  Downloading AI model for the first time, please wait a moment.
                </p>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-xs text-rose-500">{error}</p>
                  <button
                    onClick={() => file && runRemoval(file)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}