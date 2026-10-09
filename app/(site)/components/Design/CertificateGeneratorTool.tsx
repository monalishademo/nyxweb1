'use client';

import React from 'react';
import { ArrowLeft, Award } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function CertificateGeneratorTool({ onBack }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
          <Award className="w-6 h-6" /> Design Tools
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Bulk Certificate Generator
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Upload your Excel file, select a modern layout, and generate professional certificates instantly.
      </p>

      {/* Your Certificate Generator UI/Form goes here */}
      <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center">
        <p className="text-sm text-slate-500">Upload component interface coming soon...</p>
      </div>
    </div>
  );
}