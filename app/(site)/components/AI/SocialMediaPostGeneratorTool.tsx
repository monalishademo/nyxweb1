'use client';

import React, { useState } from 'react';
import { Sparkles, Share2, Copy, Check, RefreshCw, Wand2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface SocialMediaPostGeneratorProps {
  onBack?: () => void;
}

export default function SocialMediaPostGeneratorTool({ onBack }: SocialMediaPostGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [postOutput, setPostOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const platforms = ['LinkedIn', 'Facebook', 'Instagram', 'Twitter / X'];

  const handleGeneratePost = async () => {
    if (!topic.trim() || loading) return;

    setLoading(true);
    setPostOutput('');

    const prompt = `Write an engaging, highly viral social media post tailored specifically for ${platform} about: "${topic}". Include relevant emojis, clean formatting with line breaks, and a few high-performing hashtags at the bottom.`;

    try {
      // 👈 সেন্ট্রালাইজড এআই হাব রাউট এবং টাইপ সেট করা হলো
      const response = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'text', 
          prompt 
        }),
      });

      const data = await response.json();

      const textOutput = 
        data?.result || 
        data?.text || 
        data?.output || 
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (response.ok && textOutput) {
        setPostOutput(textOutput);
      } else {
        console.error('API Response Data:', data);
        alert(data?.error || 'Failed to generate social media post.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Error connecting to NYX Mind server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!postOutput) return;
    navigator.clipboard.writeText(postOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Header matching other tools */}
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
                Social Media Post Generator
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
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                Select Target Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer truncate ${
                      platform === p
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                What is your post about? *
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Announcing our new web productivity app launch with free AI tools..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={handleGeneratePost}
              disabled={loading || !topic.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Crafting Post...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate {platform} Post</span>
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
                    NYX Mind is crafting your social post
                  </p>
                  <p className="text-xs text-slate-400">
                    Generating creative captions and trending hashtags...
                  </p>
                </div>
              </div>
            ) : postOutput ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Generated Post
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Post'}
                    </button>
                  </div>

                  <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {postOutput}
                  </div>
                </div>

                <button
                  type="button"
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
                  <Share2 className="w-10 h-10 opacity-40 mx-auto" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Your Canvas is Empty
                  </p>
                  <p className="text-xs max-w-xs mx-auto">
                    Select a platform and describe your topic on the left panel to generate viral social posts with NYX Mind.
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