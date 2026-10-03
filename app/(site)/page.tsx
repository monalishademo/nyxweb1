'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Sun, Moon, Calendar, Clock, Heart } from 'lucide-react';
import Dashboard from './components/Dashboard';

// --- Dynamic Imports (SSR False to prevent DOMMatrix/Canvas/XLSX Errors) ---
const UniversalConverterTool = dynamic<any>(() => import('./components/convert/UniversalConverterTool'), { ssr: false });
const ChatWithPdfTool = dynamic<any>(() => import('./components/AI/ChatWithPdfTool'), { ssr: false });
const NotesPdfSummarizerTool = dynamic<any>(() => import('./components/AI/NotesPdfSummarizerTool'), { ssr: false });
const MergePdfTool = dynamic<any>(() => import('./components/pdf/MergePdfTool'), { ssr: false });
const SplitPdfTool = dynamic<any>(() => import('./components/pdf/SplitPdfTool'), { ssr: false });
const RotatePdfTool = dynamic<any>(() => import('./components/pdf/RotatePdfTool'), { ssr: false });
const WatermarkTool = dynamic<any>(() => import('./components/pdf/WatermarkTool'), { ssr: false });
const AddPageNumbersTool = dynamic<any>(() => import('./components/pdf/AddPageNumbersTool'), { ssr: false });
const ProtectPdfTool = dynamic<any>(() => import('./components/pdf/ProtectPdfTool'), { ssr: false });
const UnlockPdfTool = dynamic<any>(() => import('./components/pdf/UnlockPdfTool'), { ssr: false });
const CompressPdfTool = dynamic<any>(() => import('./components/pdf/CompressPdfTool'), { ssr: false });
const ImageToTextOcrTool = dynamic<any>(() => import('./components/AI/ImageToTextOcrTool'), { ssr: false });

// --- Network & Security Tools Dynamic Import ---
const InternetHealthTool = dynamic<any>(() => import('./components/Network & Security/InternetHealthTool'), { ssr: false });
const DeviceFingerprintTool = dynamic<any>(() => import('./components/Network & Security/DeviceFingerprintTool'), { ssr: false });
const SslCheckerTool = dynamic<any>(() => import('./components/Network & Security/SslCheckerTool'), { ssr: false });
const UrlEncoderTool = dynamic<any>(() => import('./components/Network & Security/UrlEncoderTool'), { ssr: false });
const DnsLookupTool = dynamic<any>(() => import('./components/Network & Security/DnsLookupTool'), { ssr: false });
const PasswordGeneratorTool = dynamic<any>(() => import('./components/Network & Security/PasswordGeneratorTool'), { ssr: false });
const PortCheckerTool = dynamic<any>(() => import('./components/Network & Security/PortCheckerTool'), { ssr: false });
const HeaderInspectorTool = dynamic<any>(() => import('./components/Network & Security/HeaderInspectorTool'), { ssr: false });

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

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
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

  const handleBackToDashboard = () => {
    setSelectedTool(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-5 font-sans transition-colors duration-200">
      <div>
        {/* Top Header with NYX WEB ONE Signature Branding */}
        <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md -mx-3 sm:-mx-5 -mt-3 sm:-mt-5 px-6 sm:px-12 py-3.5 mb-8 transition-colors">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            
            {/* Left: Signature NYX Logo + WEB ONE Subtitle */}
            <div
              onClick={handleBackToDashboard}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <span className="text-2xl font-black tracking-[0.25em] text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                NYX
              </span>
              <div className="h-4 w-[1.5px] bg-slate-200 dark:bg-slate-800"></div>
              <span className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                WEB ONE
              </span>
            </div>

            {/* Right: Actions Navigation */}
            <nav className="flex items-center gap-2.5 sm:gap-3">
              {/* Dashboard Nav Button */}
              <button
                onClick={handleBackToDashboard}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                Dashboard
              </button>

              {/* Admin Zone Link */}
              <Link
                href="/login"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-500 transition-all shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Admin Zone</span>
              </Link>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle Theme"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </nav>

          </div>
        </header>

        <main className="max-w-6xl mx-auto my-4">
          {/* 1. Dashboard */}
          {!selectedTool && <Dashboard onSelectTool={setSelectedTool} />}

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

          {/* 6. Network & Security Tools */}
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

          {/* 7. Utility Tools */}
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
      <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800/80 pt-6 pb-2 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()}{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              NYX
            </span>{' '}
            — All rights reserved.
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-2xs">
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
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Web Productivity</span>
          </div>
        </div>
      </footer>
    </div>
  );
}