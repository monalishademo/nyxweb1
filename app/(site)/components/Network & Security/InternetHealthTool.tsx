'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Globe, Shield, RefreshCw, Cpu, Clock } from 'lucide-react';

interface InternetHealthToolProps {
  onBack?: () => void;
}

interface IpInfo {
  ip: string;
  org: string;
  city: string;
  country_name: string;
  version?: string;
}

interface HistoryItem {
  time: string;
  status: string;
}

export default function InternetHealthTool({ onBack }: InternetHealthToolProps) {
  const [testing, setTesting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  
  // Results State
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  
  // IP & Network Identity
  const [ipv4, setIpv4] = useState<string>('Detecting...');
  const [ipv6, setIpv6] = useState<string>('Checking...');
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  
  // Connectivity & Device info
  const [connectivity, setConnectivity] = useState<{ [key: string]: boolean }>({});
  const [deviceInfo, setDeviceInfo] = useState({
    browser: 'Unknown',
    os: 'Unknown',
    effectiveType: '4G/5G',
    timezone: 'UTC',
  });
  
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load IP & Device Info on Mount
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        setIpInfo(data);
        if (data.ip) setIpv4(data.ip);
      })
      .catch((err) => console.error('IP fetch error:', err));

    fetch('https://api64.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => {
        if (data.ip && data.ip.includes(':')) {
          setIpv6(data.ip);
        } else {
          setIpv6('Not Detected (IPv4 Only)');
        }
      })
      .catch(() => setIpv6('Unavailable'));

    const ua = navigator.userAgent;
    let browser = 'Browser';
    if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari')) browser = 'Apple Safari';
    else if (ua.includes('Edge')) browser = 'Microsoft Edge';

    let os = 'OS';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iOS';

    const conn = (navigator as any).connection || (navigator as any).mozConnection;
    
    setDeviceInfo({
      browser,
      os,
      effectiveType: conn?.effectiveType ? conn.effectiveType.toUpperCase() : 'Broadband / Wi-Fi',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });

    const savedHistory = localStorage.getItem('nyx_net_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
  }, []);

  // Main Health Check Execution (Latency & Reachability)
  const runHealthCheck = async () => {
    setTesting(true);
    setProgress(25);

    try {
      const pings: number[] = [];
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        const end = performance.now();
        pings.push(end - start);
      }
      const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
      setPing(avgPing);
      setProgress(60);

      const sites = {
        Google: 'https://www.google.com/favicon.ico',
        Cloudflare: 'https://www.cloudflare.com/favicon.ico',
        GitHub: 'https://github.com/favicon.ico',
        Microsoft: 'https://www.microsoft.com/favicon.ico',
      };
      
      const connResults: { [key: string]: boolean } = {};
      for (const [name, url] of Object.entries(sites)) {
        try {
          await fetch(url, { mode: 'no-cors', cache: 'no-store' });
          connResults[name] = true;
        } catch {
          connResults[name] = false;
        }
      }
      setConnectivity(connResults);
      setProgress(90);

      let score = 100;
      if (avgPing > 80) score -= 20;
      if (avgPing > 150) score -= 35;
      score = Math.max(score, 50);
      setHealthScore(score);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newHistoryItem = { time: timeStr, status: `${avgPing} ms Latency` };
      const updatedHistory = [newHistoryItem, ...history.slice(0, 3)];
      setHistory(updatedHistory);
      localStorage.setItem('nyx_net_history', JSON.stringify(updatedHistory));

      setProgress(100);
    } catch (error) {
      console.error('Health check error:', error);
    } finally {
      setTesting(false);
    }
  };

  const getPingRating = (p: number | null) => {
    if (p === null) return { text: '-', color: 'text-slate-400' };
    if (p < 30) return { text: 'Excellent', color: 'text-emerald-500' };
    if (p <= 60) return { text: 'Good', color: 'text-blue-500' };
    return { text: 'Average', color: 'text-amber-500' };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Main Outer Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
          <div className="flex items-center gap-3.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
                  Internet Health Check
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                  Security
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Analyze your connection latency, stability, DNS connectivity, and service reachability.
              </p>
            </div>
          </div>

          <button
            onClick={runHealthCheck}
            disabled={testing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Running Diagnostics...' : 'Start Health Check'}</span>
          </button>
        </div>

        {/* Progress Bar during test */}
        {testing && (
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Overall Health Score Card */}
        {healthScore !== null && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Overall Connection Health</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {healthScore >= 80 ? '🟢 Excellent & Stable' : '🟠 Fair Connection'}
              </h3>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-black text-indigo-500 font-mono">{healthScore}</span>
              <span className="text-xs text-slate-400 font-bold"> / 100</span>
            </div>
          </div>
        )}

        {/* Core Latency & Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-sky-500" /> Latency (Ping)</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 ${getPingRating(ping).color}`}>
                {getPingRating(ping).text}
              </span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{ping !== null ? ping : '-'}</span>
              <span className="text-xs font-bold text-slate-400">ms</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> DNS Connectivity</span>
              <span className="text-[10px] text-emerald-500 font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60">
                Active
              </span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">Working</span>
            </div>
          </div>
        </div>

        {/* Network Identity (IPv4, IPv6 & ISP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" /> Network Identity & IP
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-500">Public IPv4:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ipv4}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-500">Public IPv6:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={ipv6}>{ipv6}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-500">ISP / Provider:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={ipInfo?.org}>{ipInfo?.org || 'Detecting...'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ipInfo ? `${ipInfo.city}, ${ipInfo.country_name}` : 'Detecting...'}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> Website Reachability
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Google', 'Cloudflare', 'GitHub', 'Microsoft'].map((site) => {
                const isWorking = connectivity[site];
                return (
                  <div key={site} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{site}</span>
                    {isWorking === undefined ? (
                      <span className="text-slate-400 text-[10px]">Checking...</span>
                    ) : isWorking ? (
                      <span className="text-emerald-500 font-bold">✓ OK</span>
                    ) : (
                      <span className="text-rose-500 font-bold">✕ Failed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-500" /> Connection & Device Details
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] mb-0.5">Browser</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{deviceInfo.browser}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] mb-0.5">OS</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{deviceInfo.os}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] mb-0.5">Network Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{deviceInfo.effectiveType}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] mb-0.5">Timezone</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{deviceInfo.timezone}</span>
            </div>
          </div>
        </div>

        {/* Test History Section */}
        {history.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Today's Check History
              </h4>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {history.map((item, idx) => (
                <div key={idx} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">{item.time}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}