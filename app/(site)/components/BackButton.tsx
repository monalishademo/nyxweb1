'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wide transition shadow-sm cursor-pointer mb-5"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back to Dashboard</span>
    </button>
  );
}