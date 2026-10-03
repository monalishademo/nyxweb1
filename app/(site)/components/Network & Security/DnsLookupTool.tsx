'use client';

import React, { useState } from 'react';
import { ArrowLeft, Search, Globe, Server, Check, Copy } from 'lucide-react';

interface DnsLookupToolProps {
  onBack: () => void;
}

export default function DnsLookupTool({ onBack }: DnsLookupToolProps) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [dnsResult, setDnsResult] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setError('');
    setDnsResult(null);

    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
      // Using Cloudflare's public DNS-over-HTTPS API for lookup
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`, {
        headers: { Accept: 'application/dns-json' },
      });

      if (!response.ok) throw new Error('Failed to resolve DNS query.');

      const data = await response.json();
      
      if (!data.Answer || data.Answer.length === 0) {
        throw new Error('No IP records found for this domain.');
      }

      const ips = data.Answer.filter((record: any) => record.type === 1).map((record: any) => record.data);

      setDnsResult({
        domain: cleanDomain,
        ips: ips.length > 0 ? ips : ['No A records found'],
        status: data.Status === 0 ? 'Success (NOERROR)' : 'Resolved with warnings',
      });
    } catch (err: any) {
      setError(err.message || 'Error fetching DNS records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!dnsResult) return;
    navigator.clipboard.writeText(JSON.stringify(dnsResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Top Header with Back Icon */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <button
          onClick={onBack}
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-all cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            DNS & Domain IP Lookup
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 font-sans">SECURITY TOOL</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Query A records, server IP addresses, and DNS configurations for any domain name.
          </p>
        </div>
      </div>

      {/* Title Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">DNS Lookup Configuration</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter target domain details below to inspect IP addresses.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLookup} className="flex gap-2.5">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g. github.com, vercel.app)"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-2"
          >
            {loading ? 'Searching...' : 'Lookup DNS'}
          </button>
        </form>
      </div>

      {/* Error Output */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Results Card */}
      {dnsResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{dnsResult.domain}</span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Data'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-semibold">Resolved IP Addresses (A Records):</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dnsResult.ips.map((ip: string, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>{ip}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-500 font-sans">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}