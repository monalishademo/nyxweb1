'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Heart } from 'lucide-react';

export default function Footer() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Format Live Time (e.g., 10:45:12 AM)
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );

      // Format Date (e.g., Thursday, Jul 30, 2026)
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

  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & Copyright Info */}
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              NYX <span className="text-blue-600 dark:text-blue-400">ALL IN ONE</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} NYX ALL IN ONE — All rights reserved.
            </p>
          </div>

          {/* Live Date & Time Display */}
          <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{date || 'Loading date...'}</span>
            </div>
            
            <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700" />

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100 min-w-[90px]">
              <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>{time || '00:00:00 AM'}</span>
            </div>
          </div>

          {/* Tagline / Built with Info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for Web Developers & Users</span>
          </div>

        </div>
      </div>
    </footer>
  );
}