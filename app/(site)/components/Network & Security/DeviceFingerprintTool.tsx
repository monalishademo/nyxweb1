'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Monitor, Globe, Cpu, Wifi, HardDrive, Copy, Check } from 'lucide-react';

interface DeviceFingerprintToolProps {
  onBack: () => void;
}

export default function DeviceFingerprintTool({ onBack }: DeviceFingerprintToolProps) {
  const [fingerprint, setFingerprint] = useState({
    userAgent: '',
    platform: '',
    language: '',
    languages: [] as string[],
    screenResolution: '',
    colorDepth: 0,
    hardwareConcurrency: 0,
    deviceMemory: 'N/A',
    timezone: '',
    cookieEnabled: false,
    onlineStatus: true,
    canvasSupported: false,
    webglVendor: 'N/A',
    webglRenderer: 'N/A',
    ipAddress: 'Detecting...',
    connectionType: 'N/A',
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Basic Browser & Navigator Info
    const ua = navigator.userAgent;
    const platform = navigator.platform || 'Unknown';
    const language = navigator.language;
    const languages = [...navigator.languages];
    const screenRes = `${window.screen.width} x ${window.screen.height}`;
    const colorDepth = window.screen.colorDepth;
    const cpuCores = navigator.hardwareConcurrency || 0;
    // @ts-expect-error - deviceMemory is experimental
    const devMemory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Not Available';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cookieEnabled = navigator.cookieEnabled;
    const onlineStatus = navigator.onLine;

    // Connection Info if available
    // @ts-expect-error - connection is experimental
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connType = conn ? `${conn.effectiveType || 'unknown'} (${conn.downlink ? conn.downlink + ' Mbps' : 'N/A'})` : 'Not Available';

    // Canvas Support Check
    let canvasSupported = false;
    try {
      const canvas = document.createElement('canvas');
      canvasSupported = !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      canvasSupported = false;
    }

    // WebGL Info
    let webglVendor = 'N/A';
    let webglRenderer = 'N/A';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'N/A';
          webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'N/A';
        }
      }
    } catch {
      // Ignore WebGL errors
    }

    setFingerprint({
      userAgent: ua,
      platform,
      language,
      languages,
      screenResolution: screenRes,
      colorDepth,
      hardwareConcurrency: cpuCores,
      deviceMemory: devMemory,
      timezone,
      cookieEnabled,
      onlineStatus,
      canvasSupported,
      webglVendor,
      webglRenderer,
      ipAddress: 'Fetching...',
      connectionType: connType,
    });

    // Fetch Public IP
    fetch('https://api64.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => {
        setFingerprint((prev) => ({ ...prev, ipAddress: data.ip }));
      })
      .catch(() => {
        setFingerprint((prev) => ({ ...prev, ipAddress: 'Unable to fetch IP' }));
      });
  }, []);

  const handleCopyReport = () => {
    const report = JSON.stringify(fingerprint, null, 2);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Top Header with Back Icon */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Device & Network Fingerprint
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 font-sans">SECURITY TOOL</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect your browser environment, hardware capabilities, and public network details.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyReport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-sm shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied Fingerprint!' : 'Copy JSON Report'}</span>
        </button>
      </div>

      {/* Grid Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Network & IP Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm">
            <Globe className="w-4 h-4" />
            <span>Network Information</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Public IP Address:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.ipAddress}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Network Connection:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.connectionType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Online Status:</span>
              <span className="font-semibold text-emerald-500">{fingerprint.onlineStatus ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Timezone:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.timezone}</span>
            </div>
          </div>
        </div>

        {/* Hardware & System Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-500 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>Hardware & System</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Platform / OS:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.platform}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">CPU Cores (Threads):</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.hardwareConcurrency || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Estimated Device RAM:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.deviceMemory}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Screen Resolution:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.screenResolution} ({fingerprint.colorDepth}-bit)</span>
            </div>
          </div>
        </div>

        {/* Browser & Graphics Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <Monitor className="w-4 h-4" />
            <span>Browser & Graphics Rendering</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 gap-1">
              <span className="text-slate-500 shrink-0">User Agent:</span>
              <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all sm:text-right">{fingerprint.userAgent}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Browser Language:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.language} ({fingerprint.languages.join(', ')})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">WebGL Vendor:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.webglVendor}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">WebGL Renderer (GPU):</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.webglRenderer}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Cookies Enabled:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{fingerprint.cookieEnabled ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}