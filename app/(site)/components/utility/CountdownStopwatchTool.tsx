'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Flag, ArrowLeft, Clock } from 'lucide-react';

type Mode = 'timer' | 'stopwatch';

function formatTime(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const cs = Math.floor((totalMs % 1000) / 10); // centiseconds
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

interface CountdownStopwatchProps {
  onBack?: () => void;
}

export default function CountdownStopwatchTool({ onBack }: CountdownStopwatchProps) {
  const [mode, setMode] = useState<Mode>('timer');

  // Stopwatch state
  const [swElapsed, setSwElapsed] = useState<number>(0);
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);
  const swStartRef = useRef<number>(0);
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer state
  const [timerInputMin, setTimerInputMin] = useState<number>(5);
  const [timerInputSec, setTimerInputSec] = useState<number>(0);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);
  const timerEndRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // --- Stopwatch handlers ---
  const startStopwatch = () => {
    swStartRef.current = Date.now() - swElapsed;
    swIntervalRef.current = setInterval(() => {
      setSwElapsed(Date.now() - swStartRef.current);
    }, 10);
    setSwRunning(true);
  };

  const pauseStopwatch = () => {
    if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    setSwRunning(false);
  };

  const resetStopwatch = () => {
    if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    setSwRunning(false);
    setSwElapsed(0);
    setLaps([]);
  };

  const addLap = () => setLaps((prev) => [...prev, swElapsed]);

  // --- Timer handlers ---
  const startTimer = () => {
    const totalMs = timerRemaining > 0 ? timerRemaining : (timerInputMin * 60 + timerInputSec) * 1000;
    if (totalMs <= 0) return;
    timerEndRef.current = Date.now() + totalMs;
    setTimerFinished(false);
    setTimerRunning(true);
    timerIntervalRef.current = setInterval(() => {
      const remaining = timerEndRef.current - Date.now();
      if (remaining <= 0) {
        setTimerRemaining(0);
        setTimerRunning(false);
        setTimerFinished(true);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      } else {
        setTimerRemaining(remaining);
      }
    }, 100);
  };

  const pauseTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setTimerFinished(false);
    setTimerRemaining(0);
  };

  const displayMs = timerRunning || timerRemaining > 0 ? timerRemaining : (timerInputMin * 60 + timerInputSec) * 1000;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Header */}
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
                Timer &amp; Stopwatch
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                UTILITY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Countdown timer and stopwatch, all in one place
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
        
        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMode('timer')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'timer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> Countdown Timer
          </button>
          <button
            onClick={() => setMode('stopwatch')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'stopwatch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Timer className="w-4 h-4" /> Stopwatch
          </button>
        </div>

        {mode === 'timer' ? (
          <div className="text-center space-y-6">
            {!timerRunning && timerRemaining === 0 && !timerFinished && (
              <div className="flex justify-center gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">Minutes</label>
                  <input
                    type="number"
                    min={0}
                    value={timerInputMin}
                    onChange={(e) => setTimerInputMin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center text-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">Seconds</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={timerInputSec}
                    onChange={(e) => setTimerInputSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-24 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center text-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className={`text-6xl sm:text-7xl font-black tracking-wider my-6 font-mono ${timerFinished ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-800 dark:text-slate-100'}`}>
              {formatTime(displayMs)}
            </div>

            {timerFinished && (
              <p className="text-rose-600 dark:text-rose-400 font-bold text-sm bg-rose-50 dark:bg-rose-950/40 py-2 rounded-xl border border-rose-200 dark:border-rose-900">
                ⏰ Time&apos;s up!
              </p>
            )}

            <div className="flex justify-center gap-3">
              {!timerRunning ? (
                <button onClick={startTimer} className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20">
                  <Play className="w-4 h-4" /> Start
                </button>
              ) : (
                <button onClick={pauseTimer} className="py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20">
                  <Pause className="w-4 h-4" /> Pause
                </button>
              )}
              <button onClick={resetTimer} className="py-3 px-6 rounded-2xl bg-slate-600 hover:bg-slate-700 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-6xl sm:text-7xl font-black tracking-wider my-6 font-mono text-slate-800 dark:text-slate-100">
              {formatTime(swElapsed)}
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              {!swRunning ? (
                <button onClick={startStopwatch} className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20">
                  <Play className="w-4 h-4" /> Start
                </button>
              ) : (
                <button onClick={pauseStopwatch} className="py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20">
                  <Pause className="w-4 h-4" /> Pause
                </button>
              )}
              <button onClick={addLap} disabled={!swRunning} className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20">
                <Flag className="w-4 h-4" /> Lap
              </button>
              <button onClick={resetStopwatch} className="py-3 px-6 rounded-2xl bg-slate-600 hover:bg-slate-700 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            {laps.length > 0 && (
              <div className="text-left max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-2 space-y-1 shadow-inner">
                {laps.map((lap, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                    <span className="text-slate-500">Lap {i + 1}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatTime(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}