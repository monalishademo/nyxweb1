'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { Sun, Moon, Calendar, Clock, Heart, ArrowUp, Search, CornerDownLeft } from 'lucide-react';
import Dashboard, { CATEGORIES } from './components/Dashboard';
import RadioPlayer from './components/RadioPlayer';

// ---------------------------------------------------------------------------
// Helpers: skeleton, magnetic wrapper, command palette
// ---------------------------------------------------------------------------

// Shown while a lazy-loaded tool is downloading
function ToolSkeleton() {
  return (
    <div className="anim-fade-quick space-y-5 p-1" aria-busy="true" aria-label="Loading tool">
      <div className="skeleton h-9 w-40 rounded-xl" />
      <div className="skeleton h-5 w-2/3 rounded-lg" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="skeleton h-72 rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-12 rounded-2xl" />
          <div className="skeleton h-12 rounded-2xl" />
          <div className="skeleton h-12 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// Button gently follows the cursor when it gets close
function Magnetic({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0, active: false });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setOffset({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
      active: true,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0, active: false })}
      className="inline-flex p-2 -m-2"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.active
          ? 'transform 120ms ease-out'
          : 'transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {children}
    </div>
  );
}

const ALL_TOOLS = CATEGORIES.flatMap((cat) =>
  cat.tools.map((tool) => ({ ...tool, category: cat.title, iconBg: cat.iconBg }))
);

const RING_LEN = 2 * Math.PI * 20; // back-to-top progress ring

