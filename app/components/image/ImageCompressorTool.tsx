"use client";

import React, { useState } from "react";

interface ImageCompressorProps {
  onBack?: () => void;
}

export default function ImageCompressorTool({ onBack }: ImageCompressorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [targetKb, setTargetKb] = useState<number>(50); // Default 50 KB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCompressedFile(null);
      setCompressedPreviewUrl(null);
    }
  };

  // Advanced Canvas Compression Engine
  const compressImageEngine = (file: File, targetKB: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Target size in bytes
        const targetBytes = targetKB * 1024;

        // Auto scale dimensions if target is very small (e.g. < 100 KB)
        if (targetKB < 100) {
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context error");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let step = 0.05;

        const attemptCompress = (q: number, w: number, h: number) => {
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject("Blob error");

              if (blob.size <= targetBytes || q <= 0.1) {
                // If still slightly larger and quality is low, scale down dimension
                if (blob.size > targetBytes && (w > 300 || h > 300)) {
                  attemptCompress(0.7, Math.round(w * 0.85), Math.round(h * 0.85));
                } else {
                  const compressed = new File([blob], file.name, {
                    type: "image/jpeg",
                  });
                  resolve(compressed);
                }
              } else {
                attemptCompress(q - step, w, h);
              }
            },
            "image/jpeg",
            q
          );
        };

        attemptCompress(quality, width, height);
      };

      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setIsCompressing(true);

    try {
      const resultFile = await compressImageEngine(selectedFile, targetKb);
      setCompressedFile(resultFile);
      setCompressedPreviewUrl(URL.createObjectURL(resultFile));
    } catch (error) {
      console.error("Compression Error:", error);
      alert("Compression করতে সমস্যা হয়েছে!");
    } finally {
      setIsCompressing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '35px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e2e8f0',
      maxWidth: '850px',
      margin: '0 auto',
      color: '#1e293b'
    }}>
      {/* Header Info */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
          <span>🗜️</span> Compress Image Size
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Compress images to exact target size in KB (e.g., under 50 KB, 20 KB).
        </p>
      </div>

      {/* Upload Zone */}
      <div style={{
        border: '2px dashed #cbd5e1',
        borderRadius: '12px',
        padding: '30px 20px',
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        marginBottom: '25px'
      }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          id="image-compress-input"
          style={{ display: 'none' }}
        />
        <label
          htmlFor="image-compress-input"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,112,243,0.2)'
          }}
        >
          📁 {selectedFile ? "Change Image File" : "Select Image File"}
        </label>
        {selectedFile && (
          <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: '500', color: '#334155', margin: '12px 0 0 0' }}>
            Selected File: <span style={{ color: '#0070f3' }}>{selectedFile.name}</span> ({formatSize(selectedFile.size)})
          </p>
        )}
      </div>

      {/* Target Size Controls */}
      {selectedFile && (
        <div style={{
          backgroundColor: '#f1f5f9',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '25px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
              Target Max Size:
            </label>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0070f3', background: '#e0f2fe', padding: '4px 12px', borderRadius: '6px' }}>
              {targetKb} KB
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="500"
            step="5"
            value={targetKb}
            onChange={(e) => setTargetKb(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#0070f3' }}
          />

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            {[20, 50, 100, 200].map((kb) => (
              <button
                key={kb}
                onClick={() => setTargetKb(kb)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: targetKb === kb ? '#0070f3' : '#ffffff',
                  color: targetKb === kb ? '#ffffff' : '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Under {kb} KB
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compress Action Button */}
      <button
        onClick={handleCompress}
        disabled={!selectedFile || isCompressing}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: !selectedFile ? '#94a3b8' : isCompressing ? '#64748b' : '#0070f3',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: !selectedFile || isCompressing ? 'not-allowed' : 'pointer',
          marginBottom: '30px',
          boxShadow: selectedFile ? '0 4px 12px rgba(0, 112, 243, 0.25)' : 'none'
        }}
      >
        {isCompressing ? "⚡ Compressing..." : `⚡ Compress to under ${targetKb} KB`}
      </button>

      {/* Comparison Preview */}
      {selectedFile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>Original Image</h4>
            {previewUrl && (
              <img src={previewUrl} alt="Original" style={{ maxHeight: '180px', width: 'auto', margin: '0 auto 12px', borderRadius: '6px', objectFit: 'contain' }} />
            )}
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#334155' }}>
              Size: {formatSize(selectedFile.size)}
            </p>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>Compressed Result</h4>
            {compressedPreviewUrl && compressedFile ? (
              <>
                <img src={compressedPreviewUrl} alt="Compressed" style={{ maxHeight: '180px', width: 'auto', margin: '0 auto 12px', borderRadius: '6px', objectFit: 'contain' }} />
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#16a34a' }}>
                  Size: {formatSize(compressedFile.size)}
                </p>
                <a
                  href={compressedPreviewUrl}
                  download={`compressed_${targetKb}KB_${selectedFile.name}`}
                  style={{
                    display: 'inline-block',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)'
                  }}
                >
                  ⬇️ Download Compressed Image
                </a>
              </>
            ) : (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Click compress button above
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}