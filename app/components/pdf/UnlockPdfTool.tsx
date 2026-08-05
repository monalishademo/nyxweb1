'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import BackButton from '../BackButton';
import { formatFileSize } from '../../lib/utils';

interface UnlockPdfToolProps {
  pdfjs?: any;
  onBack: () => void;
}

export default function UnlockPdfTool({ pdfjs, onBack }: UnlockPdfToolProps) {
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [unlockedResult, setUnlockedResult] = useState<{ downloadUrl: string; filename: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlockFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUnlockFile(file);
    setPdfPassword('');
    setUnlockedResult(null);
    setErrorMessage(null);
  };

  const handleUnlockPDF = async () => {
    if (!unlockFile || !pdfPassword) {
      setErrorMessage("Please enter the password.");
      return;
    }

    setIsUnlocking(true);
    setUnlockedResult(null);
    setErrorMessage(null);

    try {
      const arrayBuffer = await unlockFile.arrayBuffer();

      // Ensure pdfjs engine is loaded or fallback dynamically
      let activePdfjs = pdfjs;
      if (!activePdfjs) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        activePdfjs = pdfjsLib;
      }

      // Load protected PDF via pdfjs
      const loadingTask = activePdfjs.getDocument({
        data: arrayBuffer,
        password: pdfPassword,
      });

      const pdf = await loadingTask.promise;
      
      // Create fresh unencrypted PDF document
      const newPdfDoc = await PDFDocument.create();

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/png');
          const pngImage = await newPdfDoc.embedPng(imgData);
          
          const origViewport = page.getViewport({ scale: 1.0 });
          const pdfPage = newPdfDoc.addPage([origViewport.width, origViewport.height]);
          pdfPage.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
          });
        }
      }

      const unlockedBytes = await newPdfDoc.save();

      const blob = new Blob([unlockedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setUnlockedResult({
        downloadUrl: url,
        filename: `unlocked_${unlockFile.name}`,
      });

      const link = document.createElement('a');
      link.href = url;
      link.download = `unlocked_${unlockFile.name}`;
      link.click();

      setIsUnlocking(false);
    } catch (err: any) {
      console.error('Unlock error:', err);
      if (err.name === 'PasswordException' || (err.message && err.message.toLowerCase().includes('password'))) {
        setErrorMessage('❌ Incorrect password! Please verify and try again.');
      } else {
        setErrorMessage('❌ Failed to unlock PDF. Please check if the file is valid.');
      }
      setIsUnlocking(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🔓</span> Unlock / Remove PDF Password
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Enter the correct password to permanently remove protection from your PDF file.</p>

      {!unlockFile ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUnlockFileUpload}
            id="unlock-pdf-input"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="unlock-pdf-input"
            style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block', fontSize: '15px' }}
          >
            📁 Select Protected PDF File
          </label>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>

            <div style={{ backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '50px' }}>🔐📄</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginTop: '12px', wordBreak: 'break-all' }}>{unlockFile.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Size: {formatFileSize(unlockFile.size)}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: '600' }}>🔑 Enter Current Password:</h4>

              <div style={{ marginBottom: '15px', position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="Type password..."
                  style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {errorMessage && (
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px' }}>
                  {errorMessage}
                </div>
              )}
            </div>

          </div>

          <button
            onClick={handleUnlockPDF}
            disabled={isUnlocking || !pdfPassword}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: !pdfPassword ? '#94a3b8' : '#10b981',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: !pdfPassword ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isUnlocking ? '🔓 Unlocking & Removing Protection...' : '🔓 Remove Password & Download'}
          </button>

          {unlockedResult && (
            <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '2px solid #10b981', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#15803d' }}>🎉 PDF Unlocked Successfully!</h3>
              <p style={{ margin: '0 0 15px 0', color: '#166534', fontSize: '14px' }}>
                The password protection has been permanently removed.
              </p>
              <a
                href={unlockedResult.downloadUrl}
                download={unlockedResult.filename}
                style={{ display: 'inline-block', backgroundColor: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '15px' }}
              >
                ⬇️ Download Unlocked PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}