function CommandPalette({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (toolId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const terms = query.toLowerCase().split(' ').filter(Boolean);
  const results = ALL_TOOLS.filter((t) => {
    const hay = `${t.name} ${t.category}`.toLowerCase();
    return terms.every((term) => hay.includes(term));
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const picked = results[active];
      if (picked) onSelect(picked.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="anim-fade-quick fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh] bg-slate-950/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onClick={(e) => e.stopPropagation()}
        className="anim-pop-in w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tools..."
            className="w-full py-4 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
              No tools found
            </div>
          ) : (
            results.map((tool, i) => {
              const Icon = tool.icon;
              const isActive = i === active;
              return (
                <button
                  key={tool.id}
                  data-active={isActive}
                  onMouseMove={() => setActive(i)}
                  onClick={() => onSelect(tool.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className={`p-1.5 rounded-lg ${tool.iconBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{tool.name}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {tool.category}
                    {isActive && <CornerDownLeft className="w-3 h-3 text-indigo-500" />}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// --- Dynamic Imports (SSR False to prevent DOMMatrix/Canvas/XLSX Errors) ---
const UniversalConverterTool = dynamic<any>(() => import('./components/convert/UniversalConverterTool'), { ssr: false, loading: ToolSkeleton });
const ChatWithPdfTool = dynamic<any>(() => import('./components/AI/ChatWithPdfTool'), { ssr: false, loading: ToolSkeleton });
const NotesPdfSummarizerTool = dynamic<any>(() => import('./components/AI/NotesPdfSummarizerTool'), { ssr: false, loading: ToolSkeleton });
const MergePdfTool = dynamic<any>(() => import('./components/pdf/MergePdfTool'), { ssr: false, loading: ToolSkeleton });
const SplitPdfTool = dynamic<any>(() => import('./components/pdf/SplitPdfTool'), { ssr: false, loading: ToolSkeleton });
const RotatePdfTool = dynamic<any>(() => import('./components/pdf/RotatePdfTool'), { ssr: false, loading: ToolSkeleton });
const WatermarkTool = dynamic<any>(() => import('./components/pdf/WatermarkTool'), { ssr: false, loading: ToolSkeleton });
const AddPageNumbersTool = dynamic<any>(() => import('./components/pdf/AddPageNumbersTool'), { ssr: false, loading: ToolSkeleton });
const ProtectPdfTool = dynamic<any>(() => import('./components/pdf/ProtectPdfTool'), { ssr: false, loading: ToolSkeleton });
const UnlockPdfTool = dynamic<any>(() => import('./components/pdf/UnlockPdfTool'), { ssr: false, loading: ToolSkeleton });
const CompressPdfTool = dynamic<any>(() => import('./components/pdf/CompressPdfTool'), { ssr: false, loading: ToolSkeleton });
const ImageToTextOcrTool = dynamic<any>(() => import('./components/AI/ImageToTextOcrTool'), { ssr: false, loading: ToolSkeleton });

// --- Design Tools Dynamic Import ---
const CertificateGeneratorTool = dynamic<any>(() => import('./components/Design/CertificateGeneratorTool'), { ssr: false, loading: ToolSkeleton });
const BulkIdCardGenerator = dynamic<any>(() => import('./components/Design/BulkIdCardGenerator'), { ssr: false, loading: ToolSkeleton });
const CollageMakerTool = dynamic<any>(() => import('./components/Design/CollageMakerTool'), { ssr: false, loading: ToolSkeleton });
const TextBehindImageTool = dynamic<any>(() => import('./components/Design/TextBehindImageTool'), { ssr: false, loading: ToolSkeleton });

// --- Image Tools Dynamic Import ---
const BatchWatermarkTool = dynamic<any>(() => import('./components/image/BatchWatermarkTool'), { ssr: false, loading: ToolSkeleton });

// --- Network & Security Tools Dynamic Import ---
const InternetHealthTool = dynamic<any>(() => import('./components/Network & Security/InternetHealthTool'), { ssr: false, loading: ToolSkeleton });
const DeviceFingerprintTool = dynamic<any>(() => import('./components/Network & Security/DeviceFingerprintTool'), { ssr: false, loading: ToolSkeleton });
const SslCheckerTool = dynamic<any>(() => import('./components/Network & Security/SslCheckerTool'), { ssr: false, loading: ToolSkeleton });
const UrlEncoderTool = dynamic<any>(() => import('./components/Network & Security/UrlEncoderTool'), { ssr: false, loading: ToolSkeleton });
const DnsLookupTool = dynamic<any>(() => import('./components/Network & Security/DnsLookupTool'), { ssr: false, loading: ToolSkeleton });
const PasswordGeneratorTool = dynamic<any>(() => import('./components/Network & Security/PasswordGeneratorTool'), { ssr: false, loading: ToolSkeleton });
const PortCheckerTool = dynamic<any>(() => import('./components/Network & Security/PortCheckerTool'), { ssr: false, loading: ToolSkeleton });
const HeaderInspectorTool = dynamic<any>(() => import('./components/Network & Security/HeaderInspectorTool'), { ssr: false, loading: ToolSkeleton });

// --- Regular AI Tools Imports ---
import AiImageGeneratorTool from './components/AI/AiImageGeneratorTool';
import AiEmailWriterTool from './components/AI/AiEmailWriterTool';
import SmartGrammarCheckerTool from './components/AI/SmartGrammarCheckerTool';
import SocialMediaPostGeneratorTool from './components/AI/SocialMediaPostGeneratorTool';
import ResumeCoverLetterTool from './components/AI/ResumeCoverLetterTool';

// --- Image Tools Imports ---
import ImageCompressorTool from './components/image/ImageCompressorTool';
import BgRemoverTool from './components/image/BgRemoverTool';
import PassportPhotoTool from './components/image/PassportPhotoTool';

// --- Convert Tools Imports ---
import CurrencyConverterTool from './components/convert/CurrencyConverterTool';
import UnitConverterTool from './components/convert/UnitConverterTool';

// --- Utility Tools Imports ---
import WorldClockTool from './components/utility/WorldClockTool';
import CalculatorTool from './components/utility/CalculatorTool';
import PercentageCalculatorTool from './components/utility/PercentageCalculatorTool';
import CountdownStopwatchTool from './components/utility/CountdownStopwatchTool';
import BarcodeGeneratorTool from './components/utility/BarcodeGeneratorTool';
import TextToSpeechTool from './components/utility/TextToSpeechTool';
import QrGeneratorTool from './components/utility/QrGeneratorTool';
import AgeCalculatorTool from './components/utility/AgeCalculatorTool';

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [pdfjs, setPdfjs] = useState<unknown>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [replayKey, setReplayKey] = useState<number>(0);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [showTop, setShowTop] = useState<boolean>(false);
  const [modKey, setModKey] = useState<string>('Ctrl');
  const barRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  // Live Time & Date State
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  // Initialize Dark Mode state safely on client mount
  useEffect(() => {
    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Ctrl/Cmd + K opens the command palette
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setModKey('⌘');
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll progress bar + back-to-top ring
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_LEN * (1 - p));
      setShowTop(window.scrollY > 400);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Toggle Dark Mode (circle grows out of the button, View Transition API)
  const toggleDarkMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const toDark = !root.classList.contains('dark');

    const applyTheme = () => {
      root.classList.toggle('dark', toDark);
      localStorage.setItem('theme', toDark ? 'dark' : 'light');
      setDarkMode(toDark);
    };

    const startViewTransition = (document as any).startViewTransition?.bind(document);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Older browsers (e.g. Firefox) or reduced motion: plain instant switch
    if (!startViewTransition || reduceMotion) {
      applyTheme();
      return;
    }

    // Circle starts from the centre of the clicked button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Stop colour transitions so the new snapshot is captured cleanly
    root.classList.add('theme-switching');

    const transition = startViewTransition(() => {
      flushSync(applyTheme);
    });

    transition.ready.then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 750,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });

    transition.finished.finally(() => {
      root.classList.remove('theme-switching');
    });
  };

  // PDF.js Dynamic Import
  useEffect(() => {
    import('pdfjs-dist')
      .then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        setPdfjs(pdfjsLib);
      })
      .catch((err) => {
        console.error('PDF.js load error:', err);
      });
  }, []);

  // Live Time Clock Interval
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

  const handleSelectTool = (toolId: string) => {
    setPaletteOpen(false);
    setSelectedTool(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Every click on Dashboard / NYX logo replays the intro animations
  const handleBackToDashboard = () => {
    setSelectedTool(null);
    setReplayKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-3 sm:p-5 font-sans transition-colors duration-200">
      {/* Textured background: dot grid + film grain (no blur / glass) */}
      <div aria-hidden="true" className="bg-texture pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden="true" className="bg-grain pointer-events-none fixed inset-0 -z-10" />

      {/* Scroll progress bar */}
      <div aria-hidden="true" className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none">
        <div
          ref={barRef}
          className="h-full origin-left bg-gradient-to-r from-emerald-400 via-indigo-500 to-pink-500"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Back to top (with progress ring) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald-500 cursor-pointer transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
          showTop
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-8 opacity-0 scale-50 pointer-events-none'
        }`}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" strokeWidth="2.5" className="stroke-slate-200 dark:stroke-slate-800" />
          <circle
            ref={ringRef}
            cx="24"
            cy="24"
            r="20"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-emerald-500"
            style={{ strokeDasharray: RING_LEN, strokeDashoffset: RING_LEN }}
          />
        </svg>
        <ArrowUp className="w-4 h-4" />
      </button>

      <div>
        {/* Top Header with NYX WEB ONE Signature Branding (mobile responsive) */}
        <header className="anim-slide-down border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 -mx-3 sm:-mx-5 -mt-3 sm:-mt-5 px-3 sm:px-6 md:px-12 py-3 sm:py-3.5 mb-8 transition-colors">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2">

            {/* Left: Signature NYX Logo + WEB ONE Subtitle */}
            <div
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0 whitespace-nowrap mr-auto"
            >
              <span key={replayKey} className="text-xl sm:text-2xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-slate-900 dark:text-white group-hover:text-emerald-500 group-hover:tracking-[0.35em] transition-all duration-300">
                {'NYX'.split('').map((ch, i) => (
                  <span
                    key={i}
                    className="anim-drop-in inline-block"
                    style={{ animationDelay: `${300 + i * 110}ms` }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              <div className="h-4 w-[1.5px] bg-slate-200 dark:bg-slate-800"></div>
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                WEB ONE
              </span>
            </div>

            {/* Right: Actions Navigation
                Mobile: "contents" (children become direct items of the header row, radio wraps to its own line)
                PC (md+): normal flex row like before */}
            <nav className="contents md:flex md:items-center md:gap-3">
              {/* Dashboard Nav Button (hidden on mobile, logo already goes home) */}
              <div className="hidden sm:block">
                <Magnetic>
                  <button
                    onClick={handleBackToDashboard}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
                  >
                    Dashboard
                  </button>
                </Magnetic>
              </div>

              {/* Command palette trigger */}
              <Magnetic>
                <button
                  onClick={() => setPaletteOpen(true)}
                  aria-label="Search tools"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-500 transition-all cursor-pointer active:scale-95"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                  <kbd className="hidden md:inline px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {modKey} K
                  </kbd>
                </button>
              </Magnetic>

              {/* Dynamic Indian Radio Player Widget
                  Mobile: own full-width line below | PC: inline as before */}
              <div className="order-last basis-full min-w-0 md:order-none md:basis-auto">
                <RadioPlayer />
              </div>

              {/* Admin Zone Link ("Admin" on mobile) */}
              <Magnetic>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-500 transition-all shadow-2xs hover:-translate-y-0.5 active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden sm:inline">Admin Zone</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
              </Magnetic>

              <div className="hidden md:block h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

              {/* Theme Toggle Button */}
              <Magnetic>
                <button
                  onClick={toggleDarkMode}
                  aria-label="Toggle Theme"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-200 dark:border-slate-800 shadow-2xs hover:scale-110 active:scale-90"
                >
                  {darkMode ? (
                    <Sun key="sun" className="w-4 h-4 text-amber-400 anim-rotate-in" />
                  ) : (
                    <Moon key="moon" className="w-4 h-4 text-slate-600 anim-rotate-in" />
                  )}
                </button>
              </Magnetic>
            </nav>

          </div>
        </header>

        <main key={`${selectedTool ?? 'dashboard'}-${replayKey}`} className="max-w-6xl mx-auto my-4 anim-fade-quick">
          {/* 1. Dashboard */}
          {!selectedTool && <Dashboard onSelectTool={handleSelectTool} />}

          {/* 2. AI Tools */}
          {selectedTool === 'ai-image-generator' && (
            <AiImageGeneratorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'ai-email-writer' && (
            <AiEmailWriterTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'chat-with-pdf' && (
            <ChatWithPdfTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'ai-ocr' && (
            <ImageToTextOcrTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'grammar-checker' && (
            <SmartGrammarCheckerTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'notes-summarizer' && (
            <NotesPdfSummarizerTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'social-post-generator' && (
            <SocialMediaPostGeneratorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'resume-cover-letter' && (
            <ResumeCoverLetterTool onBack={handleBackToDashboard} />
          )}

          {/* 3. Image Tools */}
          {selectedTool === 'compress-image' && (
            <ImageCompressorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'bg-remove' && (
            <BgRemoverTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'passport-photo' && <PassportPhotoTool />}
          {selectedTool === 'batch-watermark' && (
            <BatchWatermarkTool onBack={handleBackToDashboard} />
          )}

          {/* 4. PDF Tools */}
          {selectedTool === 'merge-pdf' && (
            <MergePdfTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'split-pdf' && (
            <SplitPdfTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'rotate-pdf' && (
            <RotatePdfTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'add-watermark' && (
            <WatermarkTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'add-page-numbers' && (
            <AddPageNumbersTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'protect-pdf' && (
            <ProtectPdfTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'unlock-pdf' && (
            <UnlockPdfTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'compress-pdf' && (
            <CompressPdfTool pdfjs={pdfjs} onBack={handleBackToDashboard} />
          )}

          {/* 5. Convert Tools */}
          {selectedTool === 'universal-converter' && (
            <UniversalConverterTool
              pdfjs={pdfjs}
              onBack={handleBackToDashboard}
            />
          )}
          {selectedTool === 'currency-converter' && (
            <CurrencyConverterTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'unit-converter' && (
            <UnitConverterTool onBack={handleBackToDashboard} />
          )}

          {/* 6. Design Tools */}
          {selectedTool === 'certificate-generator' && (
            <CertificateGeneratorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'bulk-id-card' && (
            <BulkIdCardGenerator onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'collage-maker' && (
            <CollageMakerTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'text-behind-image' && (
            <TextBehindImageTool onBack={handleBackToDashboard} />
          )}

          {/* 7. Network & Security Tools */}
          {selectedTool === 'internet-health' && (
            <InternetHealthTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'device-fingerprint' && (
            <DeviceFingerprintTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'ssl-checker' && (
            <SslCheckerTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'url-encoder' && (
            <UrlEncoderTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'dns-lookup' && (
            <DnsLookupTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'password-generator' && (
            <PasswordGeneratorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'port-checker' && (
            <PortCheckerTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'header-inspector' && (
            <HeaderInspectorTool onBack={handleBackToDashboard} />
          )}

          {/* 8. Utility Tools */}
          {selectedTool === 'world-clock' && (
            <WorldClockTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'calculator' && (
            <CalculatorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'percentage-calculator' && (
            <PercentageCalculatorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'countdown-stopwatch' && (
            <CountdownStopwatchTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'barcode-generator' && (
            <BarcodeGeneratorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'text-to-speech' && (
            <TextToSpeechTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'qr-generator' && (
            <QrGeneratorTool onBack={handleBackToDashboard} />
          )}
          {selectedTool === 'age-calculator' && (
            <AgeCalculatorTool onBack={handleBackToDashboard} />
          )}
        </main>
      </div>

      {/* Modern Footer Section */}
      <footer className="anim-fade-in mt-12 border-t border-slate-200/80 dark:border-slate-800/80 pt-6 pb-2 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()}{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              NYX
            </span>{' '}
            — All rights reserved.
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-2xs transition-transform hover:scale-105">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{date || 'Loading date...'}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-semibold min-w-[85px]">
              <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>{time || '00:00:00 AM'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 anim-heartbeat" />
            <span>for Web Productivity</span>
          </div>
        </div>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handleSelectTool}
      />
    </div>
  );
}