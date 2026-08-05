'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, Send, RefreshCw, FileText } from 'lucide-react';

export default function ChatWithPdfTool({ pdfjs, onBack }: { pdfjs?: any; onBack?: () => void }) {
  const [pdfText, setPdfText] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async () => {
    if (!userQuery.trim()) return;

    setLoading(true);
    setAnswer('');

    const prompt = pdfText.trim()
      ? `Based on the following document content:\n\n"${pdfText}"\n\nAnswer this user question concisely: "${userQuery}"`
      : `Answer the following question clearly: "${userQuery}"`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setAnswer(data.candidates[0].content.parts[0].text);
      } else {
        alert('Could not answer question.');
      }
    } catch (err) {
      console.error(err);
      alert('AI Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini AI PDF Assistant</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">AI Talk with PDF & Query</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Paste text or ask direct questions to extract information instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card border rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-lg font-bold dark-text-main flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-500" />
            <span>Document Content (Optional)</span>
          </h3>

          <textarea
            rows={5}
            placeholder="Paste text from your PDF or document here..."
            value={pdfText}
            onChange={(e) => setPdfText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">Your Question *</label>
            <input
              type="text"
              placeholder="e.g. What are the main key points of this text?"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAskQuestion}
            disabled={loading || !userQuery.trim()}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching Document...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ask Gemini AI</span>
              </>
            )}
          </button>
        </div>

        <div className="dark-card border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold dark-text-main">AI Response</h3>
            </div>

            {loading ? (
              <div className="text-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
                <p className="text-sm dark-text-muted font-medium">Analyzing document and generating response...</p>
              </div>
            ) : answer ? (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap dark-text-main text-xs sm:text-sm leading-relaxed">
                {answer}
              </div>
            ) : (
              <div className="text-center py-20 dark-text-muted space-y-2">
                <Bot className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">The answer to your query will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}