'use client';

import React, { useState, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, Download, Plus, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { toPng } from 'html-to-image';

interface Props {
  onBack: () => void;
}

export default function CollageMakerTool({ onBack }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [layout, setLayout] = useState('grid');
  const collageRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const downloadCollage = () => {
    if (collageRef.current) {
      toPng(collageRef.current, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'nyx-collage.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('ওহ, কিছু একটা ভুল হয়েছে!', err);
          alert('ছবি ডাউনলোড করতে ব্যর্থ হয়েছে।');
        });
    }
  };

  const getGridTemplate = () => {
    switch(columns) {
      case 1: return '1fr';
      case 2: return '1fr 1fr';
      case 3: return '1fr 1fr 1fr';
      case 4: return '1fr 1fr 1fr 1fr';
      default: return '1fr 1fr';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600">
          Design Studio
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Photo Collage Maker
        </h2>
        <p className="text-sm text-slate-500">
          Upload multiple photos to create a beautiful custom collage. Arrange and download instantly.
        </p>
      </div>

      <div className="grid md:grid-cols-[280px,1fr] gap-6">
        {/* Controls Sidebar */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-800/50">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="collage-upload"
            />
            <label htmlFor="collage-upload" className="cursor-pointer flex flex-col items-center">
              <Plus className="w-10 h-10 text-purple-500 mb-2" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Add Photos
              </span>
              <span className="text-xs text-slate-500 mt-1">Up to 10 images</span>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Layout Style</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLayout('grid')}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${layout === 'grid' ? 'bg-purple-50 border-purple-300 dark:bg-purple-950/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
              >
                <Grid3X3 className={`w-5 h-5 ${layout === 'grid' ? 'text-purple-600' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${layout === 'grid' ? 'text-purple-900 dark:text-purple-100' : 'text-slate-700 dark:text-slate-300'}`}>Grid</span>
              </button>
              <button
                onClick={() => setLayout('flex')}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${layout === 'flex' ? 'bg-purple-50 border-purple-300 dark:bg-purple-950/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
              >
                <LayoutGrid className={`w-5 h-5 ${layout === 'flex' ? 'text-purple-600' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${layout === 'flex' ? 'text-purple-900 dark:text-purple-100' : 'text-slate-700 dark:text-slate-300'}`}>Auto</span>
              </button>
            </div>
          </div>

          {layout === 'grid' && (
             <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Grid Columns: {columns}</label>
                <input 
                    type="range" 
                    min="1" max="4" value={columns} 
                    onChange={(e) => setColumns(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-purple-600"
                />
             </div>
          )}

          <button
            onClick={downloadCollage}
            disabled={images.length === 0}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" /> Download Collage
          </button>
        </div>

        {/* Collage Preview Area */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 min-h-[300px]">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-10">
              <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-sm font-medium">Your collage preview will appear here.</p>
              <p className="text-xs mt-1">Add photos using the button on the left to get started.</p>
            </div>
          ) : (
            <div
              ref={collageRef}
              className={`gap-2 p-2 bg-white ${layout === 'grid' ? '' : 'flex flex-wrap'}`}
              style={layout === 'grid' ? { display: 'grid', gridTemplateColumns: getGridTemplate() } : {}}
            >
              {images.map((src, index) => (
                <div key={index} className="relative group aspect-square overflow-hidden rounded-lg border border-slate-100">
                  <img
                    src={src}
                    alt={`Collage item ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}