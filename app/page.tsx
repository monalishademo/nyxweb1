'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sun, Moon, Calendar, Clock, Heart } from 'lucide-react';
import Dashboard from './components/Dashboard';

// --- Dynamic Imports (SSR False to prevent DOMMatrix/Canvas Errors) ---
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
    <div className="min-h-screen flex flex-col justify-between p-5 font-sans transition-colors duration-200">
      <div>
        {/* Header Bar */}
        <header className="flex justify-between items-center max-w-6xl mx-auto py-4 border-b border-slate-200 dark:border-slate-800/60 mb-6">
          <h1
            className="text-2xl text-blue-600 dark:text-blue-400 font-normal cursor-pointer select-none flex items-center gap-2"
            onClick={handleBackToDashboard}
          >
            <span className="font-bold">NyxWeb1</span> Hub
          </h1>

          <nav className="flex items-center gap-3">
            <button
              onClick={handleBackToDashboard}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer mx-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Dashboard
            </button>

            {/* Theme Toggle Switch */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle Theme"
              className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-xs"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto my-6">
          {/* Global Back Button */}
          {selectedTool && (
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2.5 rounded-lg border-none bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 cursor-pointer mb-6 font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <span>←</span> Back to Dashboard
            </button>
          )}

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
          {selectedTool === 'compress-image' && <ImageCompressorTool />}
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

          {/* 6. Utility Tools */}
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

      {/* Footer Section */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800/80 pt-6 pb-2 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()}{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              NYX ALL IN ONE
            </span>{' '}
            — All rights reserved.
          </div>

          <div className="flex items-center gap-3 bg-slate-200/60 dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-300/50 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
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
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for Web Productivity</span>
          </div>
        </div>
      </footer>
    </div>
  );
}