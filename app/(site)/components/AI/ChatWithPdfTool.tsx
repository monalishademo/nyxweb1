'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, Send, RefreshCw, FileText, ArrowLeft, CheckCircle2, Copy, Check, Upload, Layers } from 'lucide-react';

interface ChatWithPdfProps {
  pdfjs?: any;
  onBack?: () => void;
}

export default function ChatWithPdfTool({ pdfjs, onBack }: ChatWithPdfProps) {
  const [pdfText, setPdfText] = useState('');
  const [fileName, setFileName] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [copied, setCopied] = useState(false);

  // ব্রাউজারে পিডিএফ রিড করার চেষ্টা, ফেইল করলে ইউজারকে ফেন্ডলি নোটিফিকেশন দেওয়া
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setLoadingAction('Reading PDF file...');

    try {
      const reader = new FileReader();
      reader.onload = async function () {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          // লোকাল বা সঠিক ওয়ার্কার পাথ সেট করা
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

          const typedArray = new Uint8Array(this.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
          }

          setPdfText(fullText);
          setLoading(false);
          setLoadingAction('');
        } catch (err) {
          console.error(err);
          setLoading(false);
          setLoadingAction('');
          setPdfText(`[File Uploaded: ${file.name}] (Note: Automatic text extraction was restricted by browser security. Please paste the document text below if needed, or ask your query directly.)`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setLoading(false);
      setLoadingAction('');
      alert('Error reading file.');
    }
  };

  const handleAiAction = async (actionType: 'query' | 'summary' | 'questions', customPrompt?: string) => {
    const targetQuery = customPrompt || userQuery;
    if (actionType === 'query' && !targetQuery.trim()) return;

    setLoading(true);
    setLoadingAction(
      actionType === 'summary' ? 'Generating Document Summary...' :
      actionType === 'questions' ? 'Creating Model Questions...' : 'Analyzing Document...'
    );
    setAnswer('');

    let promptText = '';
    if (actionType === 'summary') {
      promptText = `Provide a comprehensive, well-structured summary of the following document/text:\n\n"${pdfText}"`;
    } else if (actionType === 'questions') {
      promptText = `Based on the following document/text, generate a set of important model questions with answers for study:\n\n"${pdfText}"`;
    } else {
      promptText = pdfText.trim()
        ? `Context / Document:\n"${pdfText}"\n\nUser Question: "${targetQuery}"\n\nAnswer concisely and accurately based on the context.`
        : `Answer the following question clearly and professionally: "${targetQuery}"`;
    }

    try {
      const response = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          prompt: promptText,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.result || data.text)) {
        setAnswer(data.result || data.text);
      } else {
        alert(data.error || 'Could not process request.');
      }
    } catch (err) {
      console.error(err);
      alert('AI Server connection error.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                AI PDF & Document Assistant
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold tracking-wider">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Powered by NYX Mind
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            
            {/* PDF Upload Box */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                Upload PDF Document
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <Upload className="w-6 h-6 mb-2 text-indigo-500" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {fileName ? fileName : 'Click to upload PDF or drag & drop'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Attach document reference</p>
                </div>
                <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" disabled={loading} />
              </label>
            </div>

            {/* Document Content Textarea */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                Document Content / Text
              </label>
              <textarea
                rows={4}
                placeholder="Paste text or upload PDF above..."
                value={pdfText}
                onChange={(e) => setPdfText(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Quick Automation Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAiAction('summary')}
                disabled={loading || !pdfText.trim()}
                className="py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-purple-600 dark:text-purple-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto Summary</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('questions')}
                disabled={loading || !pdfText.trim()}
                className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Model Questions</span>
              </button>
            </div>

            {/* Direct Query Input */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Bot className="w-3.5 h-3.5 text-indigo-500" />
                Ask Custom Question *
              </label>
              <input
                type="text"
                placeholder="e.g. What are the key takeaways?"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => handleAiAction('query')}
              disabled={loading || !userQuery.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{loadingAction || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ask NYX Mind AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column Output */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-spin blur-md opacity-70"></div>
                  <div className="relative p-4 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {loadingAction || 'NYX Mind is analyzing your document'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Processing intelligence via multi-engine hub...
                  </p>
                </div>
              </div>
            ) : answer ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        AI Output Result
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Output'}
                    </button>
                  </div>

                  <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[500px] overflow-y-auto">
                    {answer}
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] mt-4"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-16 text-slate-400">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 inline-block border border-slate-100 dark:border-slate-800">
                  <Bot className="w-10 h-10 opacity-40 mx-auto" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Your Canvas is Empty
                  </p>
                  <p className="text-xs max-w-xs mx-auto">
                    Upload a PDF or paste text, then use Auto Summary, Model Questions, or ask custom questions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}