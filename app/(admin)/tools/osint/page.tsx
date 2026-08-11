'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Maigret from './Maigret';

export default function OsintPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">NYX Admin OSINT Console</h1>
              <p className="text-xs text-slate-400">Open Source Intelligence Tools</p>
            </div>
          </div>
        </div>

        <Maigret />
      </div>
    </div>
  );
}