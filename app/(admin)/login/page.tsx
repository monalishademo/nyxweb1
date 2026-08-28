'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // 🛠️ এখানে পরিবর্তন করা হয়েছে (/admin এর বদলে /dashboard)
        router.push('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col justify-between p-8 font-sans">
      {/* Top Header */}
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-[#0e131f] border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md uppercase tracking-wider">
          SYSTEM ONLINE
        </span>
      </div>

      {/* Main Container with Divider */}
      <div className="w-full max-w-6xl mx-auto my-auto flex flex-col md:flex-row items-center justify-center py-10">
        
        {/* Left Side: Logo & Big NYX Text */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
          <div className="w-24 h-24 bg-[#0a1515] border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-950/20">
            <Shield className="w-12 h-12 text-emerald-400" />
          </div>
          
          <h1 className="text-7xl font-black text-white tracking-widest uppercase">
            NYX
          </h1>
        </div>

        {/* Vertical Divider Line (মাঝের দাগ) */}
        <div className="hidden md:block w-[1px] h-96 bg-slate-800/80 mx-8"></div>

        {/* Right Side: Login Box */}
        <div className="flex-1 w-full max-w-md bg-[#0b0f19] border border-slate-800/80 p-8 rounded-2xl shadow-2xl my-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-wide">
              NYX WEB ONE ADMIN LOGIN
            </h2>
            <p className="text-xs text-emerald-400 mt-1 font-medium">
              Hi Admin, please enter your details
            </p>
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                USERNAME
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="text"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  className="w-full bg-[#06080e] border border-slate-800 text-xs text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500/50 transition placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                PASSWORD
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full bg-[#06080e] border border-slate-800 text-xs text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500/50 transition placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00dc82] hover:bg-[#00c574] text-slate-950 text-xs font-bold uppercase tracking-wider py-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              LOGIN
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-800/40 pt-4">
        <div>
          © 2026 NYX- All rights reserved.
        </div>
        <div>
          RESTRICTED ACCESS • AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
    </div>
  );
}