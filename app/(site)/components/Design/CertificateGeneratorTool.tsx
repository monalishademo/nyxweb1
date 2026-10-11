'use client';

import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Check,
  ImagePlus,
  RotateCcw,
  Download,
  Upload,
  Palette,
  Ruler,
  FileText,
  X,
  ShieldCheck,
  Sparkles,
  QrCode,
  Users,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type Props = { onBack: () => void };
type Template =
  | 'canva_modern' | 'canva_classic' | 'canva_royal' | 'canva_geometric'
  | 'canva_minimal' | 'canva_corporate' | 'canva_cyber' | 'canva_sunset'
  | 'canva_emerald' | 'canva_neon' | 'canva_creative' | 'canva_diploma';
type Unit = 'mm' | 'cm' | 'in' | 'px';
type ImageAsset = { name: string; data: string };

type BulkRow = {
  recipient: string;
  course: string;
  certificateId: string;
  date: string;
};

const templates: { id: Template; name: string; description: string }[] = [
  { id: 'canva_modern', name: 'Modern Split', description: 'Left color accent bar with clean typography' },
  { id: 'canva_classic', name: 'Classic Gold', description: 'Traditional frame with corner flourishes' },
  { id: 'canva_royal', name: 'Royal Badge', description: 'Prestigious layout with official emblem space' },
  { id: 'canva_geometric', name: 'Geometric Pro', description: 'Diagonal modern shapes & tech vibe' },
  { id: 'canva_minimal', name: 'Minimal Luxe', description: 'Clean whitespace & sophisticated lines' },
  { id: 'canva_corporate', name: 'Executive Dark', description: 'Professional dark border with highlights' },
  { id: 'canva_cyber', name: 'Cyber Tech', description: 'Futuristic grid lines and sharp contrast' },
  { id: 'canva_sunset', name: 'Sunset Gradient', description: 'Warm vibrant gradient background feel' },
  { id: 'canva_emerald', name: 'Emerald Prestige', description: 'Deep rich green luxury template' },
  { id: 'canva_neon', name: 'Neon Future', description: 'Vibrant glowing border & modern badge' },
  { id: 'canva_creative', name: 'Creative Studio', description: 'Artistic header blocks and bold layout' },
  { id: 'canva_diploma', name: 'Academic Diploma', description: 'Formal institutional certificate look' },
];

const paperSizes: Record<string, { width: number; height: number }> = {
  'A4 Landscape': { width: 297, height: 210 },
  'A4 Portrait': { width: 210, height: 297 },
  'A3 Landscape': { width: 420, height: 297 },
  'US Letter Landscape': { width: 279.4, height: 215.9 },
};

