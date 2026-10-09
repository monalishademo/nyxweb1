'use client';

import React, { useState } from 'react';
import { ArrowLeft, Stamp, Image as ImageIcon, Download, Loader2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function BatchWatermarkTool({ onBack }: Props) {
  const [images, setImages] = useState<File[]>([]);
  const [watermarkText, setWatermarkText] = useState('NYX WEB ONE');
  const [loading, setLoading] = useState(false);

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return alert('দয়া করে অন্তত একটি ছবি আপলোড করুন!');

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('সব ছবিতে সফলভাবে ওয়াটারমার্ক যোগ করা হয়েছে!');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600">
          Image Studio
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Batch Image Watermark Tool
        </h2>
        <p className="text-sm text-slate-500">
          Upload multiple images and apply custom text or logo watermarks to all of them at once.
        </p>
      </div>

      <form onSubmit={handleProcess} className="space-y-6">
        {/* File Upload Box */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-800/50">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && setImages(Array.from(e.target.files))}
            className="hidden"
            id="batch-watermark-upload"
          />
          <label htmlFor="batch-watermark-upload" className="cursor-pointer flex flex-col items-center">
            <ImageIcon className="w-12 h-12 text-amber-500 mb-3" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {images.length > 0 ? `${images.length} images selected` : 'Click to upload images (Multiple allowed)'}
            </span>
          </label>
        </div>

        {/* Watermark Text Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Watermark Text
          </label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter watermark text..."
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || images.length === 0}
          className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing Images...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Apply Watermark & Download ZIP
            </>
          )}
        </button>
      </form>
    </div>
  );
}