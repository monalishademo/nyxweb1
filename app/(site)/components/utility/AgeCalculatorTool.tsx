'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Rocket, PartyPopper, ArrowLeft } from 'lucide-react';

interface AgeCalculatorProps {
  onBack?: () => void;
}

export default function AgeCalculatorTool({ onBack }: AgeCalculatorProps) {
  const [birthDate, setBirthDate] = useState<string>('2000-01-01');
  const [now, setNow] = useState<Date>(new Date());

  // Real-time ticking clock for exact seconds calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dob = new Date(birthDate);
  const isValidDate = !isNaN(dob.getTime());

  // Calculations
  const diffMs = isValidDate ? Math.max(0, now.getTime() - dob.getTime()) : 0;
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Exact Years, Months, Days breakdown
  let years = 0;
  let months = 0;
  let days = 0;

  if (isValidDate) {
    let temp = new Date(dob);
    years = now.getFullYear() - temp.getFullYear();
    months = now.getMonth() - temp.getMonth();
    days = now.getDate() - temp.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  // Speed of Light Travel Distance (c = 299,792,458 m/s)
  const lightDistanceKm = (totalSeconds * 299792.458).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // Sundays Counted
  const countSundays = () => {
    if (!isValidDate) return 0;
    let count = 0;
    let cur = new Date(dob);
    while (cur <= now) {
      if (cur.getDay() === 0) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Header with Clean Utility Badge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Super Age &amp; Life Stats Calculator
              </h1>
              {/* 👈 আইকন ছাড়া একদম ক্লিন ইউটিলিটি ব্যাজ */}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                UTILITY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Calculate exact age, time elapsed, and cosmic life stats instantly
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Date Picker Input Box */}
        <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Select Your Date of Birth
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {isValidDate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Main Age Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-600 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/20 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Exact Age Breakdown
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">
                  {years} <span className="text-sm font-normal opacity-90">Years</span>{' '}
                  {months} <span className="text-sm font-normal opacity-90">Months</span>{' '}
                  {days} <span className="text-sm font-normal opacity-90">Days</span>
                </div>
              </div>
              <p className="text-xs opacity-85 border-t border-white/10 pt-3">
                Live ticking continuously with current time.
              </p>
            </div>

            {/* Time Units Stats */}
            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Total Time Elapsed
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                <li className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Total Hours:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalHours.toLocaleString()}</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Total Minutes:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalMinutes.toLocaleString()}</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="text-slate-500">Total Seconds:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalSeconds.toLocaleString()}</span>
                </li>
              </ul>
            </div>

            {/* Cosmic Light Travel Distance */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 p-6 rounded-3xl shadow-md flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-1">
                  <Rocket className="w-3.5 h-3.5" /> Speed of Light Travel
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">Distance light traveled during your lifespan:</p>
                <div className="text-xl sm:text-2xl font-black text-slate-100 break-all">
                  {lightDistanceKm} <span className="text-sm font-bold text-sky-400">KM</span>
                </div>
              </div>
            </div>

            {/* Sundays Enjoyed */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-6 rounded-3xl flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                  <PartyPopper className="w-3.5 h-3.5" /> Sundays Enjoyed
                </h3>
                <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200 my-1">
                  {countSundays().toLocaleString()} <span className="text-sm font-semibold">Sundays</span>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  Total relaxing weekend Sundays lived so far!
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}