const colorOptions = [
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Emerald', value: '#047857' },
  { name: 'Gold', value: '#b8860b' },
  { name: 'Purple', value: '#6d28d9' },
  { name: 'Maroon', value: '#991b1b' },
  { name: 'Charcoal', value: '#1e293b' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Rose', value: '#e11d48' },
];

const defaultValues = {
  organization: 'GLOBAL ACADEMY OF EXCELLENCE',
  title: 'CERTIFICATE OF ACHIEVEMENT',
  subtitle: 'This is proudly presented to',
  description: 'For successfully completing the advanced professional training programme.',
  signatory: 'Dr. Alok Mukherjee',
  signatoryRole: 'Director of Education',
  font: 'Georgia',
  fontSize: 32,
  recipientSize: 40,
  watermarkText: 'VERIFIED CERTIFICATE',
};

const sampleBulkData: BulkRow[] = [
  { recipient: 'Jane Doe', course: 'Cybersecurity Awareness Training', certificateId: 'NYX-2026-001', date: '2026-10-12' },
  { recipient: 'John Smith', course: 'Advanced Web Development Masterclass', certificateId: 'NYX-2026-002', date: '2026-10-12' },
  { recipient: 'Alex Johnson', course: 'Python Data Processing & Automation', certificateId: 'NYX-2026-003', date: '2026-10-12' },
];

export default function CertificateGeneratorTool({ onBack }: Props) {
  const [template, setTemplate] = useState<Template>('canva_modern');
  const [accent, setAccent] = useState('#1d4ed8');
  const [paper, setPaper] = useState('A4 Landscape');
  const [unit, setUnit] = useState<Unit>('mm');

  const [values, setValues] = useState(defaultValues);
  const [logo, setLogo] = useState<ImageAsset | null>(null);
  const [photo, setPhoto] = useState<ImageAsset | null>(null);
  const [signature, setSignature] = useState<ImageAsset | null>(null);
  const [background, setBackground] = useState<ImageAsset | null>(null);

  // Bulk State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState<BulkRow[]>(sampleBulkData);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Single mode fallback values
  const [singleRecipient, setSingleRecipient] = useState('Jane Doe');
  const [singleCourse, setSingleCourse] = useState('Cybersecurity & Web Development Masterclass');
  const [singleId, setSingleId] = useState('NYX-2026-9981');
  const [singleDate, setSingleDate] = useState('');

  // Toggles
  const [showCertificateId, setShowCertificateId] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [borderStyle, setBorderStyle] = useState('solid');

  const [activeTab, setActiveTab] = useState('content');
  const [notice, setNotice] = useState('');

  const logoInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const signatureInput = useRef<HTMLInputElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);

  const update = (key: keyof typeof defaultValues, val: string | number) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const dimensions = paper === 'Custom Size' 
    ? { width: 297, height: 210 }
    : paperSizes[paper] || paperSizes['A4 Landscape'];

  const aspectRatio = dimensions.width / dimensions.height;
  const printWidth = `${dimensions.width}${unit}`;
  const printHeight = `${dimensions.height}${unit}`;

  // Current active certificate details depending on mode
  const activeRecipient = isBulkMode && bulkData.length > 0 ? bulkData[currentIndex].recipient : singleRecipient;
  const activeCourse = isBulkMode && bulkData.length > 0 ? bulkData[currentIndex].course : singleCourse;
  const activeId = isBulkMode && bulkData.length > 0 ? bulkData[currentIndex].certificateId : singleId;
  const rawDate = isBulkMode && bulkData.length > 0 ? bulkData[currentIndex].date : singleDate;

  const formattedDate = rawDate
    ? new Date(rawDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '12 October 2026';

  const uploadImage = (file: File | undefined, setter: (a: ImageAsset | null) => void) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setNotice('Please select an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter({ name: file.name, data: reader.result });
        setNotice(`${file.name} uploaded successfully.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle CSV / Excel simulated import
  const handleBulkUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      const parsedRows: BulkRow[] = [];
      
      // Skip header row if matches name/course
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length >= 2 && row[0].trim() !== '') {
          parsedRows.push({
            recipient: row[0]?.trim() || 'Attendee Name',
            course: row[1]?.trim() || 'Professional Training',
            certificateId: row[2]?.trim() || `NYX-2026-00${i}`,
            date: row[3]?.trim() || '',
          });
        }
      }

      if (parsedRows.length > 0) {
        setBulkData(parsedRows);
        setCurrentIndex(0);
        setIsBulkMode(true);
        setNotice(`Successfully loaded ${parsedRows.length} recipients for Bulk generation!`);
      } else {
        setNotice('Could not parse rows. Ensure format is: Name, Course, ID, Date');
      }
    };
    reader.readAsText(file);
  };

  // Download Sample CSV template for Bulk import
  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,Recipient Name,Course Name,Certificate ID,Date\nJohn Doe,Cybersecurity Essentials,NYX-001,2026-10-12\nSarah Connor,Web Development Masterclass,NYX-002,2026-10-12";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "certificate_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setTemplate('canva_modern'); setAccent('#1d4ed8'); setPaper('A4 Landscape');
    setValues(defaultValues); setLogo(null); setPhoto(null); setSignature(null); setBackground(null);
    setIsBulkMode(false);
    setNotice('Design reset successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @page { size: ${printWidth} ${printHeight}; margin: 0; }
        @media print {
          html, body { width: ${printWidth} !important; height: ${printHeight} !important; background: white !important; -webkit-print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #certificate-print-area, #certificate-print-area * { visibility: visible !important; }
          #certificate-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: ${printWidth} !important; height: ${printHeight} !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 md:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100 transition"><ArrowLeft size={20} /></button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow"><Award size={22} /></div>
          <div><h1 className="text-lg font-bold">Pro Certificate Studio</h1><p className="text-xs text-slate-500">Canva Editor with Bulk CSV / Excel Import</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={resetAll} className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 transition"><RotateCcw size={16} /> Reset</button>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition"><Download size={16} /> Export PDF / Print</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 p-4 md:p-6 xl:grid-cols-[410px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="no-print space-y-4">
          
          {/* Bulk Generation Card */}
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Users size={18} className="text-indigo-600" /><h3 className="font-bold text-sm text-indigo-900">Bulk Create Mode</h3></div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isBulkMode ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{isBulkMode ? `${bulkData.length} Loaded` : 'Single Mode'}</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">Upload a CSV or Excel export to generate multiple certificates automatically.</p>
            
            <div className="flex gap-2">
              <button onClick={downloadSampleCsv} className="flex-1 flex items-center justify-center gap-1 bg-white border border-indigo-200 py-1.5 px-2 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition">
                <FileSpreadsheet size={14} /> Sample CSV
              </button>
              <input ref={csvInput} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleBulkUpload(e.target.files?.[0])} />
              <button onClick={() => csvInput.current?.click()} className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 py-1.5 px-2 rounded-xl text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs">
                <Upload size={14} /> Upload Data
              </button>
            </div>

            {isBulkMode && (
              <div className="mt-3 pt-3 border-t border-indigo-200 flex items-center justify-between text-xs">
                <button onClick={() => { setIsBulkMode(false); setNotice('Switched to Single Mode'); }} className="text-indigo-700 underline font-semibold">Exit Bulk Mode</button>
                <span className="text-slate-600 font-mono">Record {currentIndex + 1} of {bulkData.length}</span>
              </div>
            )}
          </section>

          {/* Templates */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2"><Sparkles size={18} className="text-indigo-600" /><h2 className="font-bold text-sm">Templates ({templates.length})</h2></div>
            <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
              {templates.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t.id)} className={`rounded-xl border p-2 text-left transition ${template === t.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="mb-1 h-5 rounded bg-white border flex items-center justify-center" style={{ borderLeft: t.id === 'canva_modern' ? `4px solid ${accent}` : undefined }}>
                    <Award size={13} style={{ color: accent }} />
                  </div>
                  <span className="text-[11px] font-bold truncate block">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Editor Tabs */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
              {[
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'assets', label: 'Images', icon: ImagePlus },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-center gap-1.5 py-3 text-xs font-semibold ${activeTab === tab.id ? 'border-b-2 border-indigo-600 bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <Icon size={15} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 p-4 max-h-[340px] overflow-y-auto">
              {activeTab === 'content' && (
                <>
                  <div><label className="text-xs font-semibold text-slate-600">Organization Name</label><input value={values.organization} onChange={(e) => update('organization', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                  <div><label className="text-xs font-semibold text-slate-600">Certificate Title</label><input value={values.title} onChange={(e) => update('title', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                  <div><label className="text-xs font-semibold text-slate-600">Subtitle</label><input value={values.subtitle} onChange={(e) => update('subtitle', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>

                  {!isBulkMode ? (
                    <>
                      <div><label className="text-xs font-semibold text-slate-600">Recipient Name (Single)</label><input value={singleRecipient} onChange={(e) => setSingleRecipient(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500" /></div>
                      <div><label className="text-xs font-semibold text-slate-600">Course / Programme</label><input value={singleCourse} onChange={(e) => setSingleCourse(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs font-semibold text-slate-600">Date</label><input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm" /></div>
                        <div><label className="text-xs font-semibold text-slate-600">ID</label><input value={singleId} onChange={(e) => setSingleId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm" /></div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                      <strong>Bulk Mode Active:</strong> Recipient names, courses, and IDs are automatically mapped from your uploaded file. Use the navigation buttons in the preview to browse records.
                    </div>
                  )}

                  <div><label className="text-xs font-semibold text-slate-600">Description Text</label><textarea value={values.description} onChange={(e) => update('description', e.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-semibold text-slate-600">Signatory Name</label><input value={values.signatory} onChange={(e) => update('signatory', e.target.value)} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm" /></div>
                    <div><label className="text-xs font-semibold text-slate-600">Signatory Role</label><input value={values.signatoryRole} onChange={(e) => update('signatoryRole', e.target.value)} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm" /></div>
                  </div>
                </>
              )}

              {activeTab === 'design' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-2 text-slate-600">Accent Color Theme</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((c) => (
                        <button key={c.value} onClick={() => setAccent(c.value)} className={`h-8 w-8 rounded-full border-2 transition ${accent === c.value ? 'scale-110 border-slate-900 ring-2 ring-indigo-200' : 'border-white shadow'}`} style={{ backgroundColor: c.value }} />
                      ))}
                    </div>
                  </div>

                  <div><label className="text-xs font-semibold text-slate-600">Typography Font</label><select value={values.font} onChange={(e) => update('font', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="Georgia">Georgia (Serif)</option><option value="Arial">Arial (Sans)</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option></select></div>
                  <div><label className="text-xs font-semibold text-slate-600">Border Style</label><select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="solid">Solid Frame</option><option value="double">Double Frame</option><option value="dashed">Dashed Elegant</option></select></div>
                  <div><div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>Title Size</span><span>{values.fontSize}px</span></div><input type="range" min="20" max="48" value={values.fontSize} onChange={(e) => update('fontSize', Number(e.target.value))} className="w-full accent-indigo-600" /></div>
                  <div><div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>Recipient Size</span><span>{values.recipientSize}px</span></div><input type="range" min="24" max="56" value={values.recipientSize} onChange={(e) => update('recipientSize', Number(e.target.value))} className="w-full accent-indigo-600" /></div>

                  <div className="space-y-2 border-t pt-3 text-xs font-medium text-slate-700">
                    <label className="flex items-center justify-between cursor-pointer"><span>Show Logo</span> <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="accent-indigo-600 h-4 w-4" /></label>
                    <label className="flex items-center justify-between cursor-pointer"><span>Show Recipient Photo</span> <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} className="accent-indigo-600 h-4 w-4" /></label>
                    <label className="flex items-center justify-between cursor-pointer"><span>Show Official Badge</span> <input type="checkbox" checked={showBadge} onChange={(e) => setShowBadge(e.target.checked)} className="accent-indigo-600 h-4 w-4" /></label>
                    <label className="flex items-center justify-between cursor-pointer"><span>Show Verification QR</span> <input type="checkbox" checked={showQrCode} onChange={(e) => setShowQrCode(e.target.checked)} className="accent-indigo-600 h-4 w-4" /></label>
                    <label className="flex items-center justify-between cursor-pointer"><span>Show Watermark</span> <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} className="accent-indigo-600 h-4 w-4" /></label>
                  </div>
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="space-y-3">
                  {[
                    { label: 'Organization Logo', input: logoInput, asset: logo, setter: setLogo },
                    { label: 'Recipient Photo', input: photoInput, asset: photo, setter: setPhoto },
                    { label: 'Signature Image', input: signatureInput, asset: signature, setter: setSignature },
                    { label: 'Custom Background', input: backgroundInput, asset: background, setter: setBackground },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
                      <div><span className="text-xs font-semibold block text-slate-700">{item.label}</span><span className="text-[10px] text-slate-400">{item.asset ? item.asset.name : 'No file'}</span></div>
                      <input ref={item.input} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], item.setter)} />
                      <button onClick={() => item.input.current?.click()} className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 shadow-xs"><Upload size={13} className="inline mr-1" />{item.asset ? 'Change' : 'Upload'}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {notice && <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-800">{notice}</div>}
        </aside>

        {/* Preview Area */}
        <section className="min-w-0">
          <div className="no-print mb-3 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-700">Live Canva Preview</h2>
            
            <div className="flex items-center gap-2">
              {/* Bulk Navigation Controls */}
              {isBulkMode && (
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
                  <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <span className="text-xs font-mono font-bold px-1">{currentIndex + 1} / {bulkData.length}</span>
                  <button onClick={() => setCurrentIndex(prev => Math.min(bulkData.length - 1, prev + 1))} disabled={currentIndex === bulkData.length - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
              )}

              <select value={paper} onChange={(e) => setPaper(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
                {Object.keys(paperSizes).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
                <option value="mm">mm</option><option value="in">in</option><option value="px">px</option>
              </select>
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border border-slate-300 bg-slate-200/90 p-4 shadow-inner">
            <div className="mx-auto w-full max-w-[1100px]">
              <div
                id="certificate-print-area"
                className="relative mx-auto overflow-hidden bg-white shadow-2xl transition-all"
                style={{
                  width: '100%',
                  aspectRatio: String(aspectRatio),
                  fontFamily: values.font,
                  backgroundImage: background ? `url("${background.data}")` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Watermark Overlay */}
                {showWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-30deg] font-black tracking-[0.2em] text-6xl uppercase" style={{ color: accent }}>
                    {values.watermarkText}
                  </div>
                )}

                <div
                  className="absolute inset-0 flex flex-col justify-between overflow-hidden p-[4.5%]"
                  style={{
                    backgroundColor: background ? 'rgba(255,255,255,0.92)' : '#fff',
                    border: template === 'canva_corporate' ? `10px solid ${accent}` : `${borderStyle === 'double' ? '6px' : '3px'} ${borderStyle} ${accent}`,
                  }}
                >
                  {/* Modern Accent Bar */}
                  {template === 'canva_modern' && <div className="absolute left-0 top-0 bottom-0 w-[2.5%]" style={{ backgroundColor: accent }} />}

                  {/* Top Bar */}
                  <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                      {showLogo && logo && <img src={logo.data} alt="Logo" className="max-h-[50px] object-contain" />}
                      <div>
                        <div className="text-[13px] font-extrabold uppercase tracking-widest" style={{ color: accent }}>{values.organization}</div>
                        <div className="h-[2px] w-14 mt-0.5 rounded" style={{ backgroundColor: accent }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {showBadge && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-amber-50 shadow-xs" style={{ borderColor: accent }}>
                          <ShieldCheck size={24} style={{ color: accent }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Content (Dynamically rendered based on Single or Bulk Record) */}
                  <div className="flex flex-col items-center text-center my-auto py-2 z-10">
                    <div className="font-black uppercase tracking-wider mb-1" style={{ color: accent, fontSize: `clamp(16px, 3.5vw, ${values.fontSize}px)` }}>{values.title}</div>
                    <p className="text-[13px] italic text-slate-500 mb-2">{values.subtitle}</p>

                    {showPhoto && photo && (
                      <img src={photo.data} alt="Recipient" className="mb-2 rounded-full border-2 object-cover shadow-sm" style={{ borderColor: accent, width: '68px', height: '68px' }} />
                    )}

                    <div className="font-bold tracking-wide mb-2 border-b-2 pb-1 px-6" style={{ color: accent, borderColor: accent, fontSize: `clamp(20px, 4vw, ${values.recipientSize}px)` }}>
                      {activeRecipient}
                    </div>

                    <p className="max-w-[82%] text-[13px] text-slate-600 mb-2 leading-relaxed">{values.description}</p>
                    <div className="font-bold text-[16px] text-slate-800 uppercase tracking-wide">{activeCourse}</div>
                  </div>

                  {/* Bottom Footer Area */}
                  <div className="flex items-end justify-between pt-2 z-10 text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold uppercase text-[10px] text-slate-400">Date Issued</span>
                      <span className="font-semibold text-slate-700">{formattedDate}</span>
                    </div>

                    {/* QR Code Verification Simulation */}
                    {showQrCode && (
                      <div className="flex flex-col items-center bg-white p-1 border rounded shadow-2xs">
                        <QrCode size={38} className="text-slate-800" />
                        <span className="text-[8px] font-mono text-slate-500 mt-0.5">SCAN TO VERIFY</span>
                      </div>
                    )}

                    <div className="flex flex-col items-center min-w-[140px]">
                      {showSignature && signature ? (
                        <img src={signature.data} alt="Signature" className="max-h-[35px] object-contain mb-1" />
                      ) : (
                        <div className="w-full border-t border-slate-400 mb-1" />
                      )}
                      <span className="font-bold text-slate-800 text-xs">{values.signatory}</span>
                      <span className="text-[10px] text-slate-500">{values.signatoryRole}</span>
                    </div>
                  </div>

                  {/* Certificate ID */}
                  <div className="absolute bottom-[2%] left-[4.5%] font-mono text-[9px] text-slate-400">
                    ID: {activeId}
                  </div>

                  {/* Corner Flourishes */}
                  {['canva_classic', 'canva_royal'].includes(template) && (
                    <>
                      <div className="absolute top-2.5 left-2.5 h-8 w-8 border-l-2 border-t-2 pointer-events-none" style={{ borderColor: accent }} />
                      <div className="absolute top-2.5 right-2.5 h-8 w-8 border-r-2 border-t-2 pointer-events-none" style={{ borderColor: accent }} />
                      <div className="absolute bottom-2.5 left-2.5 h-8 w-8 border-l-2 border-b-2 pointer-events-none" style={{ borderColor: accent }} />
                      <div className="absolute bottom-2.5 right-2.5 h-8 w-8 border-r-2 border-b-2 pointer-events-none" style={{ borderColor: accent }} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}