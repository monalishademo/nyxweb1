'use client';

import React, { useState } from 'react';
import { Search, UserCheck, ShieldAlert, ExternalLink } from 'lucide-react';

export default function Maigret() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/maigret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Maigret scan failed');
      }
    } catch {
      setError('Server connection failed while executing Maigret engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Maigret Profile & Bio Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">Deep-scan targets using python backend execution.</p>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
          SOCMINT Module
        </span>
      </div>

      <form onSubmit={handleScan} className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter target username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none"
            required
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Run Maigret'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-xs font-mono flex justify-between items-center">
            <span>Target: <strong className="text-emerald-400">@{results.target}</strong></span>
            <span>Found: <strong className="text-white">{results.totalFound} / {results.totalChecked}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.results.filter((r: any) => r.exists).map((item: any, i: number) => (
              <div key={i} className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">{item.site}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{item.title || item.category}</div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition flex items-center gap-1 text-[11px]"
                >
                  Open Target <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}