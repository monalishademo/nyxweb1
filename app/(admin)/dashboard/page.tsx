'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, ArrowRight, Shield, LogOut } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Secret Admin Workspace
          </h1>
          <p className="text-xs text-slate-400">Protected Control Center</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Tools Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* OSINT Card */}
        <Link
          href="/tools/osint"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition group flex flex-col justify-between space-y-4 hover:shadow-2xl hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Terminal className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
              OSINT Console
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Run Maigret, SOCMINT & Recon tools.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}