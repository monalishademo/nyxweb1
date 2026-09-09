'use client';

import React, { useState } from 'react';
import { Download, RefreshCw, Wand2, Image as ImageIcon, Sparkles, ArrowLeft, Layers, Palette, Sliders } from 'lucide-react';

interface AiImageGeneratorProps {
  onBack?: () => void;
}

export default function AiImageGeneratorTool({ onBack }: AiImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState('Photorealistic');

  const styles = [
    { label: 'Photorealistic', tag: '8k uhd, dslr quality, raw photo, sharp optical focus' },
    { label: 'Cinematic', tag: 'cinematic lighting, dramatic atmosphere, anamorphic lens, 8k' },
    { label: 'Cyberpunk', tag: 'cyberpunk neon vibes, volumetric smoke, octane render' },
    { label: 'Anime/Manga', tag: 'makoto shinkai aesthetic, vivid studio anime illustration' },
    { label: 'Fantasy Art', tag: 'epic fantasy digital painting, intricate concept art, unreal engine 5' },
  ];

  const samplePrompts = [
    { title: 'Indian Portrait', prompt: 'A realistic raw photography portrait of an Indian woman, natural skin texture with visible pores, 85mm lens f/1.4, golden hour' },
    { title: 'Cyberpunk City', prompt: 'A hyper-detailed cyberpunk neon street in heavy rain, wet pavement reflections, cinematic 8k, sharp focus' },
    { title: 'Mars Explorer', prompt: 'An astronaut walking on Mars red rocky surface, detailed space suit texture, volumetric sunlight, 35mm Hasselblad' },
    { title: 'Vintage Puppy', prompt: 'A cute golden retriever puppy wearing vintage spectacles reading a book in an aesthetic wooden library, macro photography' },
  ];

  const handleGenerate = async (selectedPrompt?: string) => {
    const baseText = selectedPrompt || prompt;
    if (!baseText.trim()) return;

    if (selectedPrompt) setPrompt(selectedPrompt);
    setLoading(true);
    setImageUrl(null);

    const styleTag = styles.find((s) => s.label === activeStyle)?.tag || '';
    const finalPrompt = `${baseText.trim()}, ${styleTag}`;

    try {
      const res = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'image', 
          prompt: finalPrompt 
        }),
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        alert('Server returned an unexpected format. Please retry.');
        setLoading(false);
        return;
      }

      if (res.ok && data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        alert(data.error || 'Generation failed. Please try again.');
      }
    } catch (err: any) {
      alert('Network or Server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `NYX_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
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
                NYX Image Generator
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
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Prompt Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe what you want NYX Mind to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                Artistic Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {styles.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setActiveStyle(s.label)}
                    className={`text-xs px-3 py-2 rounded-xl font-medium border transition-all cursor-pointer truncate ${
                      activeStyle === s.label
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Canvas...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate with NYX Mind</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5" /> Quick Inspiration
            </span>
            <div className="grid grid-cols-2 gap-2">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleGenerate(p.prompt)}
                  disabled={loading}
                  className="text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors">
                    ✨ {p.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Canvas */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm min-h-[520px] flex flex-col items-center justify-center relative overflow-hidden">
            {loading ? (
              <div className="text-center space-y-4 py-20">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-spin blur-md opacity-70"></div>
                  <div className="relative p-4 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                    NYX Mind is crafting your image
                  </p>
                  <p className="text-xs text-slate-400">
                    Applying {activeStyle} lighting and high-bitrate passes...
                  </p>
                </div>
              </div>
            ) : imageUrl ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center group shadow-xl">
                  <img
                    src={imageUrl}
                    alt="NYX Mind Creation"
                    className="max-h-[540px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Lossless PNG</span>
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3 py-20 text-slate-400">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 inline-block border border-slate-100 dark:border-slate-800">
                  <ImageIcon className="w-10 h-10 opacity-40 mx-auto" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Your Canvas is Empty
                  </p>
                  <p className="text-xs max-w-xs mx-auto">
                    Type a prompt or choose a preset on the left panel to render high-resolution art with NYX Mind.
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