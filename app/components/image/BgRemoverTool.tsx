'use client';

import React, { useState } from 'react';
import BackButton from '../BackButton';

export default function BgRemoverTool({ onBack }: { onBack: () => void }) {
  const [bgOriginalUrl, setBgOriginalUrl] = useState<string | null>(null);
  const [bgRemovedResult, setBgRemovedResult] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBgRemovalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const originalUrl = URL.createObjectURL(file);
    setBgOriginalUrl(originalUrl);
    setBgRemovedResult(null);
    setErrorMessage(null);
    setIsRemovingBg(true);
    setProgressText('Initializing AI Engine...');

    try {
      // Dynamic import
      const { removeBackground } = await import('@imgly/background-removal');

      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const percent = Math.round((current / total) * 100);
            setProgressText(`Processing AI Assets (${percent}%)...`);
          } else {
            setProgressText('Removing background, please wait...');
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setBgRemovedResult(url);
    } catch (err: any) {
      console.error('BG Removal Error:', err);
      setErrorMessage(
        'Failed to process image. Please make sure you are online (for initial AI model fetch) and use a clear photo.'
      );
    } finally {
      setIsRemovingBg(false);
      setProgressText('');
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '900px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />
      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>✂️</span> AI Background Remover
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Upload any photo to instantly remove its background right inside your browser for free.
      </p>

      <div style={{ border: '2px dashed #f97316', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', backgroundColor: '#fff7ed', marginBottom: '25px' }}>
        <input type="file" accept="image/*" onChange={handleBgRemovalUpload} id="bg-remove-input" style={{ display: 'none' }} />
        <label htmlFor="bg-remove-input" style={{ backgroundColor: '#ea580c', color: 'white', padding: '14px 28px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block', fontSize: '15px', boxShadow: '0 4px 12px rgba(234,88,12,0.2)' }}>
          📁 Choose Image File
        </label>
        <p style={{ margin: '12px 0 0 0', color: '#9a3412', fontSize: '12px' }}>Supports JPG, PNG, WEBP</p>
      </div>

      {isRemovingBg && (
        <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>⚡</div>
          <p style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>{progressText}</p>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', fontWeight: '600' }}>
          ❌ {errorMessage}
        </div>
      )}

      {bgOriginalUrl && !isRemovingBg && !errorMessage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', textAlign: 'center', marginTop: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ color: '#334155', margin: '0 0 15px 0' }}>Original Image</h4>
            <img src={bgOriginalUrl} alt="Original" style={{ maxWidth: '100%', height: '220px', objectFit: 'contain', borderRadius: '8px' }} />
          </div>

          <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ color: '#334155', margin: '0 0 15px 0' }}>Background Removed</h4>
            {bgRemovedResult ? (
              <div>
                <img src={bgRemovedResult} alt="Clean" style={{ maxWidth: '100%', height: '220px', objectFit: 'contain', borderRadius: '8px', background: 'repeating-conic-gradient(#cbd5e1 0% 25%, white 0% 50%) 50% / 16px 16px' }} />
                <a href={bgRemovedResult} download="cutout_image.png" style={{ display: 'inline-block', marginTop: '15px', backgroundColor: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 10px rgba(22,163,74,0.2)' }}>
                  ⬇️ Download Clean PNG
                </a>
              </div>
            ) : (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                Processing result...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}