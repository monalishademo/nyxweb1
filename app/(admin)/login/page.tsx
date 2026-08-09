'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft, Calendar, Clock, Heart } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Live Time & Date State
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'NYX ADMIN', password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.message || 'Incorrect Password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans p-5 selection:bg-blue-500 selection:text-white">
      {/* Header Section */}
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto py-4 border-b border-slate-800/80">
        <Link href="/" className="text-2xl text-blue-400 font-normal flex items-center gap-2 hover:opacity-90 transition">
          <span className="font-bold">NyxWeb1</span> Hub
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Site</span>
        </Link>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md relative">
          {/* Background Glow Effect */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-3 text-blue-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">NYX Admin Portal</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your secret credentials to proceed</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value="NYX ADMIN"
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 font-medium cursor-not-allowed select-none text-sm"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded">
                    Fixed
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Secret Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter Secret Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-600"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Unlock Dashboard</span>
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="border-t border-slate-800/80 pt-6 pb-2">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div>
            © {new Date().getFullYear()}{' '}
            <span className="font-bold text-slate-200">
              NYX ALL IN ONE
            </span>{' '}
            — All rights reserved.
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{date || 'Loading date...'}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-slate-100 font-semibold min-w-[85px]">
              <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>{time || '00:00:00 AM'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for Web Productivity</span>
          </div>
        </div>
      </footer>
    </div>
  );
}