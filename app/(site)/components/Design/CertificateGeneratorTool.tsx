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
} from 'lucide-react';

type Props = {
  onBack: () => void;
};

type Template =
  | 'classic'
  | 'modern'
  | 'elegant'
  | 'minimal'
  | 'academic'
  | 'corporate'
  | 'cyber'
  | 'appreciation'
  | 'royal'
  | 'neon'
  | 'sunset'
  | 'emerald';

type Unit = 'mm' | 'cm' | 'in' | 'px';

type ImageAsset = {
  name: string;
  data: string;
};

const templates: { id: Template; name: string; description: string }[] = [
  { id: 'classic', name: 'Classic Gold', description: 'Traditional gold border' },
  { id: 'modern', name: 'Modern Blue', description: 'Clean blue corporate style' },
  { id: 'elegant', name: 'Elegant', description: 'Premium decorative frame' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and clean' },
  { id: 'academic', name: 'Academic', description: 'School and college' },
  { id: 'corporate', name: 'Corporate', description: 'Professional training' },
  { id: 'cyber', name: 'Cyber Security', description: 'Technology themed' },
  { id: 'appreciation', name: 'Appreciation', description: 'Recognition and awards' },
  { id: 'royal', name: 'Royal Crest', description: 'Regal and prestigious badge look' },
  { id: 'neon', name: 'Neon Tech', description: 'Vibrant futuristic style' },
  { id: 'sunset', name: 'Sunset Glow', description: 'Warm and inspiring gradient feel' },
  { id: 'emerald', name: 'Emerald Luxury', description: 'Sophisticated deep green layout' },
];

const paperSizes: Record<string, { width: number; height: number }> = {
  'A4 Landscape': { width: 297, height: 210 },
  'A4 Portrait': { width: 210, height: 297 },
  'A3 Landscape': { width: 420, height: 297 },
  'A3 Portrait': { width: 297, height: 420 },
  'US Letter Landscape': { width: 279.4, height: 215.9 },
  'US Letter Portrait': { width: 215.9, height: 279.4 },
  'Legal Landscape': { width: 355.6, height: 215.9 },
};

const colorOptions = [
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Emerald', value: '#047857' },
  { name: 'Gold', value: '#b8860b' },
  { name: 'Purple', value: '#6d28d9' },
  { name: 'Maroon', value: '#991b1b' },
  { name: 'Black', value: '#222222' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Navy', value: '#17365d' },
];

const defaultValues = {
  organization: 'YOUR ORGANIZATION',
  title: 'CERTIFICATE OF ACHIEVEMENT',
  subtitle: 'This certificate is proudly presented to',
  recipient: 'Recipient Name',
  description: 'For successfully completing the training programme',
  course: 'Course / Programme Name',
  date: '',
  certificateId: 'NYX-2026-0001',
  signatory: 'Authorized Signatory',
  signatoryRole: 'Programme Coordinator',
  font: 'Georgia',
  fontSize: 30,
  recipientSize: 36,
};

export default function CertificateGeneratorTool({ onBack }: Props) {
  const [template, setTemplate] = useState<Template>('classic');
  const [accent, setAccent] = useState('#b8860b');
  const [paper, setPaper] = useState('A4 Landscape');
  const [unit, setUnit] = useState<Unit>('mm');
  const [customWidth, setCustomWidth] = useState('297');
  const [customHeight, setCustomHeight] = useState('210');

  const [values, setValues] = useState(defaultValues);
  const [logo, setLogo] = useState<ImageAsset | null>(null);
  const [photo, setPhoto] = useState<ImageAsset | null>(null);
  const [signature, setSignature] = useState<ImageAsset | null>(null);
  const [background, setBackground] = useState<ImageAsset | null>(null);
  const [showCertificateId, setShowCertificateId] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [borderStyle, setBorderStyle] = useState('double');
  const [activeTab, setActiveTab] = useState('content');
  const [notice, setNotice] = useState('');

  const logoInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const signatureInput = useRef<HTMLInputElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);

  const update = (key: keyof typeof defaultValues, value: string | number) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const dimensions =
    paper === 'Custom Size'
      ? {
          width: Math.max(1, Number(customWidth) || 297),
          height: Math.max(1, Number(customHeight) || 210),
        }
      : paperSizes[paper] || paperSizes['A4 Landscape'];

  const aspectRatio = dimensions.width / dimensions.height;
  const printWidth = `${dimensions.width}${unit}`;
  const printHeight = `${dimensions.height}${unit}`;

  const uploadImage = (
    file: File | undefined,
    setter: (asset: ImageAsset | null) => void,
  ) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice('Please select an image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setNotice('Image size must be 8 MB or less.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter({ name: file.name, data: reader.result });
        setNotice(`${file.name} uploaded successfully.`);
      }
    };

    reader.onerror = () => setNotice('Could not read this image.');
    reader.readAsDataURL(file);
  };

  const resetAll = () => {
    setTemplate('classic');
    setAccent('#b8860b');
    setPaper('A4 Landscape');
    setUnit('mm');
    setCustomWidth('297');
    setCustomHeight('210');
    setValues(defaultValues);
    setLogo(null);
    setPhoto(null);
    setSignature(null);
    setBackground(null);
    setShowCertificateId(true);
    setShowDate(true);
    setShowPhoto(true);
    setShowLogo(true);
    setShowSignature(true);
    setBorderStyle('double');
    setNotice('Design has been reset.');
  };

  const handlePrint = () => {
    setNotice('In the print dialog, choose Save as PDF for a PDF file.');
    window.print();
  };

  const formattedDate = values.date
    ? new Date(values.date + 'T12:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date of completion';

  const frameClass =
    template === 'classic' || template === 'elegant' || template === 'royal'
      ? 'double'
      : template === 'modern' || template === 'cyber' || template === 'neon'
        ? 'solid'
        : 'simple';

  const effectiveBorder = borderStyle === 'auto' ? frameClass : borderStyle;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @page {
          size: ${printWidth} ${printHeight};
          margin: 0;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${printWidth} !important;
            height: ${printHeight} !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #certificate-print-area,
          #certificate-print-area * {
            visibility: visible !important;
          }

          #certificate-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printWidth} !important;
            height: ${printHeight} !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          #certificate-print-area .certificate-inner {
            box-sizing: border-box !important;
            width: 100% !important;
            height: 100% !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">Certificate Studio</h1>
              <p className="text-xs text-slate-500">
                Design, customize and print certificates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetAll}
              className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 sm:flex"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:px-4"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 p-4 md:p-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        {/* Editor */}
        <aside className="no-print space-y-4">
          {/* Templates */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Palette size={18} className="text-indigo-600" />
              <h2 className="font-bold">Certificate designs</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {templates.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTemplate(item.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    template === item.id
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div
                    className="mb-2 flex h-12 items-center justify-center rounded-md bg-white"
                    style={{
                      border:
                        item.id === 'minimal'
                          ? '1px solid #e2e8f0'
                          : `3px ${['classic', 'elegant', 'royal'].includes(item.id) ? 'double' : 'solid'} ${accent}`,
                    }}
                  >
                    <Award size={20} style={{ color: accent }} />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold">{item.name}</span>
                    {template === item.id && (
                      <Check size={15} className="text-indigo-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Editor tabs */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 border-b border-slate-200">
              {[
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'assets', label: 'Images', icon: ImagePlus },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-3 text-sm font-semibold ${
                      activeTab === tab.id
                        ? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 p-4">
              {activeTab === 'content' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Organization name
                    </label>
                    <input
                      value={values.organization}
                      onChange={(e) => update('organization', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                      placeholder="Organization or institute"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Certificate title
                    </label>
                    <input
                      value={values.title}
                      onChange={(e) => update('title', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                      placeholder="Certificate of Completion"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Subtitle
                    </label>
                    <input
                      value={values.subtitle}
                      onChange={(e) => update('subtitle', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Recipient name
                    </label>
                    <input
                      value={values.recipient}
                      onChange={(e) => update('recipient', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
                      placeholder="Student or recipient name"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Description
                    </label>
                    <textarea
                      value={values.description}
                      onChange={(e) => update('description', e.target.value)}
                      rows={2}
                      className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Course / programme
                    </label>
                    <input
                      value={values.course}
                      onChange={(e) => update('course', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        Completion date
                      </label>
                      <input
                        type="date"
                        value={values.date}
                        onChange={(e) => update('date', e.target.value)}
                        className="w-full min-w-0 rounded-xl border border-slate-300 px-2 py-2.5 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        Certificate ID
                      </label>
                      <input
                        value={values.certificateId}
                        onChange={(e) => update('certificateId', e.target.value)}
                        className="w-full min-w-0 rounded-xl border border-slate-300 px-2 py-2.5 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        Signatory name
                      </label>
                      <input
                        value={values.signatory}
                        onChange={(e) => update('signatory', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        Signatory role
                      </label>
                      <input
                        value={values.signatoryRole}
                        onChange={(e) => update('signatoryRole', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'design' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Accent color
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map((color) => (
                        <button
                          type="button"
                          key={color.value}
                          onClick={() => setAccent(color.value)}
                          title={color.name}
                          aria-label={color.name}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                            accent === color.value
                              ? 'border-slate-900 ring-2 ring-slate-300'
                              : 'border-white'
                          }`}
                          style={{ backgroundColor: color.value }}
                        >
                          {accent === color.value && (
                            <Check size={17} className="text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Font family
                    </label>
                    <select
                      value={values.font}
                      onChange={(e) => update('font', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option value="Georgia">Georgia — Classic</option>
                      <option value="Arial">Arial — Clean</option>
                      <option value="Verdana">Verdana — Modern</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Tahoma">Tahoma</option>
                    </select>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-sm font-semibold">Title size</label>
                      <span className="text-xs text-slate-500">
                        {values.fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="48"
                      value={values.fontSize}
                      onChange={(e) => update('fontSize', Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-sm font-semibold">Recipient size</label>
                      <span className="text-xs text-slate-500">
                        {values.recipientSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="22"
                      max="56"
                      value={values.recipientSize}
                      onChange={(e) =>
                        update('recipientSize', Number(e.target.value))
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Border style
                    </label>
                    <select
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option value="auto">Template default</option>
                      <option value="double">Double border</option>
                      <option value="solid">Solid border</option>
                      <option value="dashed">Dashed border</option>
                      <option value="simple">Minimal border</option>
                    </select>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <p className="text-sm font-semibold">Show on certificate</p>
                    {[
                      {
                        label: 'Organization logo',
                        checked: showLogo,
                        change: setShowLogo,
                      },
                      {
                        label: 'Recipient photo',
                        checked: showPhoto,
                        change: setShowPhoto,
                      },
                      {
                        label: 'Signature',
                        checked: showSignature,
                        change: setShowSignature,
                      },
                      {
                        label: 'Completion date',
                        checked: showDate,
                        change: setShowDate,
                      },
                      {
                        label: 'Certificate ID',
                        checked: showCertificateId,
                        change: setShowCertificateId,
                      },
                    ].map((item) => (
                      <label
                        key={item.label}
                        className="flex cursor-pointer items-center justify-between gap-3 text-sm"
                      >
                        {item.label}
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => item.change(e.target.checked)}
                          className="h-4 w-4 accent-indigo-600"
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'assets' && (
                <>
                  <p className="text-sm leading-6 text-slate-500">
                    Upload images from your device. Images are read in your
                    browser for this preview; this component does not upload
                    them to a server.
                  </p>

                  {[
                    {
                      label: 'Organization logo',
                      description: 'PNG recommended for transparent logos',
                      input: logoInput,
                      asset: logo,
                      setter: setLogo,
                    },
                    {
                      label: 'Recipient photo',
                      description: 'Optional photo on the certificate',
                      input: photoInput,
                      asset: photo,
                      setter: setPhoto,
                    },
                    {
                      label: 'Signature image',
                      description: 'Use an authorized signature only',
                      input: signatureInput,
                      asset: signature,
                      setter: setSignature,
                    },
                    {
                      label: 'Background image',
                      description: 'Optional full-certificate background',
                      input: backgroundInput,
                      asset: background,
                      setter: setBackground,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                          {item.asset ? (
                            <img
                              src={item.asset.data}
                              alt={item.label}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <ImagePlus size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-slate-500">
                            {item.asset ? item.asset.name : item.description}
                          </p>
                        </div>
                        {item.asset && (
                          <button
                            type="button"
                            onClick={() => item.setter(null)}
                            aria-label={`Remove ${item.label}`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <input
                        ref={item.input}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          uploadImage(e.target.files?.[0], item.setter);
                          e.currentTarget.value = '';
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => item.input.current?.click()}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        <Upload size={15} />
                        {item.asset ? 'Replace image' : 'Upload image'}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>

          {notice && (
            <div
              role="status"
              className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-800"
            >
              {notice}
            </div>
          )}

          <button
            type="button"
            onClick={resetAll}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 sm:hidden"
          >
            <RotateCcw size={16} />
            Reset design
          </button>
        </aside>

        {/* Preview */}
        <section className="min-w-0">
          <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Live preview</h2>
              <p className="text-sm text-slate-500">
                Changes appear here as you edit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Ruler size={16} className="text-slate-500" />
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                className="max-w-[185px] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                aria-label="Certificate paper size"
              >
                {Object.keys(paperSizes).map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
                <option value="Custom Size">Custom Size</option>
              </select>

              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                aria-label="Measurement unit"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="in">in</option>
                <option value="px">px</option>
              </select>
            </div>
          </div>

          {paper === 'Custom Size' && (
            <div className="no-print mb-3 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Width ({unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Height ({unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <p className="col-span-2 text-xs text-slate-500">
                Custom dimensions are interpreted in the selected unit.
              </p>
            </div>
          )}

          <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-200/70 p-3 sm:p-6">
            <div className="mx-auto w-full" style={{ maxWidth: '1100px' }}>
              <div
                id="certificate-print-area"
                className="relative mx-auto overflow-hidden bg-white shadow-xl"
                style={{
                  width: '100%',
                  aspectRatio: String(aspectRatio),
                  color: '#202020',
                  fontFamily: values.font,
                  backgroundImage: background
                    ? `url("${background.data}")`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  className="certificate-inner absolute inset-[2.5%] flex flex-col items-center justify-between overflow-hidden text-center"
                  style={{
                    borderColor: accent,
                    borderWidth: effectiveBorder === 'simple' ? '1px' : '3px',
                    borderStyle:
                      effectiveBorder === 'double'
                        ? 'double'
                        : effectiveBorder === 'dashed'
                          ? 'dashed'
                          : 'solid',
                    padding: '3%',
                    backgroundColor: background ? 'rgba(255,255,255,0.88)' : '#ffffff',
                    backgroundImage:
                      background
                        ? undefined
                        : template === 'cyber' || template === 'neon'
                          ? 'radial-gradient(circle at top right, rgba(29,78,216,0.09), transparent 42%)'
                          : template === 'sunset'
                            ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(244,63,94,0.08))'
                            : undefined,
                  }}
                >
                  {/* Top section */}
                  <div className="flex w-full flex-col items-center">
                    {showLogo && logo && (
                      <img
                        src={logo.data}
                        alt="Organization logo"
                        className="mb-[1%] object-contain"
                        style={{ maxWidth: '16%', maxHeight: '11%' }}
                      />
                    )}

                    <div
                      className="font-sans text-[clamp(8px,1.5vw,17px)] font-bold uppercase tracking-[0.12em]"
                      style={{ color: accent }}
                    >
                      {values.organization || 'YOUR ORGANIZATION'}
                    </div>

                    <div
                      className="my-[1%] h-px w-[35%]"
                      style={{ backgroundColor: accent }}
                    />

                    <div
                      className="max-w-full font-bold uppercase leading-tight"
                      style={{
                        color: ['cyber', 'neon'].includes(template) ? '#17365d' : accent,
                        fontSize: `clamp(12px, ${values.fontSize / 10}vw, ${values.fontSize}px)`,
                      }}
                    >
                      {values.title || 'CERTIFICATE'}
                    </div>

                    <p className="mt-[1.5%] text-[clamp(8px,1.2vw,15px)] italic text-slate-600">
                      {values.subtitle}
                    </p>
                  </div>

                  {/* Recipient */}
                  <div className="flex w-full flex-1 flex-col items-center justify-center py-[1%]">
                    {showPhoto && photo && (
                      <img
                        src={photo.data}
                        alt="Recipient"
                        className="mb-[1.5%] rounded-full border-2 object-cover"
                        style={{
                          borderColor: accent,
                          width: 'clamp(35px, 7vw, 90px)',
                          height: 'clamp(35px, 7vw, 90px)',
                        }}
                      />
                    )}

                    <div
                      className="max-w-[94%] break-words font-bold leading-tight"
                      style={{
                        color: accent,
                        fontSize: `clamp(15px, ${values.recipientSize / 10}vw, ${values.recipientSize}px)`,
                      }}
                    >
                      {values.recipient || 'Recipient Name'}
                    </div>

                    <div
                      className="my-[1.5%] h-[2px] w-[45%]"
                      style={{ backgroundColor: accent }}
                    />

                    <p className="max-w-[88%] text-[clamp(8px,1.2vw,15px)] leading-relaxed text-slate-700">
                      {values.description}
                    </p>

                    <div
                      className="mt-[1.5%] max-w-[90%] break-words font-bold leading-tight"
                      style={{
                        color: template === 'minimal' ? '#222222' : accent,
                        fontSize: 'clamp(11px, 1.7vw, 21px)',
                      }}
                    >
                      {values.course || 'Course / Programme Name'}
                    </div>
                  </div>

                  {/* Bottom section */}
                  <div className="flex w-full items-end justify-between gap-[3%]">
                    <div className="flex min-w-0 flex-1 flex-col items-center">
                      {showDate && (
                        <>
                          <span
                            className="text-[clamp(7px,1vw,12px)] font-semibold"
                            style={{ color: accent }}
                          >
                            DATE
                          </span>
                          <span className="mt-1 text-[clamp(7px,1vw,12px)]">
                            {formattedDate}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col items-center">
                      {showSignature && signature ? (
                        <img
                          src={signature.data}
                          alt="Signature"
                          className="mb-1 h-auto max-h-[45px] max-w-[90%] object-contain"
                        />
                      ) : (
                        <div
                          className="mb-1 w-[90%] border-t"
                          style={{ borderColor: accent }}
                        />
                      )}
                      <span className="max-w-full break-words text-[clamp(7px,1vw,12px)] font-bold">
                        {values.signatory}
                      </span>
                      <span className="max-w-full break-words text-[clamp(6px,0.9vw,11px)] text-slate-600">
                        {values.signatoryRole}
                      </span>
                    </div>
                  </div>

                  {showCertificateId && (
                    <div
                      className="absolute bottom-[1.3%] right-[2%] max-w-[40%] truncate font-sans text-[clamp(6px,0.8vw,10px)]"
                      style={{ color: accent }}
                    >
                      ID: {values.certificateId}
                    </div>
                  )}

                  {['elegant', 'classic', 'royal'].includes(template) && (
                    <>
                      <div
                        className="pointer-events-none absolute left-[1.5%] top-[1.5%] h-[12%] w-[12%] rounded-tl-2xl border-l-2 border-t-2"
                        style={{ borderColor: accent }}
                      />
                      <div
                        className="pointer-events-none absolute bottom-[1.5%] right-[1.5%] h-[12%] w-[12%] rounded-br-2xl border-b-2 border-r-2"
                        style={{ borderColor: accent }}
                      />
                    </>
                  )}

                  {['cyber', 'neon'].includes(template) && (
                    <div
                      className="pointer-events-none absolute left-0 top-0 h-1 w-full"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="no-print mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Canvas: {dimensions.width} × {dimensions.height} {unit}
            </span>
            <span>For best results, enable background graphics in print settings.</span>
          </div>

          <div className="no-print mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <strong>Export tip:</strong> Click Export PDF, select “Save as PDF”
            in the browser print dialog, and disable browser headers/footers if
            available. Confirm paper size and orientation before saving.
          </div>
        </section>
      </main>
    </div>
  );
}