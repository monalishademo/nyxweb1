'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';

export default function SmartGrammarCheckerTool({ onBack }: { onBack?: () => void }) {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCheckGrammar = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setCorrectedText('');

    const prompt = `Act as an expert English proofreader and editor. Fix all grammar, spelling, punctuation, and phrasing errors in the following text. Return ONLY the corrected version of the text without any extra explanation or introductory filler: "${inputText}"`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      // Groq Back-end output check (data.text)
      if (data?.text) {
        setCorrectedText(data.text);
      } else if (data?.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Could not check grammar. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI service.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!correctedText) return;
    navigator.clipboard.writeText(correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Proofreader</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">Smart Grammar Checker</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Instantly fix grammar, spelling, and sentence structures powered by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card border rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-lg font-bold dark-text-main flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Original Text</span>
          </h3>

          <textarea
            rows={8}
            placeholder="Paste or type your English text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />

          <button
            type="button"
            onClick={handleCheckGrammar}
            disabled={loading || !inputText.trim()}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Grammar...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Fix & Polish Grammar</span>
              </>
            )}
          </button>
        </div>

        <div className="dark-card border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold dark-text-main">Polished Version</h3>
              {correctedText && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Corrected Text'}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-sm dark-text-muted font-medium">Checking and refining your text...</p>
              </div>
            ) : correctedText ? (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap dark-text-main text-xs sm:text-sm leading-relaxed">
                {correctedText}
              </div>
            ) : (
              <div className="text-center py-20 dark-text-muted space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">Your grammar-corrected text will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}