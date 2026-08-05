'use client';

import React, { useState, useRef, useEffect } from 'react';
import BackButton from '../BackButton';

// Requires: npm install jsbarcode
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

export default function BarcodeGeneratorTool({ onBack }: { onBack: () => void }) {
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
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '650px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />
      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>📊</span> Barcode Generator
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Generate scannable barcodes in common retail and shipping formats.
      </p>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Text / Number</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter code to encode"
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {errorMessage && (
        <div style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', fontWeight: '600' }}>
          ❌ {errorMessage}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '25px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={downloadBarcode}
          disabled={!!errorMessage}
          style={{ backgroundColor: '#334155', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: errorMessage ? 'not-allowed' : 'pointer', opacity: errorMessage ? 0.5 : 1 }}
        >
          ⬇️ Download PNG
        </button>
      </div>
    </div>
  );
}
