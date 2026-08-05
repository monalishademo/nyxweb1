'use client';

import React, { useState } from 'react';
import { Sparkles, Share2, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';

export default function SocialMediaPostGeneratorTool({ onBack }: { onBack?: () => void }) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [postOutput, setPostOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const platforms = ['LinkedIn', 'Facebook', 'Instagram', 'Twitter / X'];

  const handleGeneratePost = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setPostOutput('');

    const prompt = `Write an engaging, highly viral social media post tailored specifically for ${platform} about: "${topic}". Include relevant emojis, clean formatting with line breaks, and a few high-performing hashtags at the bottom.`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      // Flexible extraction: Checks direct text output from updated backend route as well as standard schemas
      const textOutput = 
        data?.text || 
        data?.result || 
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
      alert('AI connection error.');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini AI Social Manager</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">Social Media Post Generator</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Create engaging captions with emojis and trending hashtags for your target platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card border rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-lg font-bold dark-text-main flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-500" />
            <span>Post Topic & Platform</span>
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">Select Target Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    platform === p
                      ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                      : 'dark-btn hover:border-pink-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">What is your post about? *</label>
            <textarea
              rows={4}
              placeholder="e.g. Announcing our new web productivity app launch with free AI tools..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGeneratePost}
            disabled={loading || !topic.trim()}
            className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
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

        <div className="dark-card border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold dark-text-main">Generated Post</h3>
              {postOutput && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-pink-500 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Post'}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
                <p className="text-sm dark-text-muted font-medium">Generating creative caption and hashtags...</p>
              </div>
            ) : postOutput ? (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap dark-text-main text-xs sm:text-sm leading-relaxed">
                {postOutput}
              </div>
            ) : (
              <div className="text-center py-20 dark-text-muted space-y-2">
                <Share2 className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">Your social media post caption will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}