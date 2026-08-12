'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Access Denied: Invalid Credentials');
      }
    } catch {
      setError('Connection Error: Server Unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d14] flex flex-col justify-between p-6 md:p-10 font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* Top Header Navigation */}
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          SYSTEM ONLINE
        </span>
      </div>

      {/* Main Two-Column Container */}
      <div className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center z-10 py-8">
        
        {/* Left Side: Large Branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-16 h-16 md:w-20 md:h-20" />
          </div>
          <div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-widest font-mono">
              NYX
            </h1>
            <p className="text-sm md:text-base text-slate-400 tracking-wider mt-2 font-mono">
              ALL-IN-ONE SECURITY & TOOLS CONSOLE
            </p>
          </div>
        </div>

        {/* Middle Divider Line for Desktop */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-y-1/2 w-[1px] h-3/5 bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-white tracking-wide">
              NYX WEB ADMIN LOGIN
            </h2>
            <p className="text-sm font-semibold text-emerald-400 font-mono">
              Hi Admin, please enter your details
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider pl-1">
                Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-800 focus:border-emerald-500 text-white text-xs px-4 py-3.5 pl-10 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition font-mono placeholder:text-slate-600"
                  required
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-800 focus:border-emerald-500 text-white text-xs px-4 py-3.5 pl-10 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition font-mono placeholder:text-slate-600"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3.5 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? (
                <span className="font-mono">LOGGING IN...</span>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Footer */}
      <div className="w-full max-w-7xl mx-auto border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-mono gap-2 z-10">
        <p>© {new Date().getFullYear()} NYX OSINT & Security Suite. All rights reserved.</p>
        <p>RESTRICTED ACCESS • AUTHORIZED PERSONNEL ONLY</p>
      </div>

      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>
    </div>
  );
}