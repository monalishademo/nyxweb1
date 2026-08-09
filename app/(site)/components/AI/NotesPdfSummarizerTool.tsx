'use client';

import React, { useState } from 'react';
import { Sparkles, AlignLeft, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';

export default function NotesPdfSummarizerTool({ pdfjs, onBack }: { pdfjs?: any; onBack?: () => void }) {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setSummary('');

    const prompt = `Please summarize the following notes/text in a concise, easy-to-read format. Break down the key takeaways into bullet points and provide a short overview at the top: "${inputText}"`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      // Groq Back-end output check (data.text)
      if (data?.text) {
        setSummary(data.text);
      } else if (data?.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Could not summarize text.');
      }
    } catch (err) {
      console.error(err);
      alert('AI Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Summarizer</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">AI Notes Summarizer</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Convert long notes, articles, and text into crisp bullet-point summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card border rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-lg font-bold dark-text-main flex items-center gap-2">
            <AlignLeft className="w-5 h-5 text-indigo-500" />
            <span>Input Notes / Article</span>
          </h3>

          <textarea
            rows={8}
            placeholder="Paste your large text, study notes, or document text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          <button
            type="button"
            onClick={handleSummarize}
            disabled={loading || !inputText.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Summarizing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Summarize Text</span>
              </>
            )}
          </button>
        </div>

        <div className="dark-card border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold dark-text-main">Key Summary</h3>
              {summary && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                <p className="text-sm dark-text-muted font-medium">Analyzing text and extracting key points...</p>
              </div>
            ) : summary ? (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap dark-text-main text-xs sm:text-sm leading-relaxed">
                {summary}
              </div>
            ) : (
              <div className="text-center py-20 dark-text-muted space-y-2">
                <AlignLeft className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">Your concise summary will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}