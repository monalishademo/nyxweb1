'use client';

import React, { useState, useMemo } from 'react';
import { Percent, ArrowLeft, TrendingUp, HelpCircle, SlidersHorizontal } from 'lucide-react';

type Mode = 'basic' | 'whatPercent' | 'change';

interface PercentageCalculatorProps {
  onBack?: () => void;
}

export default function PercentageCalculatorTool({ onBack }: PercentageCalculatorProps) {
  const [mode, setMode] = useState<Mode>('basic');

  // Mode 1: X% of Y
  const [basicPercent, setBasicPercent] = useState<string>('20');
  const [basicValue, setBasicValue] = useState<string>('150');

  // Mode 2: X is what % of Y
  const [partValue, setPartValue] = useState<string>('30');
  const [wholeValue, setWholeValue] = useState<string>('150');

  // Mode 3: percentage change from X to Y
  const [oldValue, setOldValue] = useState<string>('100');
  const [newValue, setNewValue] = useState<string>('120');

  const basicResult = useMemo(() => {
    const p = parseFloat(basicPercent);
    const v = parseFloat(basicValue);
    if (isNaN(p) || isNaN(v)) return '';
    return ((p / 100) * v).toFixed(2);
  }, [basicPercent, basicValue]);

  const whatPercentResult = useMemo(() => {
    const part = parseFloat(partValue);
    const whole = parseFloat(wholeValue);
    if (isNaN(part) || isNaN(whole) || whole === 0) return '';
    return ((part / whole) * 100).toFixed(2);
  }, [partValue, wholeValue]);

  const changeResult = useMemo(() => {
    const o = parseFloat(oldValue);
    const n = parseFloat(newValue);
    if (isNaN(o) || isNaN(n) || o === 0) return null;
    const pct = ((n - o) / Math.abs(o)) * 100;
    return { pct: pct.toFixed(2), isIncrease: pct >= 0 };
  }, [oldValue, newValue]);

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
                Percentage Calculator
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                UTILITY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Three common percentage calculations, all in one tool
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
        
        {/* Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            ['basic', 'What is X% of Y?', Percent],
            ['whatPercent', 'X is what % of Y?', HelpCircle],
            ['change', '% Change from X to Y', TrendingUp],
          ].map(([m, label, Icon]: any) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === m
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Calculator Body Panel */}
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          {mode === 'basic' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Percentage (%)</label>
                  <input
                    type="number"
                    value={basicPercent}
                    onChange={(e) => setBasicPercent(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Of Value</label>
                  <input
                    type="number"
                    value={basicValue}
                    onChange={(e) => setBasicValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="text-center p-6 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-1 shadow-inner">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{basicPercent}% of {basicValue} is</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{basicResult || '—'}</div>
              </div>
            </>
          )}

          {mode === 'whatPercent' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Part (X)</label>
                  <input
                    type="number"
                    value={partValue}
                    onChange={(e) => setPartValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Whole (Y)</label>
                  <input
                    type="number"
                    value={wholeValue}
                    onChange={(e) => setWholeValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="text-center p-6 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-1 shadow-inner">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{partValue} is</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{whatPercentResult ? `${whatPercentResult}%` : '—'}</div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">of {wholeValue}</span>
              </div>
            </>
          )}

          {mode === 'change' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Old Value (X)</label>
                  <input
                    type="number"
                    value={oldValue}
                    onChange={(e) => setOldValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">New Value (Y)</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className={`text-center p-6 rounded-2xl border space-y-1 shadow-inner ${changeResult?.isIncrease ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                <span className="text-xs font-semibold">{changeResult?.isIncrease ? 'Increase' : 'Decrease'} of</span>
                <div className="text-3xl font-black">
                  {changeResult ? `${changeResult.isIncrease ? '+' : ''}${changeResult.pct}%` : '—'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}