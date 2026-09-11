'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Paperclip, Mic, ArrowLeft, Bot, User, Loader2 } from 'lucide-react';

interface NyxMindSearchProps {
  onBack: () => void;
}

export default function NyxMindSearch({ onBack }: NyxMindSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am NYX Mind powered by GPT Astra. How can I assist you today?' }
  ]);

  // চেক করা হোমপেজের সার্চ বক্স থেকে কোনো প্রম্পট পাস হয়েছে কি না
  useEffect(() => {
    const initialPrompt = localStorage.getItem('nyx_initial_prompt');
    if (initialPrompt) {
      localStorage.removeItem('nyx_initial_prompt');
      setQuery(initialPrompt);
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query;
    setQuery('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'nyx-mind', prompt: userMsg }),
      });
      const data = await res.json();

      const aiReply = data.result || data.error || 'No response received from GPT Astra.';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiReply }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error with GPT Astra API.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col h-[75vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl transition-all">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white tracking-wider">NYX MIND</h3>
              <p className="text-[11px] text-slate-400 font-medium">Powered by GPT Astra</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Chat Conversation Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 px-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
            )}
            <div
              className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none font-medium'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 shadow-sm">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold py-2 px-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>GPT Astra is thinking...</span>
          </div>
        )}
      </div>

      {/* Bottom Input Form */}
      <form onSubmit={handleSend} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Attach file">
            <Paperclip className="w-5 h-5" />
          </button>
          <button type="button" className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Voice input">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask NYX Mind anything (e.g., Code analysis, security check)..."
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white p-3.5 rounded-2xl transition-all flex items-center justify-center shadow-lg cursor-pointer shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

    </div>
  );
}