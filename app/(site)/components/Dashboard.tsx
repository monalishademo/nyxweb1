'use client';

import React, { useState } from 'react';
import {
  FileText,
  Scissors,
  RotateCw,
  Stamp,
  Hash,
  Lock,
  Unlock,
  Archive,
  RefreshCw,
  Coins,
  Scale,
  Camera,
  Image as ImageIcon,
  Minimize2,
  QrCode,
  UserCheck,
  Clock,
  Calculator,
  Percent,
  Timer,
  Barcode,
  Volume2,
  Sparkles,
  ArrowRight,
  Search,
  Mail,
  Bot,
  FileSearch,
  CheckCircle2,
  AlignLeft,
  Share2,
  FileUser,
  Activity,
  Shield,
  Key,
  Wifi,
  Award,
  Palette,
  Layers
} from 'lucide-react';

interface DashboardProps {
  onSelectTool: (toolId: string) => void;
}

export default function Dashboard({ onSelectTool }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'AI Tools',
      description: 'Smart utilities powered by cutting-edge neural models.',
      badge: 'Artificial Intelligence',
      barColor: 'from-indigo-500 via-purple-500 to-pink-500',
      iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
      tools: [
        { id: 'ai-image-generator', name: 'AI Image Generator', icon: Sparkles },
        { id: 'ai-email-writer', name: 'AI Email Writer', icon: Mail },
        { id: 'chat-with-pdf', name: 'AI Talk with PDF', icon: Bot },
        { id: 'ai-ocr', name: 'AI Image to Text (OCR)', icon: FileSearch },
        { id: 'grammar-checker', name: 'Smart Grammar Checker', icon: CheckCircle2 },
        { id: 'notes-summarizer', name: 'AI Notes & PDF Summarizer', icon: AlignLeft },
        { id: 'social-post-generator', name: 'Social Media Post Generator', icon: Share2 },
        { id: 'resume-cover-letter', name: 'Resume & Cover Letter Builder', icon: FileUser },
      ],
    },
    {
      title: 'PDF Tools',
      description: 'Edit, compress and manage your PDF files effortlessly.',
      badge: 'PDF Utility',
      barColor: 'from-blue-500 via-cyan-500 to-teal-500',
      iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
      tools: [
        { id: 'merge-pdf', name: 'Merge PDF', icon: FileText },
        { id: 'split-pdf', name: 'Split & Page Selector', icon: Scissors },
        { id: 'rotate-pdf', name: 'Rotate PDF Pages', icon: RotateCw },
        { id: 'add-watermark', name: 'Add Watermark', icon: Stamp },
        { id: 'add-page-numbers', name: 'Add Page Numbers', icon: Hash },
        { id: 'protect-pdf', name: 'Protect / Lock PDF', icon: Lock },
        { id: 'unlock-pdf', name: 'Unlock PDF', icon: Unlock },
        { id: 'compress-pdf', name: 'Compress PDF', icon: Archive },
      ],
    },
    {
      title: 'Convert Tools',
      description: 'Convert documents, currency and physical measurements.',
      badge: 'Converter',
      barColor: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
      tools: [
        { id: 'universal-converter', name: 'Universal Smart Converter', icon: RefreshCw },
        { id: 'currency-converter', name: 'Currency Converter', icon: Coins },
        { id: 'unit-converter', name: 'Unit Converter', icon: Scale },
      ],
    },
    {
      title: 'Design Tools',
      description: 'Create professional certificates and graphics instantly.',
      badge: 'Creative',
      barColor: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
      tools: [
        { id: 'certificate-generator', name: 'Bulk Certificate Generator', icon: Award },
        { id: 'bulk-id-card', name: 'Bulk ID Card Generator', icon: Palette },
        { id: 'collage-maker', name: 'Photo Collage Maker', icon: ImageIcon },
        { id: 'text-behind-image', name: 'Text Behind Image Effect', icon: Layers },
      ],
    },
    {
      title: 'Image Tools',
      description: 'Edit, clean, resize and process photos in browser.',
      badge: 'Media',
      barColor: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
      tools: [
        { id: 'passport-photo', name: 'Passport Photo Creator', icon: Camera },
        { id: 'bg-remove', name: 'AI Background Remover', icon: ImageIcon },
        { id: 'compress-image', name: 'Compress Image Size', icon: Minimize2 },
        { id: 'batch-watermark', name: 'Batch Image Watermark', icon: Stamp },
      ],
    },
    {
      title: 'Excel Tools',
      description: 'Process, validate, and format Excel data sheets easily.',
      badge: 'Spreadsheet',
      barColor: 'from-green-500 to-emerald-700',
      iconBg: 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400',
      tools: [],
    },
    {
      title: 'Network & Security',
      description: 'Diagnose connection health, inspect IPs, and check security.',
      badge: 'Security',
      barColor: 'from-cyan-500 to-blue-700',
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
      tools: [
        { id: 'internet-health', name: 'Internet Health Check', icon: Activity },
        { id: 'device-fingerprint', name: 'Device & Network Fingerprint', icon: Shield },
        { id: 'ssl-checker', name: 'SSL Certificate Expiry Checker', icon: Lock },
        { id: 'url-encoder', name: 'URL Encoder / Decoder', icon: RefreshCw },
        { id: 'dns-lookup', name: 'DNS & Domain IP Lookup', icon: Search },
        { id: 'password-generator', name: 'Password & Hash Generator', icon: Key },
        { id: 'port-checker', name: 'Port Reachability Checker', icon: Wifi },
        { id: 'header-inspector', name: 'HTTP Header Inspector', icon: FileSearch },
      ],
    },
    {
      title: 'Utility Tools',
      description: 'Everyday essential utilities for rapid daily productivity.',
      badge: 'Utility',
      barColor: 'from-sky-500 to-blue-600',
      iconBg: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
      tools: [
        { id: 'qr-generator', name: 'QR Code Generator', icon: QrCode },
        { id: 'age-calculator', name: 'Super Age Calculator', icon: UserCheck },
        { id: 'world-clock', name: 'World Clock', icon: Clock },
        { id: 'calculator', name: 'Calculator & Notes', icon: Calculator },
        { id: 'percentage-calculator', name: 'Percentage Calculator', icon: Percent },
        { id: 'countdown-stopwatch', name: 'Timer & Stopwatch', icon: Timer },
        { id: 'barcode-generator', name: 'Barcode Generator', icon: Barcode },
        { id: 'text-to-speech', name: 'Text ⇌ Speech', icon: Volume2 },
      ],
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative text-center space-y-4 max-w-3xl mx-auto px-4 pt-2">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-40 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>All-in-One Utility Suite</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Free Tools to Make Your{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Life Simple
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal max-w-xl mx-auto leading-relaxed">
          Welcome to <strong className="font-semibold text-slate-900 dark:text-white tracking-wider">NYX WEB ONE</strong> — Fast, secure, and privacy-focused web utilities right in your browser.
        </p>

        {/* Search Bar */}
        <div className="pt-2 max-w-lg mx-auto relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tools (e.g. AI Image, Merge PDF, Convert)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-sm transition-all text-sm"
            />
          </div>
        </div>

      </div>

      {/* Grid Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {categories.map((cat, idx) => {
          const filteredTools = cat.tools.filter((t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (searchQuery && filteredTools.length === 0) return null;

          return (
            <div
              key={idx}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:border-indigo-200 dark:hover:border-slate-700 hover:-translate-y-2.5 hover:scale-[1.015] transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-default"
            >
              {/* Top Accent Gradient Line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cat.barColor} transition-all duration-300 group-hover:h-2`} />

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2 pt-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cat.title}
                  </h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {cat.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                  {cat.description}
                </p>

                {/* Tool Buttons List */}
                {filteredTools.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTools.map((tool) => {
                      const IconComponent = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => onSelectTool(tool.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/70 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-semibold transition-all duration-200 group/btn cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`p-1.5 rounded-xl ${cat.iconBg} transition-transform duration-200 group-hover/btn:scale-110`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">{tool.name}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover/btn:text-indigo-500 group/btn:translate-x-1 transition-transform shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium italic">
                    Coming Soon...
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <span>{filteredTools.length} {filteredTools.length === 1 ? 'utility' : 'utilities'}</span>
                {filteredTools.length > 0 && (
                  <span className="text-indigo-500 dark:text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 flex items-center gap-1">
                    Explore Tools →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}