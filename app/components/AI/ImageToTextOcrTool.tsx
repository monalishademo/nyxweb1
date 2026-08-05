'use client';

import React, { useState } from 'react';
import { FileSearch, Sparkles, Upload, Copy, Check, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface ImageToTextOcrProps {
  onBack?: () => void;
}

export default function ImageToTextOcrTool({ onBack }: ImageToTextOcrProps) {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setExtractedText('');
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    setProgress('Initializing OCR Engine...');

    try {
      const worker = await createWorker('eng');
      setProgress('Reading text from image...');
      const { data } = await worker.recognize(image);
      setExtractedText(data.text);
      await worker.terminate();
    } catch (err) {
      console.error(err);
      alert('Failed to extract text from image.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>In-Browser AI OCR Engine</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">AI Image to Text (OCR)</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Upload any photo, document screenshot, or scanned image to instantly extract text.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Upload Card */}
        <div className="dark-card border rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-base font-bold dark-text-main flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-teal-500" />
            <span>Select Image</span>
          </h3>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/40 min-h-[220px] flex flex-col items-center justify-center space-y-3">
            {image ? (
              <img src={image} alt="Preview" className="max-h-[180px] rounded-lg object-contain shadow-xs" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-xs dark-text-muted">Click below to upload JPG, PNG, or WebP photo</p>
              </>
            )}
            <label className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer transition-all shadow-xs">
              {image ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <button
            onClick={processImage}
            disabled={!image || loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{progress || 'Extracting...'}</span>
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4" />
                <span>Extract Text with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Card */}
        <div className="dark-card border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold dark-text-main">Extracted Text Result</h3>
              {extractedText && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-teal-500 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              )}
            </div>

            {extractedText ? (
              <textarea
                readOnly
                rows={8}
                value={extractedText}
                className="w-full p-3 rounded-xl dark-input border text-sm font-mono resize-none focus:outline-none"
              />
            ) : (
              <div className="text-center py-16 dark-text-muted space-y-2">
                <FileSearch className="w-10 h-10 mx-auto opacity-20" />
                <p className="text-xs">Extracted text will appear here once processed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}