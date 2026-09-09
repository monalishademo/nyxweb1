'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Barcode, Download, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF14' | 'MSI' | 'pharmacode';

const FORMATS: { value: BarcodeFormat; label: string }[] = [
  { value: 'CODE128', label: 'CODE128 (general purpose)' },
  { value: 'EAN13', label: 'EAN-13 (retail products)' },
  { value: 'UPC', label: 'UPC (US retail)' },
  { value: 'CODE39', label: 'CODE39' },
  { value: 'ITF14', label: 'ITF-14 (shipping)' },
  { value: 'MSI', label: 'MSI' },
  { value: 'pharmacode', label: 'Pharmacode' },
];

interface BarcodeGeneratorProps {
  onBack?: () => void;
}

export default function BarcodeGeneratorTool({ onBack }: BarcodeGeneratorProps) {
  const [text, setText] = useState<string>('123456789012');
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generate = async () => {
      if (!text.trim() || !canvasRef.current) return;
      try {
        const JsBarcode = (await import('jsbarcode')).default;
        JsBarcode(canvasRef.current, text, {
          format,
          lineColor: '#0f172a',
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10,
        });
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage(
          err?.message?.includes('is not a function') || err?.message?.includes('Cannot find module')
            ? 'jsbarcode package not found. Run: npm install jsbarcode'
            : `Invalid value for ${format} format: ${err?.message || 'unknown error'}`
        );
      }
    };
    generate();
  }, [text, format]);

  const downloadBarcode = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcode-${text || 'output'}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Barcode Generator
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                UTILITY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Generate scannable barcodes in common retail and shipping formats
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Barcode className="w-3.5 h-3.5 text-indigo-500" />
                Text / Number *
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter code to encode"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Barcode Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all cursor-pointer text-slate-800 dark:text-slate-200"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column Output Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[420px] flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Barcode Preview
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-inner min-h-[240px]">
                <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
              </div>
            </div>

            <button
              onClick={downloadBarcode}
              disabled={!!errorMessage}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer mt-6"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}