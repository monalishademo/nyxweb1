'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Shield, LogOut, Users, MapPin } from 'lucide-react';

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
        
        {/* Cisco Attendance Tool Card */}
        <Link 
          href="/tools/cisco-attendance"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition group flex flex-col items-start justify-between space-y-3 cursor-pointer min-h-[160px] hover:bg-slate-900/80"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl transition">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
              Cisco Attendance Sheet
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generate & print Excel attendance sheets
            </p>
          </div>
        </Link>

        {/* GPS Map Camera Tool Card */}
        <Link 
          href="/tools/gps-camera"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition group flex flex-col items-start justify-between space-y-3 cursor-pointer min-h-[160px] hover:bg-slate-900/80"
        >
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl transition">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition">
              GPS Map Camera
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Stamp custom GPS coordinates, date & time on photos
            </p>
          </div>
        </Link>

        {/* Add Tool Card */}
        <div className="bg-slate-900/50 border border-dashed border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition group flex flex-col items-center justify-center space-y-3 cursor-pointer min-h-[160px] hover:bg-slate-900/80">
          <div className="p-3 bg-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 rounded-xl transition">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-300 group-hover:text-white transition">
              Add Tool
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Integrate new utility module
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}