'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { formatFileSize } from '@/lib/utils';

interface UnlockPdfToolProps {
  pdfjs?: any;
  onBack: () => void;
}

export default function UnlockPdfTool({ pdfjs, onBack }: UnlockPdfToolProps) {
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [unlockedResult, setUnlockedResult] = useState<{ downloadUrl: string; filename: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlockFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUnlockFile(file);
    setPdfPassword('');
    setUnlockedResult(null);
    setErrorMessage(null);
  };

  const handleUnlockPDF = async () => {
    if (!unlockFile || !pdfPassword) {
      setErrorMessage("Please enter the password.");
      return;
    }

    setIsUnlocking(true);
    setUnlockedResult(null);
    setErrorMessage(null);

    try {
      const arrayBuffer = await unlockFile.arrayBuffer();

      // Ensure pdfjs engine is loaded or fallback dynamically
      let activePdfjs = pdfjs;
      if (!activePdfjs) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        activePdfjs = pdfjsLib;
      }

      // Load protected PDF via pdfjs
      const loadingTask = activePdfjs.getDocument({
        data: arrayBuffer,
        password: pdfPassword,
      });

      const pdf = await loadingTask.promise;
      
      // Create fresh unencrypted PDF document
      const newPdfDoc = await PDFDocument.create();

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/png');
          const pngImage = await newPdfDoc.embedPng(imgData);
          
          const origViewport = page.getViewport({ scale: 1.0 });
          const pdfPage = newPdfDoc.addPage([origViewport.width, origViewport.height]);
          pdfPage.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
          });
        }
      }

      const unlockedBytes = await newPdfDoc.save();

      const blob = new Blob([unlockedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setUnlockedResult({
        downloadUrl: url,
        filename: `unlocked_${unlockFile.name}`,
      });

      const link = document.createElement('a');
      link.href = url;
      link.download = `unlocked_${unlockFile.name}`;
      link.click();

      setIsUnlocking(false);
    } catch (err: any) {
      console.error('Unlock error:', err);
      if (err.name === 'PasswordException' || (err.message && err.message.toLowerCase().includes('password'))) {
        setErrorMessage('Incorrect password! Please verify and try again.');
      } else {
        setErrorMessage('Failed to unlock PDF. Please check if the file is valid.');
      }
      setIsUnlocking(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
      {/* Header Section */}
      <div className="flex items-center gap-3.5 mb-8">
        <button
          onClick={onBack}
          type="button"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
          title="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              NYX PDF Unlocker
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
              PDF TOOL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter the password to permanently decrypt and remove security locks from your PDF.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!unlockFile ? (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUnlockFileUpload}
            id="unlock-pdf-input"
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload Protected PDF</h3>
          <p className="text-xs text-slate-500 mb-6">Select a password-protected PDF to unlock and remove restriction.</p>

          <label
            htmlFor="unlock-pdf-input"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Select Protected PDF
          </label>
        </div>
      ) : (
        <div>
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Password Entry Panel */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Enter Security Credentials</span>
                <button
                  onClick={() => setUnlockFile(null)}
                  className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
                >
                  Change File
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Current PDF Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="Enter document password..."
                    className="w-full py-2.5 pl-3 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-xs font-semibold px-3 py-2.5 rounded-lg border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-2">
                  <span>❌</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Document Details Card */}
            <div className="lg:col-span-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
                🔐
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                  {unlockFile.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Size: {formatFileSize(unlockFile.size)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleUnlockPDF}
            disabled={isUnlocking || !pdfPassword}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUnlocking ? '🔓 Decrypting & Removing Password...' : '🔓 Remove Password & Download PDF'}
          </button>

          {/* Success Banner */}
          {unlockedResult && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
              <h3 className="text-xs font-bold text-emerald-800">
                🎉 PDF Unlocked Successfully!
              </h3>
              <p className="text-xs text-emerald-600">
                The password protection has been permanently removed.
              </p>
              <a
                href={unlockedResult.downloadUrl}
                download={unlockedResult.filename}
                className="mt-1 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                ⬇️ Download Unlocked PDF Again
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}