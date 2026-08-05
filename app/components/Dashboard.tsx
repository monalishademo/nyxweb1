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
  FileUser
} from 'lucide-react';

interface DashboardProps {
  onSelectTool: (toolId: string) => void;
}

export default function Dashboard({ onSelectTool }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'AI Tools',
      description: 'Smart AI utilities powered by cutting-edge open models.',
      badge: 'Artificial Intelligence',
      color: 'from-purple-500 to-pink-600',
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
      badge: 'PDF',
      color: 'from-blue-500 to-indigo-600',
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
      description: 'Convert documents, currency and physical units.',
      badge: 'Convert',
      color: 'from-emerald-500 to-teal-600',
      tools: [
        { id: 'universal-converter', name: 'Universal Smart Converter', icon: RefreshCw },
        { id: 'currency-converter', name: 'Currency Converter', icon: Coins },
        { id: 'unit-converter', name: 'Unit Converter', icon: Scale },
      ],
    },
    {
      title: 'Image Tools',
      description: 'Edit, clean, resize and process photos instantly.',
      badge: 'Media',
      color: 'from-orange-500 to-amber-600',
      tools: [
        { id: 'passport-photo', name: 'Passport Photo Creator', icon: Camera },
        { id: 'bg-remove', name: 'AI Background Remover', icon: ImageIcon },
        { id: 'compress-image', name: 'Compress Image Size', icon: Minimize2 },
      ],
    },
    {
      title: 'Utility Tools',
      description: 'Everyday essential tools for rapid productivity.',
      badge: 'Utility',
      color: 'from-sky-500 to-cyan-600',
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
    <div className="space-y-10 py-2">
      
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold shadow-xs">
          <Sparkles className="w-4 h-4" />
          <span>All-in-One Utility Suite</span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight dark-text-main leading-tight">
          Free Tools to Make Your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Life Simple</span>
        </h2>
        
        <p className="dark-text-muted text-base sm:text-lg font-normal leading-relaxed">
          Welcome to <span className="font-semibold dark-text-main">NyxWeb1</span> — Fast, secure, and privacy-focused web tools right in your browser.
        </p>

        {/* Live Search Bar */}
        <div className="pt-2 max-w-md mx-auto relative">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools (e.g. AI Image, Passport, Compress)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl dark-input border placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2 sm:px-0">
        {categories.map((cat, idx) => {
          const filteredTools = cat.tools.filter((t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (searchQuery && filteredTools.length === 0) return null;

          return (
            <div
              key={idx}
              className="group relative dark-card border rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-6 right-6 h-1.5 rounded-b-full bg-gradient-to-r ${cat.color}`} />

              <div>
                <div className="flex items-center justify-between mb-3 pt-2">
                  <h3 className="text-xl font-bold tracking-tight dark-text-main">
                    {cat.title}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {cat.badge}
                  </span>
                </div>

                <p className="dark-text-muted text-xs sm:text-sm mb-6 leading-relaxed">
                  {cat.description}
                </p>

                <div className="space-y-2">
                  {filteredTools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl dark-btn border hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-all duration-150 group/btn cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <IconComponent className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors flex-shrink-0" />
                          <span className="truncate">{tool.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 group-hover/btn:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs dark-text-muted font-medium">
                <span>{filteredTools.length} Tools</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}