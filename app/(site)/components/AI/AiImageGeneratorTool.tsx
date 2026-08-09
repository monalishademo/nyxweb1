'use client';

import React, { useState } from 'react';
import { Sparkles, Download, RefreshCw, Wand2, Image as ImageIcon } from 'lucide-react';

interface AiImageGeneratorProps {
  onBack?: () => void;
}

export default function AiImageGeneratorTool({ onBack }: AiImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const samplePrompts = [
    'A futuristic cyberpunk city at night with neon lights, 8k resolution',
    'An astronaut riding a horse on Mars, highly detailed digital art',
    'A cute golden retriever wearing glasses reading a book in a cozy library',
    'A majestic peacock made of glowing crystals, surreal concept art',
  ];

  const handleGenerate = (selectedPrompt?: string) => {
    const textToUse = selectedPrompt || prompt;
    if (!textToUse.trim()) return;

    if (selectedPrompt) setPrompt(selectedPrompt);
    setLoading(true);

    const encodedPrompt = encodeURIComponent(textToUse.trim());
    const generatedUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&nologo=true`;

    const img = new Image();
    img.src = generatedUrl;
    img.onload = () => {
      setImageUrl(generatedUrl);
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
      alert('Failed to generate image. Please try again!');
    };
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unlimited Free AI Image Generator</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">AI Image Generator</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Write any idea in words and turn it into high-quality digital artwork instantly!
        </p>
      </div>

      {/* Main Box */}
      <div className="dark-card border rounded-2xl p-6 shadow-lg space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-semibold dark-text-main">
            Enter Your Image Prompt:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. A cute cat sitting on a glowing moon in deep space..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl dark-input border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="space-y-2">
          <span className="text-xs font-semibold dark-text-muted">Try sample prompts:</span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleGenerate(p)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg dark-btn border hover:border-purple-400 transition-colors text-left truncate max-w-xs cursor-pointer"
              >
                ✨ {p}
              </button>
            ))}
          </div>
        </div>

        {/* Output Area */}
        <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-4 min-h-[380px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/40">
          {loading ? (
            <div className="text-center space-y-3 py-12">
              <div className="inline-block p-4 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 animate-bounce">
                <Wand2 className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold dark-text-main">AI is painting your imagination...</p>
              <p className="text-xs dark-text-muted">Takes just 3 to 5 seconds.</p>
            </div>
          ) : imageUrl ? (
            <div className="space-y-4 w-full flex flex-col items-center">
              <img
                src={imageUrl}
                alt="AI Generated"
                className="max-h-[450px] w-auto rounded-xl shadow-md border object-contain"
              />
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2 py-12 dark-text-muted">
              <ImageIcon className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-sm">Your AI generated image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}