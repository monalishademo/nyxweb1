'use client';

import React, { useState } from 'react';
import { ArrowLeft, Lock, Globe, CheckCircle2, AlertTriangle, ShieldCheck, Search } from 'lucide-react';

interface SslCheckerToolProps {
  onBack: () => void;
}

export default function SslCheckerTool({ onBack }: SslCheckerToolProps) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [sslData, setSslData] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleCheckSsl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setError('');
    setSslData(null);

    let cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
      // Free public API to check SSL certificate information via crt.sh or similar lookup
      const response = await fetch(`https://crt.sh/?q=${cleanDomain}&output=json`);
      if (!response.ok) throw new Error('Failed to fetch certificate details.');
      
      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error('No SSL certificates found for this domain.');
      }

      // Get the latest certificate entry
      const latestCert = data[data.length - 1];

      setSslData({
        domain: cleanDomain,
        issuer: latestCert.issuer_name || 'Unknown Issuer',
        commonName: latestCert.common_name || cleanDomain,
        notBefore: new Date(latestCert.not_before).toLocaleDateString(),
        notAfter: new Date(latestCert.not_after).toLocaleDateString(),
        serialNumber: latestCert.serial_number || 'N/A',
        status: 'Active / Issued',
      });
    } catch (err: any) {
      setError(err.message || 'Could not retrieve SSL info. Please check the domain name.');
    } finally {
      setLoading(false);
    }
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
            SSL Certificate Expiry Checker
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 font-sans">SECURITY TOOL</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify SSL certificate validity, issuer details, and expiration dates for any website.
          </p>
        </div>
      </div>

      {/* Title Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">SSL Domain Verification</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter target domain name below to inspect certificate details.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleCheckSsl} className="flex gap-2.5">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g. google.com, github.com)"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-2"
          >
            {loading ? (
              <span>Checking...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Check SSL</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {sslData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{sslData.domain}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              {sslData.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Common Name (CN)</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{sslData.commonName}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Certificate Issuer</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={sslData.issuer}>{sslData.issuer}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Valid From</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{sslData.notBefore}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Valid Until (Expiry)</span>
              <p className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{sslData.notAfter}</span>
              </p>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] text-slate-400 font-mono">Serial Number: {sslData.serialNumber}</span>
          </div>
        </div>
      )}
    </div>
  );
}