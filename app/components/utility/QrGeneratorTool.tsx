'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import BackButton from '../BackButton';

export default function QrGeneratorTool({ onBack }: { onBack: () => void }) {
  const [qrType, setQrType] = useState<'url' | 'wifi' | 'text'>('url');
  const [text, setText] = useState<string>('https://google.com');
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [wifiSecurity, setWifiSecurity] = useState<string>('WPA');

  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [size, setSize] = useState<number>(256);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [text, wifiSsid, wifiPassword, wifiSecurity, qrType, fgColor, bgColor, size, errorCorrection]);

  const getPayload = () => {
    if (qrType === 'wifi') {
      return `WIFI:T:${wifiSecurity};S:${wifiSsid};P:${wifiPassword};;`;
    }
    return text;
  };

  const generateQRCode = async () => {
    const payload = getPayload();
    if (!payload.trim()) {
      setQrDataUrl('');
      return;
    }

    try {
      const url = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: errorCorrection,
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR Code Error:', err);
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '950px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>📲</span> Advanced Studio QR Generator
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Generate custom QR codes with custom styling, Wi-Fi presets, and high-resolution PNG download.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setQrType('url')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: qrType === 'url' ? '#2563eb' : '#f8fafc', color: qrType === 'url' ? 'white' : '#334155', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔗 URL / Text
            </button>
            <button
              onClick={() => setQrType('wifi')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: qrType === 'wifi' ? '#2563eb' : '#f8fafc', color: qrType === 'wifi' ? 'white' : '#334155', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📶 Wi-Fi QR
            </button>
          </div>

          {qrType === 'url' ? (
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Input Content / URL</label>
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type link or any text..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Wi-Fi Name (SSID)"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <input
                type="password"
                placeholder="Wi-Fi Password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          )}

          {/* Color Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>🎨 QR Code Color</label>
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                style={{ width: '100%', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>🖼️ Background Color</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: '100%', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Resolution Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>📐 Size</label>
              <span style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '14px' }}>{size}px</span>
            </div>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

        </div>

        {/* Live Preview */}
        <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px' }}>🔍 Live Preview</h3>
          {qrDataUrl ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ padding: '16px', background: bgColor, borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: `${Math.min(size, 240)}px`, height: `${Math.min(size, 240)}px` }} />
              </div>
              <div style={{ marginTop: '20px' }}>
                <a
                  href={qrDataUrl}
                  download="qrcode.png"
                  style={{ display: 'inline-block', backgroundColor: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}
                >
                  ⬇️ Download PNG Image
                </a>
              </div>
            </div>
          ) : (
            <div style={{ color: '#94a3b8' }}>Fill input details to preview...</div>
          )}
        </div>

      </div>
    </div>
  );
}