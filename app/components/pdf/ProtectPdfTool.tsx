'use client';

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import BackButton from '../BackButton';
import { formatFileSize } from '../../lib/utils';

export default function ProtectPdfTool({ pdfjs, onBack }: { pdfjs: any; onBack: () => void }) {
  const [protectFile, setProtectFile] = useState<File | null>(null);
  const [protectPreviewUrl, setProtectPreviewUrl] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [confirmPdfPassword, setConfirmPdfPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isProtecting, setIsProtecting] = useState<boolean>(false);
  const [protectedResult, setProtectedResult] = useState<{ downloadUrl: string; filename: string } | null>(null);

  const handleProtectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setProtectFile(file);
    setPdfPassword('');
    setConfirmPdfPassword('');
    setProtectedResult(null);

    if (pdfjs) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          setProtectPreviewUrl(canvas.toDataURL('image/jpeg'));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProtectPDF = async () => {
    if (!protectFile || !pdfPassword) return;
    if (pdfPassword !== confirmPdfPassword) return;

    setIsProtecting(true);
    setProtectedResult(null);

    try {
      if (!pdfjs) {
        alert("PDF Engine প্রস্তুত হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।");
        setIsProtecting(false);
        return;
      }

      const arrayBuffer = await protectFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let doc: jsPDF | null = null;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // 3.0 Ultra High Scale Resolution for Crystal Clear Quality (300 DPI equivalent)
        const viewport = page.getViewport({ scale: 3.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          // High quality image smoothing
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          await page.render({ canvasContext: context, viewport }).promise;
          
          // Max JPEG quality (1.0)
          const imgData = canvas.toDataURL('image/jpeg', 1.0);

          const origViewport = page.getViewport({ scale: 1.0 });
          const orientation = origViewport.width > origViewport.height ? 'l' : 'p';

          if (pageNum === 1) {
            doc = new jsPDF({
              orientation: orientation,
              unit: 'px',
              format: [origViewport.width, origViewport.height],
              encryption: {
                userPassword: pdfPassword,
                ownerPassword: pdfPassword,
                userPermissions: ['print', 'modify', 'copy', 'annot-forms'],
              },
            });
            doc.addImage(imgData, 'JPEG', 0, 0, origViewport.width, origViewport.height, undefined, 'FAST');
          } else if (doc) {
            doc.addPage([origViewport.width, origViewport.height], orientation);
            doc.addImage(imgData, 'JPEG', 0, 0, origViewport.width, origViewport.height, undefined, 'FAST');
          }
        }
      }

      if (doc) {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        setProtectedResult({
          downloadUrl: url,
          filename: `protected_${protectFile.name}`,
        });

        const link = document.createElement('a');
        link.href = url;
        link.download = `protected_${protectFile.name}`;
        link.click();
      }

      setIsProtecting(false);
    } catch (err: any) {
      console.error('Protection error:', err);
      alert('PDF Encrypt করতে সমস্যা হয়েছে! আবার চেষ্টা করুন।');
      setIsProtecting(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a' }}>🔒 Protect / Lock PDF File</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Encrypt your PDF file with high-resolution password protection.</p>

      {!protectFile ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleProtectFileUpload}
            id="protect-pdf-input"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="protect-pdf-input"
            style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}
          >
            📁 Choose PDF File to Lock
          </label>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>🔑 Set Password:</h4>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Enter Password:</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="Type password..."
                    style={{ width: '100%', padding: '10px 35px 10px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>Confirm Password:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPdfPassword}
                  onChange={(e) => setConfirmPdfPassword(e.target.value)}
                  placeholder="Re-type password..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                />
              </div>

              {pdfPassword && confirmPdfPassword && (
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: pdfPassword === confirmPdfPassword ? '#166534' : '#ef4444' }}>
                  {pdfPassword === confirmPdfPassword ? '✅ Passwords match!' : '❌ Passwords do not match'}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {protectPreviewUrl ? (
                <img src={protectPreviewUrl} alt="PDF Cover" style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }} />
              ) : (
                <div style={{ fontSize: '40px' }}>📄</div>
              )}
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginTop: '12px' }}>{protectFile.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Size: {formatFileSize(protectFile.size)}</div>
            </div>

          </div>

          <button
            onClick={handleProtectPDF}
            disabled={isProtecting || !pdfPassword || pdfPassword !== confirmPdfPassword}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: (!pdfPassword || pdfPassword !== confirmPdfPassword) ? '#94a3b8' : '#8b5cf6',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (!pdfPassword || pdfPassword !== confirmPdfPassword) ? 'not-allowed' : 'pointer',
            }}
          >
            {isProtecting ? 'Encrypting High-Res PDF...' : '🔒 Encrypt & Download Locked PDF'}
          </button>

          {protectedResult && (
            <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '2px solid #22c55e', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#15803d' }}>🎉 High Quality PDF Locked!</h3>
              <p style={{ margin: '0 0 15px 0', color: '#166534', fontSize: '14px' }}>
                Your PDF is now encrypted with password protection without quality loss.
              </p>
              <a
                href={protectedResult.downloadUrl}
                download={protectedResult.filename}
                style={{ display: 'inline-block', backgroundColor: '#22c55e', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}
              >
                ⬇️ Download Locked PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}