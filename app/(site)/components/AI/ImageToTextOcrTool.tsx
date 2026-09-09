'use client';

import React, { useState } from 'react';
import { FileSearch, Sparkles, Upload, Copy, Check, RefreshCw, Image as ImageIcon, ArrowLeft, CheckCircle2, Bot } from 'lucide-react';
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
    setProgress('Initializing Multilingual OCR Engine...');

    try {
      // 👈 এখানে eng, ben (বাংলা), hin (হিন্দি) একসাথে লোড করা হলো যেন যেকোনো ভাষা পড়তে পারে
      const worker = await createWorker(['eng', 'ben', 'hin']);
      setProgress('Recognizing text from image...');
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Header matching other tools */}
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
                AI Image to Text (OCR)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold tracking-wider">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Powered by NYX Mind 
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Upload Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                Select Image Source
              </label>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-950/50 min-h-[220px] flex flex-col items-center justify-center space-y-3">
                {image ? (
                  <img src={image} alt="Preview" className="max-h-[160px] rounded-xl object-contain shadow-sm" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Click below to upload JPG, PNG, or WebP photo</p>
                  </>
                )}
                <label className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer transition-all shadow-md shadow-indigo-500/20">
                  {image ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              onClick={processImage}
              disabled={!image || loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progress || 'Extracting...'}</span>
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4" />
                  <span>Extract Text with NYX Mind</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Card */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-spin blur-md opacity-70"></div>
                  <div className="relative p-4 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                    NYX Mind is scanning your image
                  </p>
                  <p className="text-xs text-slate-400">
                    Extracting multi-language text characters...
                  </p>
                </div>
              </div>
            ) : extractedText ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Extracted Text Result
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>

                  <div className="mt-4">
                    <textarea
                      readOnly
                      rows={12}
                      value={extractedText}
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 text-sm font-mono text-slate-800 dark:text-slate-200 resize-none focus:outline-none shadow-inner leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] mt-4"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-16 text-slate-400">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 inline-block border border-slate-100 dark:border-slate-800">
                  <Bot className="w-10 h-10 opacity-40 mx-auto" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Your Canvas is Empty
                  </p>
                  <p className="text-xs max-w-xs mx-auto">
                    Upload any image containing English, Bengali, or Hindi text to extract it instantly with NYX Mind.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}