'use client';

import React, { useState } from 'react';
import { Calculator, FileText, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  time: string;
}

interface CalculatorToolProps {
  onBack?: () => void;
}

export default function CalculatorTool({ onBack }: CalculatorToolProps) {
  const [display, setDisplay] = useState<string>('0');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');

  const handleBtnClick = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleDelete = () => {
    if (display.length === 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleCalculate = () => {
    try {
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
      const res = eval(sanitized);
      setDisplay(String(Number(res.toFixed(8))));
    } catch {
      setDisplay('Error');
    }
  };

  const handleAddNote = () => {
    if (!currentNote.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: currentNote,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotes([newNote, ...notes]);
    setCurrentNote('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

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
                Scientific Calculator &amp; Quick Notes
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                UTILITY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Perform fast calculations and save quick notes or history instantly
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Calculator Block */}
        <div className="lg:col-span-6 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl shadow-lg border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" /> Calculator Display
            </span>
          </div>

          {/* Screen Display */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-sky-400 text-3xl font-mono font-bold text-right min-h-[70px] flex items-center justify-end break-all shadow-inner">
            {display}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {['C', '⌫', '(', ')'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else if (btn === '⌫') handleDelete();
                  else handleBtnClick(btn);
                }}
                className="py-4 text-base font-bold rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 transition-all cursor-pointer shadow-sm"
              >
                {btn}
              </button>
            ))}

            {['7', '8', '9', '÷'].map((btn) => (
              <button
                key={btn}
                onClick={() => (btn === '÷' ? handleBtnClick('/') : handleBtnClick(btn))}
                className={`py-4 text-base font-bold rounded-2xl border transition-all cursor-pointer shadow-sm ${
                  btn === '÷'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-100 border-slate-700/50'
                }`}
              >
                {btn}
              </button>
            ))}

            {['4', '5', '6', '×'].map((btn) => (
              <button
                key={btn}
                onClick={() => (btn === '×' ? handleBtnClick('*') : handleBtnClick(btn))}
                className={`py-4 text-base font-bold rounded-2xl border transition-all cursor-pointer shadow-sm ${
                  btn === '×'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-100 border-slate-700/50'
                }`}
              >
                {btn}
              </button>
            ))}

            {['1', '2', '3', '-'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleBtnClick(btn)}
                className={`py-4 text-base font-bold rounded-2xl border transition-all cursor-pointer shadow-sm ${
                  btn === '-'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-100 border-slate-700/50'
                }`}
              >
                {btn}
              </button>
            ))}

            {['0', '.', '=', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === '=') handleCalculate();
                  else handleBtnClick(btn);
                }}
                className={`py-4 text-base font-bold rounded-2xl border transition-all cursor-pointer shadow-sm ${
                  btn === '='
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/20'
                    : btn === '+'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-100 border-slate-700/50'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Notes Block */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" /> Quick Scratchpad &amp; Notes
              </span>
            </div>

            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="Save calculation note..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={handleAddNote}
                className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {notes.length === 0 ? (
                <div className="text-center py-20 text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto opacity-20" />
                  <p className="text-xs">No notes saved yet.</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-inner"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{note.text}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{note.time}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}