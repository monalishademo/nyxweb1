'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  FileStack, 
  UploadCloud, 
  ArrowLeft, 
  X, 
  Sparkles, 
  Loader2,
  FileText
} from 'lucide-react';

interface MergeFileItem {
  file: File;
  previewUrl: string;
  pageCount: number;
}

export default function MergePdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [mergeFiles, setMergeFiles] = useState<MergeFileItem[]>([]);
  const [isLoadingMergePreviews, setIsLoadingMergePreviews] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);

  const handleMergeFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !pdfjs) return;
    const filesArray = Array.from(e.target.files);
    setIsLoadingMergePreviews(true);

    const newMergeItems: MergeFileItem[] = [];

    for (const file of filesArray) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          newMergeItems.push({
            file,
            previewUrl: canvas.toDataURL('image/jpeg'),
            pageCount,
          });
        }
      } catch (err) {
        console.error('Error loading preview:', err);
      }
    }

    setMergeFiles((prev) => [...prev, ...newMergeItems]);
    setIsLoadingMergePreviews(false);
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(mergeFiles.filter((_, i) => i !== index));
  };

  const handleMergePDFs = async () => {
    if (mergeFiles.length < 2) return;

    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `NYX_Merged_${Date.now()}.pdf`;
      link.click();
      setIsMerging(false);
    } catch (error) {
      console.error(error);
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Section */}
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
                NYX PDF Merger
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold tracking-wider">
                PDF TOOL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Combine multiple PDF documents into one seamless file
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Upload Zone */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-950/40 transition-all text-center">
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleMergeFilesUpload}
            id="pdf-merge-input"
            className="hidden"
          />
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Upload PDF Documents
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Select multiple files to merge. Previews will be rendered instantly.
            </p>
          </div>
          <label
            htmlFor="pdf-merge-input"
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Select PDF Files</span>
          </label>
        </div>

        {/* Loading Previews */}
        {isLoadingMergePreviews && (
          <div className="flex items-center justify-center gap-2 py-6 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating document visual thumbnails...</span>
          </div>
        )}

        {/* Preview Cards Grid */}
        {mergeFiles.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Selected Documents ({mergeFiles.length})</span>
              <button 
                onClick={() => setMergeFiles([])} 
                className="text-rose-500 hover:underline cursor-pointer normal-case"
              >
                Remove all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mergeFiles.map((item, index) => (
                <div
                  key={index}
                  className="relative group bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-col items-center justify-between"
                >
                  <button
                    onClick={() => removeMergeFile(index)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all cursor-pointer z-10 opacity-90 group-hover:opacity-100"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-full h-36 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  <div className="w-full mt-2.5 text-center">
                    <p 
                      className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" 
                      title={item.file.name}
                    >
                      {item.file.name}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400">
                      {item.pageCount} {item.pageCount === 1 ? 'Page' : 'Pages'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Merge Action Button */}
            <button
              onClick={handleMergePDFs}
              disabled={isMerging || mergeFiles.length < 2}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer mt-6"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Merging Documents...</span>
                </>
              ) : (
                <>
                  <FileStack className="w-4 h-4" />
                  <span>Merge & Download Combined PDF</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}