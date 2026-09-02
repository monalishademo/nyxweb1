'use client';

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { formatFileSize } from '@/lib/utils';

export default function ProtectPdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [protectFile, setProtectFile] = useState<File | null>(null);
  const [protectPreviewUrl, setProtectPreviewUrl] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [confirmPdfPassword, setConfirmPdfPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isProtecting, setIsProtecting] = useState<boolean>(false);
  const [protectedResult, setProtectedResult] = useState<{ downloadUrl: string; filename: string } | null>(null);

  const handleProtectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setProtectFile(file);
    setPdfPassword('');
    setConfirmPdfPassword('');
    setProtectedResult(null);

    if (pdfjs) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          setProtectPreviewUrl(canvas.toDataURL('image/jpeg'));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProtectPDF = async () => {
    if (!protectFile || !pdfPassword) return;
    if (pdfPassword !== confirmPdfPassword) return;

    setIsProtecting(true);
    setProtectedResult(null);

    try {
      if (!pdfjs) {
        alert("PDF Engine প্রস্তুত হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।");
        setIsProtecting(false);
        return;
      }

      const arrayBuffer = await protectFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let doc: jsPDF | null = null;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // 3.0 Ultra High Scale Resolution for Crystal Clear Quality (300 DPI equivalent)
        const viewport = page.getViewport({ scale: 3.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/jpeg', 1.0);

          const origViewport = page.getViewport({ scale: 1.0 });
          const orientation = origViewport.width > origViewport.height ? 'l' : 'p';

          if (pageNum === 1) {
            doc = new jsPDF({
              orientation: orientation,
              unit: 'px',
              format: [origViewport.width, origViewport.height],
              encryption: {
                userPassword: pdfPassword,
                ownerPassword: pdfPassword,
                userPermissions: ['print', 'modify', 'copy', 'annot-forms'],
              },
            });
            doc.addImage(imgData, 'JPEG', 0, 0, origViewport.width, origViewport.height, undefined, 'FAST');
          } else if (doc) {
            doc.addPage([origViewport.width, origViewport.height], orientation);
            doc.addImage(imgData, 'JPEG', 0, 0, origViewport.width, origViewport.height, undefined, 'FAST');
          }
        }
      }

      if (doc) {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        setProtectedResult({
          downloadUrl: url,
          filename: `protected_${protectFile.name}`,
        });

        const link = document.createElement('a');
        link.href = url;
        link.download = `protected_${protectFile.name}`;
        link.click();
      }

      setIsProtecting(false);
    } catch (err: any) {
      console.error('Protection error:', err);
      alert('PDF Encrypt করতে সমস্যা হয়েছে! আবার চেষ্টা করুন।');
      setIsProtecting(false);
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
              NYX PDF Protect
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
              PDF TOOL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypt your PDF file with high-resolution password protection.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!protectFile ? (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleProtectFileUpload}
            id="protect-pdf-input"
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload PDF Document</h3>
          <p className="text-xs text-slate-500 mb-6">Select a file to encrypt and set password protection.</p>

          <label
            htmlFor="protect-pdf-input"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Select PDF File
          </label>
        </div>
      ) : (
        <div>
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Password Configuration Panel */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Security Credentials</span>
                <button
                  onClick={() => setProtectFile(null)}
                  className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Enter Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Enter Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="Enter strong password..."
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPdfPassword}
                  onChange={(e) => setConfirmPdfPassword(e.target.value)}
                  placeholder="Re-type password..."
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Password Match Status */}
              {pdfPassword && confirmPdfPassword && (
                <div
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border ${
                    pdfPassword === confirmPdfPassword
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {pdfPassword === confirmPdfPassword ? '✅ Passwords match!' : '❌ Passwords do not match'}
                </div>
              )}
            </div>

            {/* Document Details & Cover Preview Card */}
            <div className="lg:col-span-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              {protectPreviewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-md bg-white p-1">
                  <img
                    src={protectPreviewUrl}
                    alt="PDF Cover"
                    className="w-24 h-32 object-cover rounded"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
                  📄
                </div>
              )}
              
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                  {protectFile.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Size: {formatFileSize(protectFile.size)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleProtectPDF}
            disabled={isProtecting || !pdfPassword || pdfPassword !== confirmPdfPassword}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProtecting ? 'Encrypting High-Res PDF...' : '🔒 Encrypt & Download Locked PDF'}
          </button>

          {/* Success Banner */}
          {protectedResult && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
              <h3 className="text-xs font-bold text-emerald-800">
                🎉 High Quality PDF Locked Successfully!
              </h3>
              <p className="text-xs text-emerald-600">
                Your PDF is now encrypted with password protection without quality loss.
              </p>
              <a
                href={protectedResult.downloadUrl}
                download={protectedResult.filename}
                className="mt-1 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                ⬇️ Download Locked PDF Again
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}