'use client';

import React, { useState } from 'react';
import { Sparkles, Mail, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';

interface AiEmailWriterProps {
  onBack?: () => void;
}

export default function AiEmailWriterTool({ onBack }: AiEmailWriterProps) {
  const [prompt, setPrompt] = useState('');
  const [recipient, setRecipient] = useState('');
  const [tone, setTone] = useState('Professional');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tones = ['Professional', 'Casual', 'Urgent', 'Polite', 'Persuasive'];

  const handleGenerateEmail = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setGeneratedEmail('');

    const fullPrompt = `Write a ${tone.toLowerCase()} email based on this requirement: "${prompt}". Recipient: ${recipient || 'Concerned Person'}. Include a clear Subject Line at the top.`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      const data = await response.json();

      // Groq Back-end output check (data.text)
      if (data?.text) {
        setGeneratedEmail(data.text);
      } else if (data?.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Failed to generate email. Please check your API setup.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI service.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedEmail) return;
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Email Generator</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">AI Email Writer</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Draft polished professional emails instantly powered by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card border rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-lg font-bold dark-text-main flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <span>Email Details</span>
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">What should the email be about? *</label>
            <textarea
              rows={3}
              placeholder="e.g. Requesting a leave for 2 days due to personal work..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">Recipient (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Manager / HR / Client"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">Select Tone</label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                    tone === t
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'dark-btn hover:border-blue-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateEmail}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI is writing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Email</span>
              </>
            )}
          </button>
        </div>

        <div className="dark-card border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold dark-text-main">Generated Email</h3>
              {generatedEmail && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Email'}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-sm dark-text-muted font-medium">Writing your email...</p>
              </div>
            ) : generatedEmail ? (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap dark-text-main text-xs sm:text-sm leading-relaxed font-sans">
                {generatedEmail}
              </div>
            ) : (
              <div className="text-center py-20 dark-text-muted space-y-2">
                <Mail className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">Your AI generated email draft will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}