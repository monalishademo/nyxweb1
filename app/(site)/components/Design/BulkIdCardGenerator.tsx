'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, ShieldCheck, FileSpreadsheet, Download, Loader2, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function BulkIdCardGenerator({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('দয়া করে প্রথমে একটি এক্সেল ফাইল আপলোড করুন!');

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('সব আইডি কার্ড সফলভাবে জেনারেট হয়েছে!');
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
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600">
          Bulk ID Studio
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Upload Form */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Bulk ID Card Generator
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Upload an Excel file to instantly generate professional ID cards in bulk using this template design.
          </p>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-800/50">
              <input
                type="file"
                accept=".xlsx, .csv"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="hidden"
                id="bulk-id-upload"
              />
              <label htmlFor="bulk-id-upload" className="cursor-pointer flex flex-col items-center">
                <FileSpreadsheet className="w-10 h-10 text-purple-500 mb-2" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {file ? file.name : 'Upload Excel (.xlsx) file'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Columns: Name, Role, Email, Phone, Location</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Cards...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Generate & Download ZIP
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Live ID Card Template Preview */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-slate-400 mb-3">Template Preview</span>
          <div className="w-[300px] h-[460px] bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col justify-between p-5">
            
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-b-[40%] flex flex-col items-center pt-5 text-white">
              <span className="text-[10px] font-semibold tracking-widest uppercase opacity-90">NYX WEB ONE</span>
              <span className="text-xs font-bold mt-0.5">Official ID Card</span>
            </div>

            <div className="relative z-10 flex flex-col items-center mt-12">
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 shadow-md overflow-hidden bg-slate-200 flex items-center justify-center">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">Sullab Sinha</h3>
              <p className="text-[11px] font-semibold text-indigo-500">Lead Cybersecurity Trainer</p>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span className="truncate">sullab@nyxweb.com</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Bankura, West Bengal</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified ID
              </div>
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-[9px] text-slate-400 font-bold">
                QR
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}