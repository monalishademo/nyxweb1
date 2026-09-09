'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Download, ArrowLeft, Wifi, Link2, Palette, Sliders } from 'lucide-react';
import QRCode from 'qrcode';

interface QrGeneratorProps {
  onBack?: () => void;
}

export default function QrGeneratorTool({ onBack }: QrGeneratorProps) {
  const [qrType, setQrType] = useState<'url' | 'wifi' | 'text'>('url');
  const [text, setText] = useState<string>('https://google.com');
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [wifiSecurity, setWifiSecurity] = useState<string>('WPA');

  const [fgColor, setFgColor] = useState<string>('#0f172a');
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
                Advanced Studio QR Generator
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                UTILITY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Generate custom QR codes with styling, Wi-Fi presets, and high-resolution PNG download
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column Controls */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            
            {/* Category Tabs */}
            <div className="flex bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setQrType('url')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  qrType === 'url'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" /> URL / Text
              </button>
              <button
                onClick={() => setQrType('wifi')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  qrType === 'wifi'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" /> Wi-Fi QR
              </button>
            </div>

            {qrType === 'url' ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <QrCode className="w-3.5 h-3.5 text-indigo-500" /> Input Content / URL *
                </label>
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type link or any text..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Wi-Fi Name (SSID)</label>
                  <input
                    type="text"
                    placeholder="e.g. MyHome_WiFi"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Wi-Fi Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Color Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" /> QR Color
                </label>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full h-11 p-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" /> BG Color
                </label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-11 p-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer"
                />
              </div>
            </div>

            {/* Resolution Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Resolution Size
                </label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{size}px</span>
              </div>
              <input
                type="range"
                min="128"
                max="512"
                step="32"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Right Column Live Preview */}
        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[460px] flex flex-col justify-between items-center text-center relative overflow-hidden">
            <div className="w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Preview
                </span>
              </div>

              {qrDataUrl ? (
                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block shadow-inner" style={{ background: bgColor }}>
                    <img src={qrDataUrl} alt="QR Code" className="max-w-[220px] max-h-[220px] object-contain" />
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 py-20 text-xs">Fill input details to preview...</div>
              )}
            </div>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download="qrcode.png"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer mt-6"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG Image</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}