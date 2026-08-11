'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Shield } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
        setError(data.error || 'Invalid Credentials');
      }
    } catch {
      setError('Server connection error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">NYX Admin Zone</h1>
          <p className="text-xs text-slate-400">Enter passcode to access control center</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Admin Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs px-4 py-3 rounded-xl focus:outline-none font-mono"
              required
            />
            <User className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Admin Passcode..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs px-4 py-3 rounded-xl focus:outline-none font-mono"
              required
            />
            <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
          </div>

          {error && <p className="text-red-400 text-xs text-center font-mono">{error}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3 rounded-xl transition cursor-pointer"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}