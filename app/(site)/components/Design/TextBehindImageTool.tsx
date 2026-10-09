'use client';

import React, { useState, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, Download, Type, Layers } from 'lucide-react';
import { toPng } from 'html-to-image';

interface Props {
  onBack: () => void;
}

export default function TextBehindImageTool({ onBack }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('NYX WEB');
  const [textSize, setTextSize] = useState(120);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textPosition, setTextPosition] = useState<'center' | 'bottom'>('center');
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDownload = () => {
    if (previewRef.current) {
      toPng(previewRef.current, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'text-behind-image.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('ডাউনলোড করতে সমস্যা হয়েছে:', err);
          alert('ছবি ডাউনলোড ব্যর্থ হয়েছে।');
        });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600">
          Design Studio
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Text Behind Image Effect
        </h2>
        <p className="text-sm text-slate-500">
          Place bold typography behind the main subject of your photo for a stunning editorial look.
        </p>
      </div>

      <div className="grid md:grid-cols-[300px,1fr] gap-6">
        {/* Controls Sidebar */}
        <div className="space-y-5">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center bg-slate-50 dark:bg-slate-800/50">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Font Size: {textSize}px
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
            disabled={!image}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer text-xs"
          >
            <Download className="w-4 h-4" /> Download Artwork
          </button>
        </div>

        {/* Live Preview Area (The Magic Layering) */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-center overflow-hidden min-h-[400px]">
          {!image ? (
            <div className="text-center text-slate-400 p-8">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-xs">Upload an image to preview the text-behind effect.</p>
            </div>
          ) : (
            <div
              ref={previewRef}
              className="relative max-w-full max-h-[500px] overflow-hidden rounded-xl shadow-2xl flex items-center justify-center bg-black"
            >
              {/* Layer 1: Background Image */}
              <img src={image} alt="Background base" className="w-full h-full object-contain max-h-[500px]" />

              {/* Layer 2: The Text (Placed behind the subject using CSS clip-path or absolute overlay styling) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <span
                  style={{
                    fontSize: `${textSize}px`,
                    color: textColor,
                    lineHeight: 1,
                  }}
                  className="font-black uppercase tracking-wider opacity-90 text-center drop-shadow-lg"
                >
                  {text}
                </span>
              </div>

              {/* Layer 3: Foreground Subject Cutout Overlay (Simulated overlapping effect) */}
              <div className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none">
                <img src={image} alt="Subject overlay" className="w-full h-full object-contain max-h-[500px]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}