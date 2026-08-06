'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
  Download,
  Printer,
  Copy,
  Check,
  User,
  Briefcase,
  GraduationCap,
  Plus,
  X,
  Trash2,
  ChevronDown,
  Palette,
  Type,
  LayoutGrid,
  Wand2,
  Loader2,
  Languages,
  Award,
  FolderGit2,
  Heart,
  Link2,
  Upload,
  FileText,
  RotateCcw,
  FileUser,
  PenLine,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Globe,
  Crop,
  Layers,
  Sparkle
} from 'lucide-react';

// Custom LinkedIn Icon SVG Component
const LinkedinIcon = ({ size = 13, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Custom GitHub Icon SVG Component
const GithubIcon = ({ size = 13, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const A4_W = 794;
const A4_H = 1123;
const PAGE_PAD = 46;
const CONTENT_H = A4_H - PAGE_PAD * 2;

type Mode = 'resume' | 'cover';
type TemplateKey = 'modern' | 'classic' | 'corporate' | 'creative' | 'minimal' | 'executive' | 'canva_sidebar' | 'canva_header' | 'canva_minimal';
type ColorKey = 'blue' | 'red' | 'black' | 'purple' | 'green' | 'orange' | 'dark' | 'teal' | 'coral';
type FontKey = 'inter' | 'poppins' | 'roboto' | 'opensans' | 'lato' | 'merriweather';
type PhotoShape = 'circle' | 'rounded' | 'square';
type Tone = 'formal' | 'modern' | 'confident';

interface ResumeCoverLetterToolProps {
  onBack?: () => void;
}

interface Personal {
  name: string;
  title: string;
  photo: string;
  photoShape: PhotoShape;
  phone: string;
  email: string;
  linkedin: string;
  portfolio: string;
  github: string;
  address: string;
  summary: string;
}

interface ExperienceItem {
  company: string;
  designation: string;
  start: string;
  end: string;
  points: string[];
}

interface EducationItem {
  school: string;
  degree: string;
  years: string;
  cgpa: string;
}

interface ProjectItem {
  name: string;
  description: string;
  tech: string;
  link: string;
}

interface CustomSectionItem {
  id: string;
  title: string;
  type: 'list' | 'text' | 'cards';
  items: { heading: string; subheading: string; date: string; description: string }[];
}

interface CoverLetterData {
  jobTitle: string;
  company: string;
  tone: Tone;
  salutation: string;
  paragraphs: string[];
  signoff: string;
}

interface ResumeData {
  personal: Personal;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  languages: string[];
  certifications: string[];
  projects: ProjectItem[];
  achievements: string[];
  hobbies: string[];
  customSections: CustomSectionItem[];
}

interface Settings {
  template: TemplateKey;
  color: ColorKey;
  font: FontKey;
}

const EMPTY_DATA: ResumeData = {
  personal: {
    name: '',
    title: '',
    photo: '',
    photoShape: 'circle',
    phone: '',
    email: '',
    linkedin: '',
    portfolio: '',
    github: '',
    address: '',
    summary: '',
  },
  experience: [{ company: '', designation: '', start: '', end: '', points: [] }],
  education: [{ school: '', degree: '', years: '', cgpa: '' }],
  skills: [],
  languages: [],
  certifications: [],
  projects: [{ name: '', description: '', tech: '', link: '' }],
  achievements: [],
  hobbies: [],
  customSections: [],
};

const SAMPLE_DATA: ResumeData = {
  personal: {
    name: 'Sullab Sinhamahapatra',
    title: 'Development Professional & IT Specialist',
    photo: '',
    photoShape: 'circle',
    phone: '+91 96413 46222',
    email: 'sullabsinha@gmail.com',
    linkedin: 'linkedin.com/in/sullab-sinha',
    portfolio: 'sullabsinha.dev',
    github: 'github.com/sullab',
    address: 'New Delhi, India',
    summary:
      'Development professional with extensive experience designing and delivering community training programs, managing donor-funded projects, and building capacity of grassroots organizations in education and IT sectors.',
  },
  experience: [
    {
      company: 'NIIT Foundation',
      designation: 'Cluster Coordinator / IT Trainer',
      start: 'Jan 2021',
      end: 'Present',
      points: [
        'Managed HP Alfa Digitalization project across multiple districts, expanding reach to 2,500+ students.',
        'Delivered interactive IT & Cybersecurity workshops for grassroots community centers.',
        'Coordinated with international donors and regional NGOs to monitor educational outcomes.',
      ],
    },
    {
      company: 'Indus School & Community Project',
      designation: 'Project Officer',
      start: 'Jun 2018',
      end: 'Dec 2020',
      points: [
        'Conducted community needs assessments reaching 2,000+ households in rural areas.',
        'Coordinated livelihood workshops that helped 300+ women start income-generating activities.',
        'Prepared quarterly impact reports reviewed by national and regional stakeholders.',
      ],
    },
  ],
  education: [
    { school: 'The University of Burdwan', degree: 'Master of Arts (MA in History)', years: '2016 – 2018', cgpa: '1st Class' },
    { school: 'Khatra Adibasi Mahavidyalaya', degree: 'Bachelor of Arts (BA Hons)', years: '2013 – 2016', cgpa: '1st Class' },
  ],
  skills: ['Training Design', 'Needs Assessment', 'Project Management', 'Monitoring & Evaluation', 'Grant Reporting', 'MS Office', 'Facilitation', 'Stakeholder Engagement'],
  languages: ['Bengali', 'English', 'Hindi'],
  certifications: ['Diploma in Computer Application (DCA)', 'Google Digital Marketing Certificate', 'Domestic Data Entry Operator - Skill India', 'CISCO Cyber Suraksha'],
  projects: [
    {
      name: 'HP ALFA School Digitalization',
      description: 'Led a pilot delivering basic digital skills to rural students and educators; 92% reported improved classroom engagement.',
      tech: 'Curriculum design, community mobilization, partner coordination',
      link: '',
    },
  ],
  achievements: ['Awarded "Best Trainer 2023"', 'Invited speaker at the National NGO Capacity-Building Summit'],
  hobbies: ['Volunteering', 'Reading', 'Photography'],
  customSections: [
    {
      id: 'volunteering-1',
      title: 'Volunteering & Social Work',
      type: 'cards',
      items: [
        {
          heading: 'Youth Digital Empowerment Drive',
          subheading: 'Lead Volunteer',
          date: '2022 - 2023',
          description: 'Organized free computer literacy camps for underprivileged youth in rural districts.',
        },
      ],
    },
  ],
};

const THEME_COLORS: Record<ColorKey, { primary: string; soft: string; text: string; bg: string; muted: string; dark: boolean }> = {
  blue: { primary: '#2563eb', soft: '#dbeafe', text: '#1f2937', bg: '#ffffff', muted: '#4b5563', dark: false },
  red: { primary: '#dc2626', soft: '#fee2e2', text: '#1f2937', bg: '#ffffff', muted: '#4b5563', dark: false },
  black: { primary: '#111827', soft: '#e5e7eb', text: '#111827', bg: '#ffffff', muted: '#4b5563', dark: false },
  purple: { primary: '#7c3aed', soft: '#ede9fe', text: '#1f2937', bg: '#ffffff', muted: '#4b5563', dark: false },
  green: { primary: '#059669', soft: '#d1fae5', text: '#1f2937', bg: '#ffffff', muted: '#4b5563', dark: false },
  orange: { primary: '#ea580c', soft: '#ffedd5', text: '#1f2937', bg: '#ffffff', muted: '#4b5563', dark: false },
  dark: { primary: '#38bdf8', soft: '#0ea5e9', text: '#e2e8f0', bg: '#0f172a', muted: '#94a3b8', dark: true },
  teal: { primary: '#0d9488', soft: '#ccfbf1', text: '#1f2937', bg: '#ffffff', muted: '#4b5563', dark: false },
  coral: { primary: '#e11d48', soft: '#ffe4e6', text: '#1f2937', bg: '#ffffff', muted: '#4b5563', dark: false },
};

const COLOR_LABELS: Record<ColorKey, string> = {
  blue: 'Blue', red: 'Red', black: 'Black', purple: 'Purple', green: 'Green', orange: 'Orange', dark: 'Dark', teal: 'Teal', coral: 'Coral',
};

const FONTS: Record<FontKey, { label: string; family: string }> = {
  inter: { label: 'Inter', family: "'Inter', sans-serif" },
  poppins: { label: 'Poppins', family: "'Poppins', sans-serif" },
  roboto: { label: 'Roboto', family: "'Roboto', sans-serif" },
  opensans: { label: 'Open Sans', family: "'Open Sans', sans-serif" },
  lato: { label: 'Lato', family: "'Lato', sans-serif" },
  merriweather: { label: 'Merriweather', family: "'Merriweather', serif" },
};

const TEMPLATES: Record<TemplateKey, { label: string; header: 'center' | 'left' | 'split' | 'band' | 'sidebar'; section: 'bar' | 'caps' | 'underline' | 'rule' | 'leftline' | 'centerline'; photo: boolean }> = {
  modern: { label: 'Modern', header: 'center', section: 'bar', photo: true },
  classic: { label: 'Classic', header: 'left', section: 'underline', photo: false },
  corporate: { label: 'Corporate', header: 'split', section: 'caps', photo: false },
  creative: { label: 'Creative', header: 'band', section: 'leftline', photo: true },
  minimal: { label: 'Minimal', header: 'left', section: 'rule', photo: false },
  executive: { label: 'Executive', header: 'center', section: 'centerline', photo: false },
  canva_sidebar: { label: 'Canva Sidebar', header: 'sidebar', section: 'bar', photo: true },
  canva_header: { label: 'Canva Banner', header: 'band', section: 'underline', photo: true },
  canva_minimal: { label: 'Canva Minimal', header: 'left', section: 'bar', photo: true },
};

const TONE_LABELS: Record<Tone, string> = {
  formal: 'Formal & Traditional',
  modern: 'Modern & Concise',
  confident: 'Bold & Confident',
};

const REWRITE_STYLES: { key: string; label: string; instruction: string }[] = [
  { key: 'professional', label: 'Professional', instruction: 'a polished, professional tone with strong vocabulary' },
  { key: 'short', label: 'Short', instruction: 'an ultra-concise version, cutting every unnecessary word' },
  { key: 'long', label: 'Long', instruction: 'a detailed, expanded version with more context and specifics' },
  { key: 'powerful', label: 'Powerful', instruction: 'a bold, achievement-forward version led by strong action verbs' },
  { key: 'simple', label: 'Simple', instruction: 'a simple, plain-language version any reader can understand' },
  { key: 'recruiter', label: 'Recruiter Friendly', instruction: 'an ATS-friendly version that naturally includes relevant keywords' },
];

const loadFonts = (fonts: string[]) => {
  if (typeof window === 'undefined') return;
  const families = fonts.join('&family=');
  const id = 'rcb-google-fonts';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  document.head.appendChild(link);
};

const textToLines = (text: string): string[] =>
  text
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*]\s*/, '').trim())
    .filter(Boolean);

const commaToTags = (text: string): string[] =>
  text
    .split(/[,\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

async function callAI(prompt: string): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const d = await res.json();
      if (d?.error) msg = d.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = await res.json();
  if (data?.text) return data.text;
  throw new Error(data?.error || 'Empty response from AI');
}

function SectionHeader({ title, style, color }: { title: string; style: string; color: { primary: string; text: string; muted: string; dark: boolean } }) {
  const C = color;
  const s: React.CSSProperties = { color: C.dark ? C.text : C.text };
  switch (style) {
    case 'bar':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 6, height: 16, background: C.primary, borderRadius: 2 }} />
          <h3 style={{ ...s, margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>{title}</h3>
        </div>
      );
    case 'caps':
      return (
        <h3 style={{ ...s, margin: '0 0 10px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, borderBottom: `2px solid ${C.primary}`, paddingBottom: 4 }}>
          {title}
        </h3>
      );
    case 'underline':
      return (
        <h3 style={{ ...s, margin: '0 0 10px', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4 }}>
          {title}
        </h3>
      );
    case 'rule':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <h3 style={{ ...s, margin: 0, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap' }}>{title}</h3>
          <div style={{ flex: 1, height: 1, background: C.dark ? '#334155' : '#cbd5e1' }} />
        </div>
      );
    case 'leftline':
      return (
        <h3 style={{ ...s, margin: '0 0 10px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, borderLeft: `4px solid ${C.primary}`, paddingLeft: 8 }}>
          {title}
        </h3>
      );
    case 'centerline':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: C.primary }} />
          <h3 style={{ ...s, margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap' }}>{title}</h3>
          <div style={{ flex: 1, height: 1, background: C.primary }} />
        </div>
      );
    default:
      return <h3 style={{ ...s, margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>{title}</h3>;
  }
}

export default function ResumeCoverLetterTool({ onBack }: ResumeCoverLetterToolProps) {
  const [mode, setMode] = useState<Mode>('resume');
  const [data, setData] = useState<ResumeData>(EMPTY_DATA);
  const [settings, setSettings] = useState<Settings>({ template: 'canva_sidebar', color: 'blue', font: 'poppins' });
  const [cover, setCover] = useState<CoverLetterData>({
    jobTitle: '',
    company: '',
    tone: 'formal',
    salutation: 'Dear Hiring Manager,',
    paragraphs: [],
    signoff: 'Sincerely,',
  });
  const [openSections, setOpenSections] = useState<string[]>(['personal']);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [rewrite, setRewrite] = useState<{ title: string; current: string; onApply: (t: string) => void } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.9);

  const measureRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const toggleSection = (id: string) =>
    setOpenSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const patchPersonal = (k: keyof Personal, v: any) =>
    setData((d) => ({ ...d, personal: { ...d.personal, [k]: v } }));

  const updateExperience = (i: number, k: keyof ExperienceItem, v: string | string[]) =>
    setData((d) => ({
      ...d,
      experience: d.experience.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)),
    }));

  const updateEducation = (i: number, k: keyof EducationItem, v: string) =>
    setData((d) => ({
      ...d,
      education: d.education.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)),
    }));

  const updateProject = (i: number, k: keyof ProjectItem, v: string) =>
    setData((d) => ({
      ...d,
      projects: d.projects.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)),
    }));

  const addCustomSection = (title: string) => {
    if (!title.trim()) return;
    const newSec: CustomSectionItem = {
      id: 'custom-' + Date.now(),
      title: title.trim(),
      type: 'cards',
      items: [{ heading: '', subheading: '', date: '', description: '' }],
    };
    setData((d) => ({ ...d, customSections: [...d.customSections, newSec] }));
    setOpenSections((prev) => [...prev, newSec.id]);
    showToast(`Added custom section: ${title}`);
  };

  const removeCustomSection = (id: string) => {
    setData((d) => ({ ...d, customSections: d.customSections.filter((s) => s.id !== id) }));
  };

  const setTags = (k: 'skills' | 'languages' | 'certifications' | 'achievements' | 'hobbies', v: string[]) =>
    setData((d) => ({ ...d, [k]: v }));

  const onPhotoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchPersonal('photo', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const loadSample = () => {
    setData(SAMPLE_DATA);
    setCover((c) => ({ ...c, jobTitle: 'Development Professional / IT Trainer', company: 'NIIT Foundation', tone: 'formal' }));
    setMode('resume');
    showToast('Sample data loaded with +91 New Delhi contact');
  };

  const resetAll = () => {
    setData(EMPTY_DATA);
    setCover({ jobTitle: '', company: '', tone: 'formal', salutation: 'Dear Hiring Manager,', paragraphs: [], signoff: 'Sincerely,' });
    showToast('Form cleared');
  };

  const getPhotoStyle = (shape: PhotoShape): React.CSSProperties => {
    if (shape === 'square') return { borderRadius: '4px' };
    if (shape === 'rounded') return { borderRadius: '16px' };
    return { borderRadius: '50%' };
  };

  const children = useMemo<React.ReactNode[]>(() => {
    const C = THEME_COLORS[settings.color];
    const f = FONTS[settings.font].family;
    const tpl = TEMPLATES[settings.template];
    const kids: React.ReactNode[] = [];
    const p = data.personal;
    const contact = [
      p.email && { val: p.email, icon: Mail },
      p.phone && { val: p.phone, icon: Phone },
      p.address && { val: p.address, icon: MapPin },
      p.linkedin && { val: p.linkedin, icon: LinkedinIcon },
      p.portfolio && { val: p.portfolio, icon: Globe },
      p.github && { val: p.github, icon: GithubIcon },
    ].filter(Boolean) as { val: string; icon: any }[];

    const renderHeader = () => {
      const name = p.name || 'Your Name';
      const titleText = p.title;
      const contactChips = (color: string) =>
        contact.map((c, i) => (
          <span key={i} style={{ color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <c.icon size={13} style={{ flexShrink: 0 }} />
            {c.val}
          </span>
        ));
      const base: React.CSSProperties = { fontFamily: f };
      switch (tpl.header) {
        case 'center':
          return (
            <div style={{ textAlign: 'center', ...base }}>
              {tpl.photo && p.photo && (
                <img src={p.photo} alt="photo" style={{ width: 92, height: 92, objectFit: 'cover', border: `3px solid ${C.primary}`, marginBottom: 10, ...getPhotoStyle(p.photoShape) }} />
              )}
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: C.dark ? C.text : C.text, letterSpacing: 0.5 }}>{name}</h1>
              {titleText && (
                <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: C.primary, letterSpacing: 2, textTransform: 'uppercase' }}>{titleText}</p>
              )}
              {contact.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 14px', marginTop: 8, fontSize: 11.5, color: C.muted }}>
                  {contactChips(C.muted)}
                </div>
              )}
              <div style={{ height: 2, background: C.primary, width: 64, margin: '12px auto 0' }} />
            </div>
          );
        case 'split':
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `3px solid ${C.primary}`, paddingBottom: 12, ...base }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.text }}>{name}</h1>
                {titleText && <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: C.primary }}>{titleText}</p>}
              </div>
              <div style={{ textAlign: 'right', fontSize: 11.5, color: C.muted, lineHeight: 1.7 }}>
                {contactChips(C.muted)}
              </div>
            </div>
          );
        case 'band':
          return (
            <div style={{ background: C.primary, color: '#ffffff', padding: 20, textAlign: 'center', borderRadius: 8, ...base }}>
              {tpl.photo && p.photo && (
                <img src={p.photo} alt="photo" style={{ width: 84, height: 84, objectFit: 'cover', border: '3px solid #ffffff', marginBottom: 8, ...getPhotoStyle(p.photoShape) }} />
              )}
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#ffffff' }}>{name}</h1>
              {titleText && <p style={{ margin: '4px 0 0', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 2, textTransform: 'uppercase' }}>{titleText}</p>}
              {contact.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 14px', marginTop: 8, fontSize: 10.5, color: 'rgba(255,255,255,0.92)' }}>
                  {contactChips('rgba(255,255,255,0.92)')}
                </div>
              )}
            </div>
          );
        case 'sidebar':
          return (
            <div style={{ display: 'flex', gap: 16, borderBottom: `2px solid ${C.soft}`, paddingBottom: 12, ...base }}>
              {p.photo && (
                <img src={p.photo} alt="photo" style={{ width: 84, height: 84, objectFit: 'cover', border: `3px solid ${C.primary}`, ...getPhotoStyle(p.photoShape) }} />
              )}
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text }}>{name}</h1>
                {titleText && <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: C.primary }}>{titleText}</p>}
                {contact.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 6, fontSize: 11, color: C.muted }}>
                    {contactChips(C.muted)}
                  </div>
                )}
              </div>
            </div>
          );
        default:
          return (
            <div style={{ ...base, paddingBottom: 10, borderBottom: `2px solid ${C.soft}` }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.text }}>{name}</h1>
              {titleText && <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: C.primary }}>{titleText}</p>}
              {contact.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', marginTop: 6, fontSize: 11.5, color: C.muted }}>
                  {contactChips(C.muted)}
                </div>
              )}
            </div>
          );
      }
    };

    kids.push(<div key="rcb-header">{renderHeader()}</div>);

    const section = (title: string, content: React.ReactNode, key: string) => (
      <div key={key} style={{ marginTop: 16 }}>
        <SectionHeader title={title} style={tpl.section} color={C} />
        <div style={{ fontFamily: f, color: C.text, fontSize: 12.5, lineHeight: 1.55 }}>{content}</div>
      </div>
    );

    if (p.summary) {
      kids.push(
        section('Profile', <p style={{ margin: 0 }}>{p.summary}</p>, 'sec-profile'),
      );
    }

    if (data.experience.some((e) => e.company || e.designation)) {
      kids.push(
        section(
          'Work Experience',
          data.experience
            .filter((e) => e.company || e.designation)
            .map((e, i) => (
              <div key={i} style={{ marginBottom: i < data.experience.length - 1 ? 10 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{e.designation || e.company}</span>
                    {e.company && e.designation && <span style={{ color: C.muted }}> — {e.company}</span>}
                  </div>
                  {(e.start || e.end) && <span style={{ fontSize: 11.5, color: C.muted, whiteSpace: 'nowrap' }}>{e.start}{e.start && e.end ? ' – ' : ''}{e.end}</span>}
                </div>
                {e.points.length > 0 && (
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {e.points.map((pt, j) => (
                      <li key={j} style={{ marginBottom: 3 }}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>
            )),
          'sec-exp',
        ),
      );
    }

    if (data.projects.some((pr) => pr.name)) {
      kids.push(
        section(
          'Projects',
          data.projects
            .filter((pr) => pr.name)
            .map((pr, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{pr.name}</span>
                  {(pr.link || pr.tech) && (
                    <span style={{ fontSize: 10.5, color: C.muted }}>
                      {pr.tech}
                      {pr.tech && pr.link ? ' · ' : ''}
                      {pr.link}
                    </span>
                  )}
                </div>
                {pr.description && <p style={{ margin: '4px 0 0' }}>{pr.description}</p>}
              </div>
            )),
          'sec-projects',
        ),
      );
    }

    if (data.education.some((ed) => ed.school || ed.degree)) {
      kids.push(
        section(
          'Education',
          data.education
            .filter((ed) => ed.school || ed.degree)
            .map((ed, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 12.5 }}>{ed.degree}</span>
                  {ed.school && <span style={{ color: C.muted }}> — {ed.school}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, whiteSpace: 'nowrap' }}>
                  {ed.years}{ed.years && ed.cgpa ? ' · ' : ''}{ed.cgpa}
                </div>
              </div>
            )),
          'sec-edu',
        ),
      );
    }

    if (data.skills.length > 0) {
      kids.push(
        section(
          'Core Skills',
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{ background: C.soft, color: C.dark ? '#e2e8f0' : '#1f2937', borderRadius: 4, padding: '3px 9px', fontSize: 11.5, fontWeight: 500 }}>
                {s}
              </span>
            ))}
          </div>,
          'sec-skills',
        ),
      );
    }

    if (data.languages.length > 0) {
      kids.push(
        section(
          'Languages',
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {data.languages.map((l, i) => (
              <span key={i} style={{ fontSize: 12.5 }}>{l}</span>
            ))}
          </div>,
          'sec-lang',
        ),
      );
    }

    if (data.certifications.length > 0) {
      kids.push(
        section(
          'Certifications',
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.certifications.map((c, i) => (
              <li key={i} style={{ marginBottom: 3 }}>{c}</li>
            ))}
          </ul>,
          'sec-cert',
        ),
      );
    }

    if (data.achievements.length > 0) {
      kids.push(
        section(
          'Achievements',
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.achievements.map((a, i) => (
              <li key={i} style={{ marginBottom: 3 }}>{a}</li>
            ))}
          </ul>,
          'sec-achieve',
        ),
      );
    }

    if (data.hobbies.length > 0) {
      kids.push(
        section(
          'Hobbies & Interests',
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {data.hobbies.map((h, i) => (
              <span key={i} style={{ fontSize: 12.5 }}>{h}</span>
            ))}
          </div>,
          'sec-hobbies',
        ),
      );
    }

    {/* Custom Sections */}
    data.customSections.forEach((sec) => {
      kids.push(
        section(
          sec.title,
          sec.items.map((item, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>{item.heading}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{item.date}</span>
              </div>
              {item.subheading && <div style={{ fontSize: 11.5, color: C.primary }}>{item.subheading}</div>}
              {item.description && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: C.muted }}>{item.description}</p>}
            </div>
          )),
          `sec-${sec.id}`,
        ),
      );
    });

    return kids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, settings]);

  const coverChildren = useMemo<React.ReactNode[]>(() => {
    const C = THEME_COLORS[settings.color];
    const f = FONTS[settings.font].family;
    const p = data.personal;
    const name = p.name || 'Your Name';
    const contact = [p.email, p.phone, p.address].filter(Boolean);
    const kids: React.ReactNode[] = [];
    kids.push(
      <div key="cv-head" style={{ fontFamily: f, color: C.text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.primary }}>{name}</h1>
            {p.title && <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{p.title}</p>}
          </div>
          {contact.length > 0 && (
            <div style={{ textAlign: 'right', fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
              {contact.map((c, i) => <div key={i}>{c}</div>)}
            </div>
          )}
        </div>
        <div style={{ height: 2, background: C.primary, marginTop: 10 }} />
      </div>,
    );
    kids.push(
      <div key="cv-body" style={{ fontFamily: f, color: C.text, fontSize: 12.5, lineHeight: 1.65, marginTop: 18 }}>
        <p style={{ margin: '0 0 6px' }}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <p style={{ margin: '0 0 14px' }}>{cover.salutation || 'Dear Hiring Manager,'}</p>
        {(cover.paragraphs.length ? cover.paragraphs : ['Add a brief opening paragraph.', '', 'Describe why you are a strong fit, connecting your skills and experience to the role.', '', 'Close with a confident call to action.']).map((para, i) =>
          para === '' ? <div key={i} style={{ height: 12 }} /> : <p key={i} style={{ margin: '0 0 10px' }}>{para}</p>,
        )}
        <p style={{ margin: '26px 0 0' }}>{cover.signoff || 'Sincerely,'}</p>
        <p style={{ margin: 0, fontWeight: 700 }}>{name}</p>
      </div>,
    );
    return kids;
  }, [data, settings, cover]);

  const docChildren = mode === 'resume' ? children : coverChildren;

  const [groups, setGroups] = useState<number[][]>([]);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    const list = Array.from(root.children) as HTMLElement[];
    const g: number[][] = [];
    let cur: number[] = [];
    let pageStart = 0;
    for (let i = 0; i < list.length; i++) {
      const top = list[i].offsetTop;
      const bottom = top + list[i].offsetHeight;
      if (cur.length && bottom - pageStart > CONTENT_H) {
        g.push(cur);
        cur = [];
        pageStart = top;
      }
      cur.push(i);
    }
    if (cur.length) g.push(cur);
    setGroups(g);
  }, [docChildren, mode]);

  useLayoutEffect(() => {
    const pane = previewPaneRef.current;
    if (!pane) return;
    const ro = new ResizeObserver(() => {
      const w = pane.clientWidth;
      setPreviewScale(Math.min(1, (w - 48) / A4_W));
    });
    ro.observe(pane);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    loadFonts(Object.values(FONTS).map((f) => f.label));
  }, []);

  const handleCopyDoc = async () => {
    const doc = mode === 'cover' ? cover.paragraphs.join('\n\n') : '';
    if (doc) {
      try {
        await navigator.clipboard.writeText(doc);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        showToast('Copy failed — select text manually');
      }
    } else {
      showToast(mode === 'resume' ? 'Switch to Cover Letter mode to copy text' : 'Generate a letter first');
    }
  };

  const downloadPDF = async () => {
    setPdfBusy(true);
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'rcb-html2canvas');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'rcb-jspdf');
      const jsPDF = (window as any).jspdf?.jsPDF;
      const html2canvas = (window as any).html2canvas;
      if (!jsPDF || !html2canvas) throw new Error('libs missing');
      
      const pages = Array.from(document.querySelectorAll<HTMLElement>('.rcb-preview-page'));
      if (!pages.length) throw new Error('No preview pages found');

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      for (let i = 0; i < pages.length; i++) {
        const el = pages[i];
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const img = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
      }
      const name = (data.personal.name.trim().replace(/\s+/g, '_') || 'document').toLowerCase();
      pdf.save(`${mode === 'resume' ? 'resume' : 'cover_letter'}_${name}.pdf`);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      showToast('Direct PDF failed — opening print dialog instead');
      window.print();
    } finally {
      setPdfBusy(false);
    }
  };

  const loadScript = (src: string, id: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (document.getElementById(id)) return resolve();
      const s = document.createElement('script');
      s.id = id;
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('script load failed'));
      document.head.appendChild(s);
    });

  const runAI = async (key: string, prompt: string): Promise<string> => {
    setAiBusy(key);
    try {
      const text = await callAI(prompt);
      return text.trim();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'AI request failed');
      throw err;
    } finally {
      setAiBusy(null);
    }
  };

  const genSummary = async () => {
    const p = data.personal;
    const skillList = data.skills.length ? data.skills.join(', ') : 'not specified';
    const prompt = `Write a 2-3 sentence professional summary for a resume.
Role: ${p.title || 'the target role'}
Key skills: ${skillList}
Context: ${p.summary ? p.summary : 'Experience is available in the resume.'}
Rules: single paragraph, first-person-free, achievement-driven, no preamble, no quotes. Output only the summary.`;
    try {
      const text = await runAI('summary', prompt);
      patchPersonal('summary', text);
      showToast('Summary generated');
    } catch {
      /* handled */
    }
  };

  const improveExperience = async (idx: number) => {
    const item = data.experience[idx];
    const src = item.points.join('\n') || 'No details provided yet. Infer 2-3 realistic bullets from the job title and company.';
    const prompt = `Rewrite the following resume experience bullet points to be professional, ATS-friendly and achievement-driven.
Start each bullet with a strong action verb. Add quantified results where plausible; if you must invent a number, mark it like [X]%.
Keep each bullet under ~20 words, one bullet per line, no numbering, no preamble.
Role: ${item.designation || 'the role'} at ${item.company || 'the company'}
Input:
${src}`;
    try {
      const text = await runAI('exp-' + idx, prompt);
      updateExperience(idx, 'points', textToLines(text));
      showToast('Experience improved with AI');
    } catch {
      /* handled */
    }
  };

  const suggestSkills = async () => {
    const prompt = `Suggest the 12 most relevant resume skills for a candidate targeting the role: ${data.personal.title || 'the target role'}.
Current known skills: ${data.skills.length ? data.skills.join(', ') : 'none'}.
Return only a comma-separated list, no preamble.`;
    try {
      const text = await runAI('skills', prompt);
      setTags('skills', Array.from(new Set([...data.skills, ...commaToTags(text)])));
      showToast('Skills suggested');
    } catch {
      /* handled */
    }
  };

  const suggestCertifications = async () => {
    const prompt = `Suggest 4-6 relevant professional certifications for a candidate targeting: ${data.personal.title || 'the target role'}.
Return only a comma-separated list, no preamble.`;
    try {
      const text = await runAI('certs', prompt);
      setTags('certifications', commaToTags(text));
      showToast('Certifications suggested');
    } catch {
      /* handled */
    }
  };

  const genAchievements = async () => {
    const prompt = `Generate 5 professional achievement bullet points for a candidate targeting: ${data.personal.title || 'the target role'}.
Relevant skills: ${data.skills.length ? data.skills.join(', ') : 'not specified'}.
Each bullet should start with an action verb, include a quantified result where plausible, under 20 words. One per line, no numbering, no preamble.`;
    try {
      const text = await runAI('achieve', prompt);
      setTags('achievements', textToLines(text));
      showToast('Achievements generated');
    } catch {
      /* handled */
    }
  };

  const genCoverLetter = async () => {
    const p = data.personal;
    const prompt = `Write a complete cover letter for:
Name: ${p.name || 'the candidate'}
Role: ${cover.jobTitle}
Company: ${cover.company || 'the target company'}
Tone: ${TONE_LABELS[cover.tone]}
Skills: ${data.skills.length ? data.skills.join(', ') : 'not specified'}
Background: ${p.summary || 'experienced professional'}
Rules:
- Start with a specific hook, never "I am writing to apply for...".
- 3 short paragraphs, under 350 words.
- Connect 2-3 concrete strengths to the role with one specific example.
- Confident call to action at the end.
- Return ONLY the letter: salutation line, paragraphs separated by a blank line, and sign-off line.`;
    try {
      const text = await runAI('cover', prompt);
      const lines = text.split('\n').map((l) => l.trim());
      const sal = lines.find((l) => /^Dear/i.test(l)) || 'Dear Hiring Manager,';
      const sign = lines.filter((l) => /^(Sincerely|Best regards|Yours|Thanks|Thank you)/i.test(l)).pop() || 'Sincerely,';
      let paras: string[] = [];
      let cur = '';
      for (const l of lines) {
        if (/^Dear/i.test(l) || /^(Sincerely|Best regards|Yours|Thanks|Thank you)/i.test(l)) continue;
        if (l === '') {
          if (cur) paras.push(cur);
          cur = '';
        } else {
          cur = cur ? cur + ' ' + l : l;
        }
      }
      if (cur) paras.push(cur);
      setCover((c) => ({ ...c, salutation: sal, paragraphs: paras, signoff: sign }));
      showToast('Cover letter generated');
    } catch {
      /* handled */
    }
  };

  const applyRewrite = async (style: string, current: string, onApply: (t: string) => void) => {
    if (aiBusy) return;
    const rule = REWRITE_STYLES.find((r) => r.key === style);
    const prompt = `Rewrite the following resume text in ${rule?.instruction || 'a professional tone'}.
Keep the core facts intact, suitable for an ATS-friendly resume. Output only the rewritten text.
Text:
${current}`;
    try {
      const text = await runAI('rewrite-' + style, prompt);
      onApply(text.trim());
      setRewrite(null);
      showToast('Rewritten');
    } catch {
      /* handled */
    }
  };

  const PreviewPane = (
    <div ref={previewPaneRef} className="rcb-preview-pane">
      <div style={{ width: A4_W * previewScale, height: A4_H * previewScale + 40, position: 'relative', margin: '0 auto' }}>
        {groups.map((grp, pi) => {
          const C = THEME_COLORS[settings.color];
          return (
            <div
              key={pi}
              className="rcb-preview-page"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: A4_W,
                height: A4_H,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                background: C.bg,
                color: C.text,
                overflow: 'hidden',
                boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                fontFamily: FONTS[settings.font].family,
              }}
            >
              <div style={{ padding: PAGE_PAD }}>
                {grp.map((i) => docChildren[i])}
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: A4_W,
              height: A4_H,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 15,
              boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
            }}
          >
            Fill in the form to build your CV
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 8, color: '#6b7280', fontSize: 12 }}>
        {groups.length} page{groups.length === 1 ? '' : 's'} · A4 · live preview
      </div>
    </div>
  );

  const PrintDoc = (
    <div className="rcb-print-root" style={{ display: 'none' }}>
      {groups.map((grp, pi) => {
        const C = THEME_COLORS[settings.color];
        return (
          <div
            key={pi}
            className="rcb-print-page"
            style={{
              width: A4_W,
              height: A4_H,
              background: C.bg,
              color: C.text,
              overflow: 'hidden',
              padding: PAGE_PAD,
              boxSizing: 'border-box',
              pageBreakAfter: 'always',
              fontFamily: FONTS[settings.font].family,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            {grp.map((i) => docChildren[i])}
          </div>
        );
      })}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="rcb-field">
      <span className="rcb-field-label">{label}</span>
      {children}
    </label>
  );

  const inputCls = 'rcb-input';
  const ChipInput = ({
    tags,
    onChange,
    placeholder,
    suggest,
    suggestBusy,
  }: {
    tags: string[];
    onChange: (v: string[]) => void;
    placeholder: string;
    suggest?: () => void;
    suggestBusy?: boolean;
  }) => {
    const [val, setVal] = useState('');
    const add = () => {
      const newTags = commaToTags(val);
      if (newTags.length) onChange(Array.from(new Set([...tags, ...newTags])));
      setVal('');
    };
    return (
      <div className="rcb-chip-wrap">
        <div className="rcb-chip-list">
          {tags.map((t, i) => (
            <span key={i} className="rcb-chip">
              {t}
              <button type="button" className="rcb-chip-x" onClick={() => onChange(tags.filter((_, j) => j !== i))}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className={inputCls}
            style={{ flex: 1 }}
            value={val}
            placeholder={placeholder}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                add();
              }
            }}
            onBlur={add}
          />
          {suggest && (
            <button type="button" className="rcb-ai-btn rcb-ai-btn-small" onClick={suggest} disabled={!!suggestBusy}>
              {suggestBusy ? <Loader2 size={12} className="rcb-spin" /> : <Sparkles size={12} />}
              AI Suggest
            </button>
          )}
        </div>
      </div>
    );
  };

  const FormSection = ({
    id,
    icon,
    title,
    right,
    children,
  }: {
    id: string;
    icon: React.ReactNode;
    title: string;
    right?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const open = openSections.includes(id);
    return (
      <div className="rcb-form-section">
        <div className="rcb-form-section-head" onClick={() => toggleSection(id)}>
          <span className="rcb-form-section-title">
            {icon}
            {title}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {right}
            <ChevronDown size={16} className={`rcb-chev ${open ? 'rcb-open' : ''}`} />
          </span>
        </div>
        {open && <div className="rcb-form-section-body">{children}</div>}
      </div>
    );
  };

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 8 }}>{children}</div>
  );

  return (
    <div className="rcb-root">
      <style>{`
        .rcb-root{ --rcb-brand:#2563eb; display:flex; flex-direction:column; height:100%; min-height:640px; background:#f1f5f9; font-family:inherit; color:#1f2937; border-radius:12px; overflow:hidden; }
        .rcb-toolbar{ display:flex; align-items:center; gap:10px; padding:10px 16px; background:#ffffff; border-bottom:1px solid #e5e7eb; flex-wrap:wrap; }
        .rcb-brand{ display:flex; align-items:center; gap:8px; font-weight:800; font-size:15px; color:#111827; }
        .rcb-brand .rcb-brand-badge{ width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff; }
        .rcb-seg{ display:flex; background:#eef2ff; border-radius:8px; padding:3px; }
        .rcb-seg button{ border:none; background:transparent; padding:6px 14px; border-radius:6px; font-size:13px; font-weight:600; color:#475569; cursor:pointer; display:flex; align-items:center; gap:6px; }
        .rcb-seg button.rcb-active{ background:#2563eb; color:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2); }
        .rcb-tbtn{ display:flex; align-items:center; gap:6px; border:1px solid #d1d5db; background:#fff; border-radius:8px; padding:6px 10px; font-size:12.5px; font-weight:600; color:#374151; cursor:pointer; transition:all .15s; }
        .rcb-tbtn:hover{ border-color:#2563eb; color:#2563eb; }
        .rcb-tbtn:disabled{ opacity:.55; cursor:not-allowed; }
        .rcb-tbtn.rcb-primary{ background:#2563eb; border-color:#2563eb; color:#fff; }
        .rcb-tbtn.rcb-primary:hover{ background:#1d4ed8; }
        .rcb-main{ display:flex; flex:1; min-height:0; }
        .rcb-form-panel{ width:420px; min-width:360px; background:#ffffff; border-right:1px solid #e5e7eb; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
        .rcb-preview-pane{ flex:1; overflow-y:auto; padding:20px 16px; min-width:0; }
        .rcb-form-section{ border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; background:#fafafa; }
        .rcb-form-section-head{ display:flex; align-items:center; justify-content:space-between; padding:10px 12px; cursor:pointer; background:#fff; user-select:none; }
        .rcb-form-section-head:hover{ background:#f8fafc; }
        .rcb-form-section-title{ display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700; color:#111827; }
        .rcb-form-section-title svg{ color:#2563eb; }
        .rcb-form-section-body{ padding:12px; display:flex; flex-direction:column; gap:10px; border-top:1px solid #eef2f7; }
        .rcb-chev{ transition:transform .18s; }
        .rcb-chev.rcb-open{ transform:rotate(180deg); }
        .rcb-field{ display:flex; flex-direction:column; gap:4px; }
        .rcb-field-label{ font-size:11.5px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.4px; }
        .rcb-input, .rcb-textarea{ border:1px solid #d1d5db; border-radius:8px; padding:7px 10px; font-size:13px; font-family:inherit; outline:none; transition:border-color .15s, box-shadow .15s; background:#fff; color:#111827; width:100%; box-sizing:border-box; }
        .rcb-input:focus, .rcb-textarea:focus{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
        .rcb-textarea{ resize:vertical; min-height:64px; line-height:1.5; }
        .rcb-ai-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; border:none; background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; border-radius:8px; padding:8px 12px; font-size:12.5px; font-weight:700; cursor:pointer; transition:opacity .15s, transform .1s; }
        .rcb-ai-btn:hover{ opacity:.92; transform:translateY(-1px); }
        .rcb-ai-btn:disabled{ opacity:.6; cursor:not-allowed; transform:none; }
        .rcb-ai-btn.rcb-ai-btn-small{ padding:5px 9px; font-size:11.5px; }
        .rcb-icon-btn{ display:inline-flex; align-items:center; justify-content:center; border:1px solid #d1d5db; background:#fff; border-radius:8px; width:30px; height:30px; color:#374151; cursor:pointer; }
        .rcb-icon-btn:hover{ border-color:#ef4444; color:#ef4444; }
        .rcb-chip-wrap{ display:flex; flex-direction:column; gap:8px; }
        .rcb-chip-list{ display:flex; flex-wrap:wrap; gap:6px; min-height:26px; }
        .rcb-chip{ display:inline-flex; align-items:center; gap:5px; background:#eef2ff; color:#3730a3; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:600; }
        .rcb-chip-x{ display:inline-flex; border:none; background:transparent; color:#6d28d9; cursor:pointer; padding:0; }
        .rcb-chip-x:hover{ color:#111827; }
        .rcb-add-btn{ border:1px dashed #cbd5e1; background:#fff; border-radius:8px; padding:7px; font-size:12.5px; font-weight:600; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; }
        .rcb-add-btn:hover{ border-color:#2563eb; color:#2563eb; }
        .rcb-list-card{ border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#fff; display:flex; flex-direction:column; gap:8px; }
        .rcb-card-head{ display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:700; color:#374151; }
        .rcb-toolsbar{ display:flex; align-items:center; gap:8px; padding:8px 14px; background:#ffffff; border-bottom:1px solid #e5e7eb; flex-wrap:wrap; }
        .rcb-tools-label{ display:flex; align-items:center; gap:5px; font-size:11.5px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.4px; }
        .rcb-chip-choice{ border:1px solid #d1d5db; background:#fff; border-radius:999px; padding:3px 10px; font-size:11.5px; font-weight:600; color:#374151; cursor:pointer; }
        .rcb-chip-choice.rcb-active{ background:#2563eb; border-color:#2563eb; color:#fff; }
        .rcb-swatch{ width:22px; height:22px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1px #d1d5db; cursor:pointer; }
        .rcb-swatch.rcb-active{ box-shadow:0 0 0 2px #2563eb; }
        .rcb-rewrite-menu{ display:flex; flex-wrap:wrap; gap:6px; padding:10px; }
        .rcb-rewrite-menu button{ border:1px solid #d1d5db; background:#fff; border-radius:8px; padding:6px 10px; font-size:12px; font-weight:600; color:#374151; cursor:pointer; }
        .rcb-rewrite-menu button:hover{ border-color:#7c3aed; color:#7c3aed; }
        .rcb-toast{ position:fixed; bottom:22px; left:50%; transform:translateX(-50%); background:#111827; color:#fff; padding:9px 16px; border-radius:10px; font-size:13px; font-weight:600; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,.25); }
        .rcb-spin{ animation:rcb-spin 1s linear infinite; }
        @keyframes rcb-spin{ to{ transform:rotate(360deg);} }
        @media print {
          body *{ visibility:hidden !important; }
          .rcb-print-root, .rcb-print-root *{ visibility:visible !important; }
          .rcb-print-root{ display:block !important; position:absolute; left:0; top:0; }
          .rcb-print-page{ box-shadow:none !important; margin:0 !important; }
          @page{ size:A4; margin:0; }
          *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        }
      `}</style>

      <div className="rcb-toolbar">
        {onBack && (
          <button className="rcb-tbtn" onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <div className="rcb-brand">
          <span className="rcb-brand-badge"><FileUser size={16} /></span>
          AI Resume &amp; Cover Letter Builder
        </div>
        <div className="rcb-seg">
          <button className={mode === 'resume' ? 'rcb-active' : ''} onClick={() => setMode('resume')}>
            <FileText size={14} /> Resume
          </button>
          <button className={mode === 'cover' ? 'rcb-active' : ''} onClick={() => setMode('cover')}>
            <PenLine size={14} /> Cover Letter
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <button className="rcb-tbtn" onClick={loadSample}><Sparkles size={14} /> Load Sample</button>
        <button className="rcb-tbtn" onClick={resetAll}><RotateCcw size={14} /> Reset</button>
        <button className="rcb-tbtn" onClick={handleCopyDoc}>
          {copied ? <Check size={14} /> : <Copy size={14} />} Copy
        </button>
        <button className="rcb-tbtn rcb-primary" onClick={downloadPDF} disabled={pdfBusy}>
          {pdfBusy ? <Loader2 size={14} className="rcb-spin" /> : <Download size={14} />}
          Download PDF (A4)
        </button>
        <button className="rcb-tbtn" onClick={() => window.print()}><Printer size={14} /> Print</button>
      </div>

      <div className="rcb-toolsbar">
        <span className="rcb-tools-label"><LayoutGrid size={13} /> Template</span>
        {(Object.keys(TEMPLATES) as TemplateKey[]).map((t) => (
          <button
            key={t}
            className={`rcb-chip-choice ${settings.template === t ? 'rcb-active' : ''}`}
            onClick={() => setSettings((s) => ({ ...s, template: t }))}
          >
            {TEMPLATES[t].label}
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        <span className="rcb-tools-label"><Palette size={13} /> Color</span>
        {(Object.keys(THEME_COLORS) as ColorKey[]).map((c) => (
          <span
            key={c}
            title={COLOR_LABELS[c]}
            className={`rcb-swatch ${settings.color === c ? 'rcb-active' : ''}`}
            style={{ background: THEME_COLORS[c].primary }}
            onClick={() => setSettings((s) => ({ ...s, color: c }))}
          />
        ))}
        <span style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        <span className="rcb-tools-label"><Type size={13} /> Font</span>
        <select
          className="rcb-input"
          style={{ width: 150 }}
          value={settings.font}
          onChange={(e) => setSettings((s) => ({ ...s, font: e.target.value as FontKey }))}
        >
          {(Object.keys(FONTS) as FontKey[]).map((fk) => (
            <option key={fk} value={fk}>{FONTS[fk].label}</option>
          ))}
        </select>
      </div>

      <div className="rcb-main">
        <div className="rcb-form-panel">
          {mode === 'resume' ? (
            <>
              <FormSection id="personal" icon={<User size={15} />} title="Personal">
                <Row>
                  <Field label="Full Name">
                    <input className={inputCls} value={data.personal.name} onChange={(e) => patchPersonal('name', e.target.value)} placeholder="Sullab Sinhamahapatra" />
                  </Field>
                  <Field label="Target Job Title">
                    <input className={inputCls} value={data.personal.title} onChange={(e) => patchPersonal('title', e.target.value)} placeholder="Development Professional" />
                  </Field>
                </Row>
                <Field label="Photo & Shape">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {data.personal.photo ? (
                      <img src={data.personal.photo} alt="avatar" style={{ width: 48, height: 48, objectFit: 'cover', ...getPhotoStyle(data.personal.photoShape) }} />
                    ) : (
                      <span style={{ width: 48, height: 48, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <Upload size={18} />
                      </span>
                    )}
                    <label className="rcb-tbtn" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> Upload
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onPhotoUpload(e.target.files?.[0])} />
                    </label>
                    {data.personal.photo && (
                      <button className="rcb-tbtn" onClick={() => patchPersonal('photo', '')}><X size={14} /> Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {(['circle', 'rounded', 'square'] as PhotoShape[]).map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        className={`rcb-chip-choice ${data.personal.photoShape === shape ? 'rcb-active' : ''}`}
                        onClick={() => patchPersonal('photoShape', shape)}
                      >
                        {shape === 'circle' ? 'Gol (Circle)' : shape === 'rounded' ? 'Rounded' : 'Charkona (Square)'}
                      </button>
                    ))}
                  </div>
                </Field>
                <Row>
                  <Field label="Phone (+91)">
                    <input className={inputCls} value={data.personal.phone} onChange={(e) => patchPersonal('phone', e.target.value)} placeholder="+91 96413 46222" />
                  </Field>
                  <Field label="Email">
                    <input className={inputCls} value={data.personal.email} onChange={(e) => patchPersonal('email', e.target.value)} placeholder="sullabsinha@gmail.com" />
                  </Field>
                </Row>
                <Row>
                  <Field label="LinkedIn">
                    <input className={inputCls} value={data.personal.linkedin} onChange={(e) => patchPersonal('linkedin', e.target.value)} placeholder="linkedin.com/in/you" />
                  </Field>
                  <Field label="Portfolio">
                    <input className={inputCls} value={data.personal.portfolio} onChange={(e) => patchPersonal('portfolio', e.target.value)} placeholder="yoursite.dev" />
                  </Field>
                </Row>
                <Row>
                  <Field label="GitHub">
                    <input className={inputCls} value={data.personal.github} onChange={(e) => patchPersonal('github', e.target.value)} placeholder="github.com/you" />
                  </Field>
                  <Field label="Address / Location">
                    <input className={inputCls} value={data.personal.address} onChange={(e) => patchPersonal('address', e.target.value)} placeholder="New Delhi, India" />
                  </Field>
                </Row>
                <Field label="Professional Summary">
                  <textarea className="rcb-textarea" value={data.personal.summary} onChange={(e) => patchPersonal('summary', e.target.value)} placeholder="Experienced professional..." />
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="rcb-ai-btn rcb-ai-btn-small" onClick={genSummary} disabled={!!aiBusy}>
                      {aiBusy === 'summary' ? <Loader2 size={12} className="rcb-spin" /> : <Sparkles size={12} />}
                      Generate with AI
                    </button>
                    <button className="rcb-tbtn" onClick={() => setRewrite({ title: 'Summary', current: data.personal.summary, onApply: (t) => patchPersonal('summary', t) })}>
                      <Wand2 size={13} /> AI Rewrite
                    </button>
                  </div>
                </Field>
              </FormSection>

              <FormSection id="experience" icon={<Briefcase size={15} />} title="Experience">
                {data.experience.map((item, i) => (
                  <div key={i} className="rcb-list-card">
                    <div className="rcb-card-head">
                      <span>Experience #{i + 1}</span>
                      <button className="rcb-icon-btn" onClick={() => setData((d) => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))} disabled={data.experience.length === 1}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Field label="Company">
                      <input className={inputCls} value={item.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} placeholder="Company name" />
                    </Field>
                    <Field label="Designation">
                      <input className={inputCls} value={item.designation} onChange={(e) => updateExperience(i, 'designation', e.target.value)} placeholder="Job title" />
                    </Field>
                    <Row>
                      <Field label="Start">
                        <input className={inputCls} value={item.start} onChange={(e) => updateExperience(i, 'start', e.target.value)} placeholder="Jan 2021" />
                      </Field>
                      <Field label="End">
                        <input className={inputCls} value={item.end} onChange={(e) => updateExperience(i, 'end', e.target.value)} placeholder="Present" />
                      </Field>
                    </Row>
                    <Field label="Responsibilities (one per line)">
                      <textarea className="rcb-textarea" value={item.points.join('\n')} onChange={(e) => updateExperience(i, 'points', textToLines(e.target.value))} placeholder={'Led team of 5 developers\nImproved load time by 40%'} />
                    </Field>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <button className="rcb-ai-btn rcb-ai-btn-small" onClick={() => improveExperience(i)} disabled={!!aiBusy}>
                        {aiBusy === `exp-${i}` ? <Loader2 size={12} className="rcb-spin" /> : <Sparkles size={12} />}
                        Improve with AI
                      </button>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Action verbs · Quantified results · ATS friendly</span>
                    </div>
                  </div>
                ))}
                <button className="rcb-add-btn" onClick={() => setData((d) => ({ ...d, experience: [...d.experience, { company: '', designation: '', start: '', end: '', points: [] }] }))}>
                  <Plus size={14} /> Add Experience
                </button>
              </FormSection>

              <FormSection id="education" icon={<GraduationCap size={15} />} title="Education">
                {data.education.map((item, i) => (
                  <div key={i} className="rcb-list-card">
                    <div className="rcb-card-head">
                      <span>Education #{i + 1}</span>
                      <button className="rcb-icon-btn" onClick={() => setData((d) => ({ ...d, education: d.education.filter((_, j) => j !== i) }))} disabled={data.education.length === 1}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Field label="School / University">
                      <input className={inputCls} value={item.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} placeholder="University of Dhaka" />
                    </Field>
                    <Field label="Degree">
                      <input className={inputCls} value={item.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} placeholder="BSc in Computer Science" />
                    </Field>
                    <Row>
                      <Field label="Years">
                        <input className={inputCls} value={item.years} onChange={(e) => updateEducation(i, 'years', e.target.value)} placeholder="2018 – 2022" />
                      </Field>
                      <Field label="CGPA / Grade">
                        <input className={inputCls} value={item.cgpa} onChange={(e) => updateEducation(i, 'cgpa', e.target.value)} placeholder="CGPA 3.80" />
                      </Field>
                    </Row>
                  </div>
                ))}
                <button className="rcb-add-btn" onClick={() => setData((d) => ({ ...d, education: [...d.education, { school: '', degree: '', years: '', cgpa: '' }] }))}>
                  <Plus size={14} /> Add Education
                </button>
              </FormSection>

              <FormSection id="skills" icon={<Sparkles size={15} />} title="Skills">
                <ChipInput
                  tags={data.skills}
                  onChange={(v) => setTags('skills', v)}
                  placeholder="Type a skill and press Enter"
                  suggest={suggestSkills}
                  suggestBusy={aiBusy === 'skills'}
                />
                <span style={{ fontSize: 11, color: '#6b7280' }}>Press Enter or comma to add. AI can suggest skills for your role.</span>
              </FormSection>

              <FormSection id="languages" icon={<Languages size={15} />} title="Languages">
                <ChipInput tags={data.languages} onChange={(v) => setTags('languages', v)} placeholder="Bengali, English..." />
              </FormSection>

              <FormSection id="certifications" icon={<Award size={15} />} title="Certifications">
                <ChipInput
                  tags={data.certifications}
                  onChange={(v) => setTags('certifications', v)}
                  placeholder="Add a certification"
                  suggest={suggestCertifications}
                  suggestBusy={aiBusy === 'certs'}
                />
              </FormSection>

              <FormSection id="projects" icon={<FolderGit2 size={15} />} title="Projects">
                {data.projects.map((item, i) => (
                  <div key={i} className="rcb-list-card">
                    <div className="rcb-card-head">
                      <span>Project #{i + 1}</span>
                      <button className="rcb-icon-btn" onClick={() => setData((d) => ({ ...d, projects: d.projects.filter((_, j) => j !== i) }))} disabled={data.projects.length === 1}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Field label="Project Name">
                      <input className={inputCls} value={item.name} onChange={(e) => updateProject(i, 'name', e.target.value)} placeholder="E-commerce Platform" />
                    </Field>
                    <Field label="Description">
                      <textarea className="rcb-textarea" value={item.description} onChange={(e) => updateProject(i, 'description', e.target.value)} placeholder="Short description and outcome..." />
                    </Field>
                    <Row>
                      <Field label="Tech / Stack">
                        <input className={inputCls} value={item.tech} onChange={(e) => updateProject(i, 'tech', e.target.value)} placeholder="React, Node, PostgreSQL" />
                      </Field>
                      <Field label="Link">
                        <input className={inputCls} value={item.link} onChange={(e) => updateProject(i, 'link', e.target.value)} placeholder="github.com/you/project" />
                      </Field>
                    </Row>
                    <button className="rcb-ai-btn rcb-ai-btn-small" onClick={() => setRewrite({ title: `Project: ${item.name || 'Untitled'}`, current: item.description, onApply: (t) => updateProject(i, 'description', t) })} disabled={!!aiBusy}>
                      <Wand2 size={12} /> AI Improve
                    </button>
                  </div>
                ))}
                <button className="rcb-add-btn" onClick={() => setData((d) => ({ ...d, projects: [...d.projects, { name: '', description: '', tech: '', link: '' }] }))}>
                  <Plus size={14} /> Add Project
                </button>
              </FormSection>

              <FormSection id="achievements" icon={<Award size={15} />} title="Achievements">
                <ChipInput
                  tags={data.achievements}
                  onChange={(v) => setTags('achievements', v)}
                  placeholder="Add an achievement"
                  suggest={genAchievements}
                  suggestBusy={aiBusy === 'achieve'}
                />
              </FormSection>

              <FormSection id="hobbies" icon={<Heart size={15} />} title="Hobbies (Optional)">
                <ChipInput tags={data.hobbies} onChange={(v) => setTags('hobbies', v)} placeholder="Reading, Traveling..." />
              </FormSection>

              <FormSection id="custom-creator" icon={<Layers size={15} />} title="Add Custom Section">
                <div style={{ display: 'flex', gap: 6 }}>
                  <input id="new-sec-input" className={inputCls} placeholder="e.g. Volunteering, Publications" />
                  <button
                    className="rcb-tbtn rcb-primary"
                    onClick={() => {
                      const el = document.getElementById('new-sec-input') as HTMLInputElement;
                      if (el && el.value) {
                        addCustomSection(el.value);
                        el.value = '';
                      }
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </FormSection>

              {data.customSections.map((sec) => (
                <FormSection key={sec.id} id={sec.id} icon={<Sparkle size={15} />} title={sec.title}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                    <button className="rcb-icon-btn" onClick={() => removeCustomSection(sec.id)}><Trash2 size={14} /></button>
                  </div>
                  {sec.items.map((item, idx) => (
                    <div key={idx} className="rcb-list-card">
                      <Field label="Heading / Title">
                        <input
                          className={inputCls}
                          value={item.heading}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((d) => ({
                              ...d,
                              customSections: d.customSections.map((s) => (s.id === sec.id ? { ...s, items: s.items.map((it, j) => (j === idx ? { ...it, heading: val } : it)) } : s)),
                            }));
                          }}
                          placeholder="e.g. Community Leadership"
                        />
                      </Field>
                      <Field label="Description">
                        <textarea
                          className="rcb-textarea"
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((d) => ({
                              ...d,
                              customSections: d.customSections.map((s) => (s.id === sec.id ? { ...s, items: s.items.map((it, j) => (j === idx ? { ...it, description: val } : it)) } : s)),
                            }));
                          }}
                          placeholder="Details..."
                        />
                      </Field>
                    </div>
                  ))}
                </FormSection>
              ))}
            </>
          ) : (
            <>
              <FormSection id="cv-details" icon={<PenLine size={15} />} title="Cover Letter Details">
                <Row>
                  <Field label="Job Title">
                    <input className={inputCls} value={cover.jobTitle} onChange={(e) => setCover((c) => ({ ...c, jobTitle: e.target.value }))} placeholder="NGO Executive / Trainer" />
                  </Field>
                  <Field label="Company">
                    <input className={inputCls} value={cover.company} onChange={(e) => setCover((c) => ({ ...c, company: e.target.value }))} placeholder="Target company" />
                  </Field>
                </Row>
                <Field label="Tone">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                      <button
                        key={t}
                        className={`rcb-chip-choice ${cover.tone === t ? 'rcb-active' : ''}`}
                        onClick={() => setCover((c) => ({ ...c, tone: t }))}
                      >
                        {TONE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </Field>
                <button className="rcb-ai-btn" onClick={genCoverLetter} disabled={!!aiBusy || !cover.jobTitle.trim()}>
                  {aiBusy === 'cover' ? <Loader2 size={15} className="rcb-spin" /> : <Sparkles size={15} />}
                  Generate Cover Letter with AI
                </button>
                <Field label="Salutation">
                  <input className={inputCls} value={cover.salutation} onChange={(e) => setCover((c) => ({ ...c, salutation: e.target.value }))} />
                </Field>
                <Field label="Body Paragraphs (edit after AI)">
                  <textarea
                    className="rcb-textarea"
                    style={{ minHeight: 200 }}
                    value={cover.paragraphs.join('\n\n')}
                    onChange={(e) => setCover((c) => ({ ...c, paragraphs: e.target.value.split(/\n\s*\n/).filter(Boolean) }))}
                    placeholder="Paragraph 1...\n\nParagraph 2..."
                  />
                </Field>
                <Row>
                  <Field label="Sign-off">
                    <input className={inputCls} value={cover.signoff} onChange={(e) => setCover((c) => ({ ...c, signoff: e.target.value }))} />
                  </Field>
                </Row>
              </FormSection>
            </>
          )}
        </div>

        {PreviewPane}
      </div>

      {PrintDoc}

      <div style={{ display: 'none' }} ref={measureRef}>
        {docChildren}
      </div>

      {rewrite && (
        <div className="rcb-rewrite-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setRewrite(null)}>
          <div style={{ background: '#fff', borderRadius: 14, maxWidth: 460, width: '92%', boxShadow: '0 20px 60px rgba(0,0,0,.3)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #eef2f7' }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>AI Rewrite — {rewrite.title}</span>
              <button className="rcb-icon-btn" onClick={() => setRewrite(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: '0 16px 8px', fontSize: 12.5, color: '#6b7280', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', borderBottom: '1px solid #eef2f7' }}>
              {rewrite.current || 'No text yet — fill the field first.'}
            </div>
            <div className="rcb-rewrite-menu">
              {REWRITE_STYLES.map((r) => (
                <button key={r.key} onClick={() => applyRewrite(r.key, rewrite.current, rewrite.onApply)} disabled={!!aiBusy}>
                  {aiBusy === 'rewrite-' + r.key ? <Loader2 size={12} className="rcb-spin" style={{ verticalAlign: 'middle', marginRight: 4 }} /> : <Wand2 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="rcb-toast">{toast}</div>}
    </div>
  );
}