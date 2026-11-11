'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileArchive,
  FileSpreadsheet,
  Layers,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  UploadCloud,
  UserCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface Student {
  sno: number;
  name: string;
  gender: string;
  age: string;
  guardian: string;
  mobile: string;
}

interface BatchMetadata {
  instituteName: string;
  instituteAddress: string;
  trainerName: string;
  courseName: string;
  workshopDate: string;
  scheduledTime: string;
  spocNameMobile: string;
  spocEmail: string;
}

interface Batch {
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  students: Student[];
  meta: BatchMetadata;
}

interface Group {
  id: string;
  name: string;
  address: string;
  rawStudents: Student[];
  batches: Batch[];
}

const ROWS_PER_PAGE = 25;
const DEFAULT_PER_PDF = 300;
const MAX_PER_PDF_ALLOWED = 300;
const FIXED_COURSE = 'CYBER AWARENESS AI BASIC';
const TRAINERS = ['SULLAB SINHAMAHAPATRA', 'CHIRANJIT MUKHERJEE', 'MINAKSHI ABHYANKAR'];
const ADDRESS_MAX_WIDTH_PX = 700;

const COL = {
  firstName: 1,
  lastName: 2,
  gender: 3,
  age: 6,
  mobile: 7,
  guardian: 12,
  institute: 32,
  state: 16,
  district: 17,
  city: 18,
  pin: 19,
};

const DEFAULT_META: BatchMetadata = {
  instituteName: '',
  instituteAddress: '',
  trainerName: '',
  courseName: FIXED_COURSE,
  workshopDate: '',
  scheduledTime: '',
  spocNameMobile: '',
  spocEmail: '',
};

function textWidthPx(text: string): number {
  if (typeof document === 'undefined') return text.length * 6;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * 6;
  ctx.font = "400 9.77px Cambria, Georgia, 'Times New Roman', serif";
  return ctx.measureText(text).width;
}

function buildAddress(city: string, dist: string, state: string, pin: string): string {
  const join = (arr: string[]) => arr.filter(Boolean).join(', ').toUpperCase();
  const candidates = [
    join([city, dist, state, pin]),
    join([city, dist, pin]),
    join([city, dist]),
  ];
  for (const c of candidates) {
    if (textWidthPx(c) <= ADDRESS_MAX_WIDTH_PX) return c;
  }
  return candidates[candidates.length - 1];
}

const up = (v: unknown): string => String(v ?? '').trim().toUpperCase();

function cell(row: unknown[], idx: number): string {
  const v = row[idx];
  if (v === undefined || v === null) return '';
  return String(v).trim().replace(/\s+/g, ' ');
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function makeSafeName(v: string): string {
  return v
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-{2,}/g, '-')
    .trim()
    .toUpperCase();
}

function uniqueFileName(base: string, used: Map<string, number>): string {
  const n = used.get(base) ?? 0;
  used.set(base, n + 1);
  return n === 0 ? base : `${base} (${n + 1})`;
}

function formatPdfFilename(meta: BatchMetadata, batchNo: number, totalBatches: number): string {
  const pieces = [
    makeSafeName(meta.workshopDate),
    makeSafeName(meta.instituteName),
    makeSafeName(meta.scheduledTime),
  ].filter(Boolean);
  let name = pieces.length > 0 ? pieces.join('_') : 'PULSE_ATTENDANCE';
  if (totalBatches > 1) name += `_BATCH_${batchNo}`;
  return `${name}.pdf`;
}

function buildSheetHtml(h: BatchMetadata, pageStudents: Student[], pageIndex: number, logoSrc: string): string {
  const rows = Array.from({ length: ROWS_PER_PAGE }, (_, i) => {
    const student = pageStudents[i];
    const sno = pageIndex * ROWS_PER_PAGE + i + 1;
    return `<tr class="cisco-row">
      <td class="cisco-c">${sno}</td>
      <td class="cisco-l">${esc(student?.name || '')}</td>
      <td class="cisco-c">${esc(student?.gender || '')}</td>
      <td class="cisco-c">${esc(student?.age || '')}</td>
      <td class="cisco-l">${esc(student?.guardian || '')}</td>
      <td class="cisco-c">${esc(student?.mobile || '')}</td>
      <td></td>
    </tr>`;
  }).join('');

  return `<div class="cisco-sheet" style="margin:0;box-shadow:none;">
    <table>
      <colgroup>
        <col style="width:3.38%" />
        <col style="width:25.17%" />
        <col style="width:7.86%" />
        <col style="width:7.35%" />
        <col style="width:23.99%" />
        <col style="width:19.14%" />
        <col style="width:13.10%" />
      </colgroup>
      <tbody>
        <tr>
          <td class="cisco-title" colspan="7">
            Attendance Sheet :: Non-LMS
            <img class="cisco-logo" src="${esc(logoSrc)}" alt="NIIT Foundation" />
          </td>
        </tr>
        <tr>
          <td class="cisco-label" colspan="2">&nbsp;Institute Name:</td>
          <td class="cisco-value" colspan="3">${esc(h.instituteName)}</td>
          <td class="cisco-label">&nbsp;Course Name:</td>
          <td class="cisco-value">${esc(h.courseName)}</td>
        </tr>
        <tr>
          <td class="cisco-label" colspan="2">&nbsp;Institute&nbsp;&nbsp;Address:</td>
          <td class="cisco-value" colspan="3">${esc(h.instituteAddress)}</td>
          <td class="cisco-label">&nbsp;Workshop Date</td>
          <td class="cisco-value">${esc(h.workshopDate)}</td>
        </tr>
        <tr>
          <td class="cisco-label" colspan="2">&nbsp;Trainer Name:</td>
          <td class="cisco-value" colspan="3">${esc(h.trainerName)}</td>
          <td class="cisco-label">&nbsp;Scheduled Time:</td>
          <td class="cisco-value">${esc(h.scheduledTime)}</td>
        </tr>
        <tr>
          <td class="cisco-label" colspan="2">&nbsp;Org SPOC Name &amp; Mobile No.</td>
          <td class="cisco-value" colspan="3">${esc(h.spocNameMobile)}</td>
          <td class="cisco-label">&nbsp;Org SPOC Email ID</td>
          <td class="cisco-value">${esc(h.spocEmail)}</td>
        </tr>
        <tr class="cisco-head">
          <th>Sno.</th>
          <th>Student Name</th>
          <th>Gender</th>
          <th>Age</th>
          <th>Guardians Name</th>
          <th>Mobile Number</th>
          <th>Signatures</th>
        </tr>
        ${rows}
      </tbody>
    </table>
    <div class="cisco-below">
      <div class="cisco-sig-trainer">
        <div class="cisco-sig-line cisco-sig-line-t"></div>
        <div>Trainer&apos;s Signature</div>
      </div>
      <div class="cisco-sig-coord">
        <div class="cisco-sig-line cisco-sig-line-c"></div>
        <div>Institute/Organization Coordinator&apos;s Signature</div>
        <div class="cisco-sig-name">Name:</div>
      </div>
      <div class="cisco-notes-left">
        <div class="cisco-notes-title">STUDENT DECLARATION</div>
        <p class="cisco-decl">
          * By signing in the attendance sheet, I confirm that I have attended the above training session and the information
          provided by me is true and correct. I also give my consent to the organisation to use my personal data for training,
          assessment, certification.
        </p>
      </div>
      <div class="cisco-notes-right">
        <div class="cisco-notes-title">IMPORTANT INSTRUCTIONS</div>
        <div class="cisco-inst">
          # Only students physically present must sign<br />
          # No proxy attendance allowed<br />
          # No overwriting permitted<br />
          # In case of correction, strike once and countersign by trainer<br />
          # Signature is mandatory<br />
          # This document is an official record and will be used for audit &amp; reporting
        </div>
      </div>
    </div>
  </div>`;
}

async function loadLogoSrc(): Promise<string> {
  try {
    const res = await fetch('/niit-logo.png');
    if (!res.ok) return '/niit-logo.png';
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '/niit-logo.png'));
      reader.onerror = () => reject(new Error('logo'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return '/niit-logo.png';
  }
}

const SHEET_CAPTURE_CSS = `
  .cisco-sheet {
    width: 297mm;
    height: 209mm;
    min-height: 0;
    background: #fff;
    color: #000;
    padding: 3mm 8mm;
    margin: 0;
    box-sizing: border-box;
    box-shadow: none;
    font-family: Cambria, Georgia, 'Times New Roman', serif;
    font-synthesis: none;
    overflow: hidden;
  }
  .cisco-sheet table, .cisco-sheet td, .cisco-sheet th, .cisco-sheet div, .cisco-sheet p {
    font-family: Cambria, Georgia, 'Times New Roman', serif !important;
  }
  .cisco-sheet table {
    width: 100%;
    border-collapse: collapse;
    border: 1.2px solid #000 !important;
    table-layout: fixed;
  }
  .cisco-sheet td, .cisco-sheet th {
    border: 0.6px solid #000 !important;
    vertical-align: middle;
    overflow: hidden;
    color: #000;
  }
  .cisco-title {
    position: relative;
    height: 32.5pt;
    text-align: center;
    font-size: 11.06pt;
    font-weight: 700;
    padding: 0 90px 0 8px;
  }
  .cisco-logo {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    height: 29pt !important;
    width: auto !important;
    max-width: 90px;
    object-fit: contain;
  }
  .cisco-label, .cisco-value {
    font-size: 7.33pt;
    height: 17.4pt;
    text-align: left;
    padding: 0 3px;
  }
  .cisco-label { font-weight: 700; white-space: nowrap; }
  .cisco-value {
    font-weight: 400;
    white-space: normal;
    word-break: normal;
    overflow-wrap: anywhere;
    line-height: 8pt;
  }
  .cisco-head th {
    background: #d9d9d9 !important;
    font-size: 7.33pt;
    font-weight: 700;
    height: 14pt;
    text-align: center;
    padding: 0 2px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cisco-row td {
    height: 13.92pt;
    font-size: 7.33pt;
    font-weight: 400;
    padding: 0 4px;
    white-space: nowrap;
  }
  .cisco-c { text-align: center; }
  .cisco-l { text-align: left; }
  .cisco-below { position: relative; width: 100%; height: 102pt; }
  .cisco-sig-trainer, .cisco-sig-coord {
    position: absolute;
    top: 8pt;
    font-size: 7.33pt;
    font-weight: 700;
    color: #000;
  }
  .cisco-sig-trainer { left: 26.4pt; }
  .cisco-sig-coord { left: 67.75%; }
  .cisco-sig-line { border-top: 1.2px solid #000; margin-bottom: 3.3pt; }
  .cisco-sig-line-t { width: 74.6pt; }
  .cisco-sig-line-c { width: 160.8pt; }
  .cisco-sig-name { margin-top: 9pt; font-size: 7.33pt; font-weight: 700; }
  .cisco-notes-left { position: absolute; left: 1.5pt; top: 42pt; width: 41.4%; }
  .cisco-notes-right { position: absolute; left: 67.75%; top: 42pt; width: 32%; }
  .cisco-notes-title {
    font-size: 6.73pt;
    font-weight: 700;
    font-style: italic;
    text-transform: uppercase;
    margin-bottom: 2pt;
    color: #000;
  }
  .cisco-decl { font-size: 6.13pt; font-style: italic; line-height: 7.2pt; color: #000; }
  .cisco-inst { font-size: 6.13pt; font-style: italic; line-height: 8.2pt; color: #000; padding-left: 7.4pt; }
`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const found = document.querySelector(`script[data-pulse-lib="${src}"]`);
    if (found) {
      if (found.getAttribute('data-ready') === '1') {
        resolve();
        return;
      }
      found.addEventListener('load', () => resolve());
      found.addEventListener('error', () => reject(new Error(src)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.pulseLib = src;
    s.onload = () => {
      s.dataset.ready = '1';
      resolve();
    };
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

async function loadZipLibs(): Promise<{
  JSZip: new () => { file: (name: string, data: Blob) => void; generateAsync: (opts: { type: 'blob' }) => Promise<Blob> };
  html2canvas: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  JsPDF: new (opts: Record<string, unknown>) => {
    addImage: (img: string, format: string, x: number, y: number, w: number, h: number) => void;
    addPage: () => void;
    output: (type: 'blob') => Blob;
  };
}> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  const w = window as unknown as {
    JSZip?: new () => { file: (name: string, data: Blob) => void; generateAsync: (opts: { type: 'blob' }) => Promise<Blob> };
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    jspdf?: {
      jsPDF: new (opts: Record<string, unknown>) => {
        addImage: (img: string, format: string, x: number, y: number, w: number, h: number) => void;
        addPage: () => void;
        output: (type: 'blob') => Blob;
      };
    };
  };
  if (!w.JSZip || !w.html2canvas || !w.jspdf?.jsPDF) {
    throw new Error('Failed to load required PDF rendering engines.');
  }
  return { JSZip: w.JSZip, html2canvas: w.html2canvas, JsPDF: w.jspdf.jsPDF };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

async function makePdfBlob(
  h: BatchMetadata,
  partStudents: Student[],
  logoSrc: string,
  html2canvas: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>,
  JsPDF: new (opts: Record<string, unknown>) => {
    addImage: (img: string, format: string, x: number, y: number, w: number, h: number) => void;
    addPage: () => void;
    output: (type: 'blob') => Blob;
  }
): Promise<Blob> {
  const pages = chunk(partStudents, ROWS_PER_PAGE);
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-12000px;top:0;width:297mm;background:#fff;z-index:-1;pointer-events:none;';
  host.innerHTML = `<style>${SHEET_CAPTURE_CSS}</style>${pages
    .map((pageStudents, pageIndex) => buildSheetHtml(h, pageStudents, pageIndex, logoSrc))
    .join('')}`;
  document.body.appendChild(host);
  await waitForImages(host);

  const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const sheets = Array.from(host.querySelectorAll<HTMLElement>('.cisco-sheet'));
  for (let i = 0; i < sheets.length; i += 1) {
    const canvas = await html2canvas(sheets[i], {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: sheets[i].offsetWidth,
      height: sheets[i].offsetHeight,
    });
    const img = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, 0, 297, 210);
  }
  document.body.removeChild(host);
  return pdf.output('blob');
}

function partitionStudents(students: Student[], sizes: number[]): Student[][] {
  const result: Student[][] = [];
  let pos = 0;
  for (const size of sizes) {
    if (pos >= students.length) break;
    const end = Math.min(pos + size, students.length);
    const slice = students.slice(pos, end).map((s, idx) => ({ ...s, sno: idx + 1 }));
    result.push(slice);
    pos = end;
  }
  while (pos < students.length) {
    const end = Math.min(pos + DEFAULT_PER_PDF, students.length);
    const slice = students.slice(pos, end).map((s, idx) => ({ ...s, sno: idx + 1 }));
    result.push(slice);
    pos = end;
  }
  return result.length > 0 ? result : [[]];
}

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500';

const labelClass = 'mb-1 block text-xs font-medium text-slate-300';

export default function PulseAttendanceGenerator() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number>(0);
  const [selectedBatchIdx, setSelectedBatchIdx] = useState<number>(0);
  const [uploadedName, setUploadedName] = useState<string>('');
  const [batchSizeInputs, setBatchSizeInputs] = useState<string[]>(['300']);

  // Zoom State
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);

  const [zipBusy, setZipBusy] = useState<boolean>(false);
  const [singleBusyId, setSingleBusyId] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeGroup: Group | undefined = groups[selectedGroupIdx];
  const activeBatch: Batch | undefined = activeGroup?.batches[selectedBatchIdx] || activeGroup?.batches[0];
  const currentMeta: BatchMetadata = activeBatch?.meta || DEFAULT_META;

  const totalRecords = groups.reduce((acc, g) => acc + g.batches.reduce((n, b) => n + b.students.length, 0), 0);

  const rawTotal = activeGroup?.rawStudents.length || 0;
  const currentAssignedSum = batchSizeInputs
    .map((x) => parseInt(x, 10))
    .filter((x) => Number.isFinite(x) && x > 0)
    .reduce((sum, n) => sum + n, 0);
  const remainingCount = Math.max(0, rawTotal - currentAssignedSum);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
      const dataRows = rows.slice(1);
      const map = new Map<string, { name: string; address: string; students: Student[] }>();

      dataRows.forEach((row) => {
        const first = cell(row, COL.firstName);
        const last = cell(row, COL.lastName);
        const name = `${first} ${last}`.trim();
        if (!name) return;

        const instName = up(cell(row, COL.institute));
        let g = map.get(instName);
        if (!g) {
          g = { name: instName, address: '', students: [] };
          map.set(instName, g);
        }
        if (!g.address) {
          g.address = buildAddress(
            cell(row, COL.city),
            cell(row, COL.district),
            cell(row, COL.state),
            cell(row, COL.pin)
          );
        }

        g.students.push({
          sno: g.students.length + 1,
          name: up(name),
          gender: up(cell(row, COL.gender)),
          age: up(cell(row, COL.age)),
          guardian: up(cell(row, COL.guardian)),
          mobile: up(cell(row, COL.mobile)),
        });
      });

      const parsedGroups: Group[] = Array.from(map.values()).map((item, gIdx) => {
        const partitions = partitionStudents(item.students, [DEFAULT_PER_PDF]);
        const batches: Batch[] = partitions.map((studentList, bIdx) => ({
          batchId: `batch-${gIdx}-${bIdx + 1}`,
          batchNumber: bIdx + 1,
          totalBatches: partitions.length,
          students: studentList,
          meta: {
            ...DEFAULT_META,
            instituteName: item.name,
            instituteAddress: item.address,
          },
        }));

        return {
          id: `group-${gIdx}`,
          name: item.name,
          address: item.address,
          rawStudents: item.students,
          batches,
        };
      });

      setGroups(parsedGroups);
      setSelectedGroupIdx(0);
      setSelectedBatchIdx(0);
      if (parsedGroups.length > 0) {
        setBatchSizeInputs(parsedGroups[0].batches.map((b) => String(b.students.length)));
        setCurrentStep(2);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const syncBatchCounts = (newSizes: number[]) => {
    if (!activeGroup) return;
    const raw = activeGroup.rawStudents;
    const partitions = partitionStudents(raw, newSizes);
    const existingBatches = activeGroup.batches;

    const newBatches: Batch[] = partitions.map((studs, idx) => {
      const batchNumber = idx + 1;
      const prev = existingBatches[idx];
      return {
        batchId: prev ? prev.batchId : `batch-${selectedGroupIdx}-${batchNumber}`,
        batchNumber,
        totalBatches: partitions.length,
        students: studs,
        meta: prev
          ? { ...prev.meta }
          : {
              ...DEFAULT_META,
              instituteName: activeGroup.name,
              instituteAddress: activeGroup.address,
            },
      };
    });

    setGroups((prev) =>
      prev.map((g, idx) => (idx === selectedGroupIdx ? { ...g, batches: newBatches } : g))
    );
    setSelectedBatchIdx(0);
    setBatchSizeInputs(partitions.map((p) => String(p.length)));
  };

  const updateBatchMeta = (key: keyof BatchMetadata, value: string) => {
    if (!activeGroup || !activeBatch) return;
    setGroups((prev) =>
      prev.map((g, gIdx) => {
        if (gIdx !== selectedGroupIdx) return g;
        return {
          ...g,
          batches: g.batches.map((b, bIdx) =>
            bIdx === selectedBatchIdx ? { ...b, meta: { ...b.meta, [key]: value } } : b
          ),
        };
      })
    );
  };

  const applyMetaToAllBatchesInGroup = () => {
    if (!activeGroup || !activeBatch) return;
    const sourceMeta = { ...activeBatch.meta };
    setGroups((prev) =>
      prev.map((g, gIdx) => {
        if (gIdx !== selectedGroupIdx) return g;
        return {
          ...g,
          batches: g.batches.map((b) => ({ ...b, meta: { ...sourceMeta } })),
        };
      })
    );
  };

  const applyMetaToAllInstitutesAndBatches = () => {
    if (!activeBatch) return;
    const { workshopDate, scheduledTime, trainerName, courseName, spocNameMobile, spocEmail } = activeBatch.meta;
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        batches: g.batches.map((b) => ({
          ...b,
          meta: {
            ...b.meta,
            workshopDate,
            scheduledTime,
            trainerName,
            courseName,
            spocNameMobile,
            spocEmail,
          },
        })),
      }))
    );
  };

  const studentPages = chunk(activeBatch?.students || [], ROWS_PER_PAGE);

  const flatPdfList = useMemo(() => {
    const list: {
      key: string;
      filename: string;
      batch: Batch;
      groupName: string;
    }[] = [];

    const used = new Map<string, number>();

    groups.forEach((g, gIdx) => {
      g.batches.forEach((b, bIdx) => {
        const baseName = formatPdfFilename(b.meta, b.batchNumber, b.totalBatches).replace(/\.pdf$/i, '');
        const filename = `${uniqueFileName(baseName, used)}.pdf`;
        list.push({
          key: `${gIdx}-${bIdx}`,
          filename,
          batch: b,
          groupName: g.name,
        });
      });
    });

    return list;
  }, [groups]);

  const handlePrintCurrent = () => {
    if (!activeBatch) return;
    const oldTitle = document.title;
    document.title = formatPdfFilename(activeBatch.meta, activeBatch.batchNumber, activeBatch.totalBatches).replace(
      /\.pdf$/i,
      ''
    );
    window.print();
    setTimeout(() => {
      document.title = oldTitle;
    }, 1000);
  };

  const handleDownloadSinglePdf = async (item: (typeof flatPdfList)[number]) => {
    setSingleBusyId(item.key);
    setErrorMessage('');
    try {
      const { html2canvas, JsPDF } = await loadZipLibs();
      const logoSrc = await loadLogoSrc();
      const blob = await makePdfBlob(item.batch.meta, item.batch.students, logoSrc, html2canvas, JsPDF);
      downloadBlob(blob, item.filename);
    } catch {
      setErrorMessage('Could not generate PDF. Check network connectivity for rendering engines.');
    } finally {
      setSingleBusyId(null);
    }
  };

  const handleDownloadZip = async () => {
    if (flatPdfList.length === 0 || zipBusy) return;
    setZipBusy(true);
    setErrorMessage('');
    setProcessStatus('Loading PDF rendering engines...');
    try {
      const { JSZip, html2canvas, JsPDF } = await loadZipLibs();
      const logoSrc = await loadLogoSrc();
      const zip = new JSZip();

      for (let i = 0; i < flatPdfList.length; i += 1) {
        const item = flatPdfList[i];
        setProcessStatus(`Rendering PDF ${i + 1} of ${flatPdfList.length}...`);
        const blob = await makePdfBlob(item.batch.meta, item.batch.students, logoSrc, html2canvas, JsPDF);
        zip.file(item.filename, blob);
      }

      setProcessStatus('Archiving package into ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'NYX_CISCO_NON_LMS_ATTENDANCE_PACK.zip');
      setProcessStatus('');
    } catch {
      setErrorMessage('Failed to compile ZIP archive. Check network access and try again.');
      setProcessStatus('');
    } finally {
      setZipBusy(false);
    }
  };

  const handleReset = () => {
    setGroups([]);
    setSelectedGroupIdx(0);
    setSelectedBatchIdx(0);
    setCurrentStep(1);
    setBatchSizeInputs(['300']);
    setUploadedName('');
    setZipBusy(false);
    setSingleBusyId(null);
    setProcessStatus('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasData = groups.length > 0;

  const renderSheet = (h: BatchMetadata, pageStudents: Student[], pageIndex: number) => (
    <div className="cisco-sheet" key={`${pageIndex}-${h.instituteName}`}>
      <table>
        <colgroup>
          <col style={{ width: '3.38%' }} />
          <col style={{ width: '25.17%' }} />
          <col style={{ width: '7.86%' }} />
          <col style={{ width: '7.35%' }} />
          <col style={{ width: '23.99%' }} />
          <col style={{ width: '19.14%' }} />
          <col style={{ width: '13.10%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="cisco-title" colSpan={7}>
              Attendance Sheet :: Non-LMS
              <img className="cisco-logo" src="/niit-logo.png" alt="NIIT Foundation" />
            </td>
          </tr>
          <tr>
            <td className="cisco-label" colSpan={2}>&nbsp;Institute Name:</td>
            <td className="cisco-value" colSpan={3}>{h.instituteName}</td>
            <td className="cisco-label">&nbsp;Course Name:</td>
            <td className="cisco-value">{h.courseName}</td>
          </tr>
          <tr>
            <td className="cisco-label" colSpan={2}>&nbsp;Institute&nbsp;&nbsp;Address:</td>
            <td className="cisco-value" colSpan={3}>{h.instituteAddress}</td>
            <td className="cisco-label">&nbsp;Workshop Date</td>
            <td className="cisco-value">{h.workshopDate}</td>
          </tr>
          <tr>
            <td className="cisco-label" colSpan={2}>&nbsp;Trainer Name:</td>
            <td className="cisco-value" colSpan={3}>{h.trainerName}</td>
            <td className="cisco-label">&nbsp;Scheduled Time:</td>
            <td className="cisco-value">{h.scheduledTime}</td>
          </tr>
          <tr>
            <td className="cisco-label" colSpan={2}>&nbsp;Org SPOC Name &amp; Mobile No.</td>
            <td className="cisco-value" colSpan={3}>{h.spocNameMobile}</td>
            <td className="cisco-label">&nbsp;Org SPOC Email ID</td>
            <td className="cisco-value">{h.spocEmail}</td>
          </tr>
          <tr className="cisco-head">
            <th>Sno.</th>
            <th>Student Name</th>
            <th>Gender</th>
            <th>Age</th>
            <th>Guardians Name</th>
            <th>Mobile Number</th>
            <th>Signatures</th>
          </tr>
          {Array.from({ length: ROWS_PER_PAGE }).map((_, i) => {
            const student = pageStudents[i];
            const sno = pageIndex * ROWS_PER_PAGE + i + 1;
            return (
              <tr className="cisco-row" key={i}>
                <td className="cisco-c">{sno}</td>
                <td className="cisco-l">{student?.name || ''}</td>
                <td className="cisco-c">{student?.gender || ''}</td>
                <td className="cisco-c">{student?.age || ''}</td>
                <td className="cisco-l">{student?.guardian || ''}</td>
                <td className="cisco-c">{student?.mobile || ''}</td>
                <td></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="cisco-below">
        <div className="cisco-sig-trainer">
          <div className="cisco-sig-line cisco-sig-line-t"></div>
          <div>Trainer&apos;s Signature</div>
        </div>
        <div className="cisco-sig-coord">
          <div className="cisco-sig-line cisco-sig-line-c"></div>
          <div>Institute/Organization Coordinator&apos;s Signature</div>
          <div className="cisco-sig-name">Name:</div>
        </div>
        <div className="cisco-notes-left">
          <div className="cisco-notes-title">STUDENT DECLARATION</div>
          <p className="cisco-decl">
            * By signing in the attendance sheet, I confirm that I have attended the above training session and the information
            provided by me is true and correct. I also give my consent to the organisation to use my personal data for training,
            assessment, certification.
          </p>
        </div>
        <div className="cisco-notes-right">
          <div className="cisco-notes-title">IMPORTANT INSTRUCTIONS</div>
          <div className="cisco-inst">
            # Only students physically present must sign<br />
            # No proxy attendance allowed<br />
            # No overwriting permitted<br />
            # In case of correction, strike once and countersign by trainer<br />
            # Signature is mandatory<br />
            # This document is an official record and will be used for audit &amp; reporting
          </div>
        </div>
      </div>
    </div>
  );

  const stepsList = [
    { num: 1, label: 'Upload File', completed: hasData },
    { num: 2, label: 'Manage Batches', completed: hasData },
    { num: 3, label: 'Batch Info', completed: hasData },
    { num: 4, label: 'Review & Download', completed: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 print:min-h-0 print:bg-white">
      {/* Top Header */}
      <header className="print:hidden sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-2.5">
        <div className="mx-auto flex max-w-[2100px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div>
              <h1 className="text-sm font-bold text-white sm:text-base">CISCO NON LMS Attendance Operations</h1>
              <p className="text-[11px] text-slate-400">Independent batch timing &amp; bulk PDF export</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-900 hover:text-rose-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All
            </button>
            {hasData && (
              <button
                type="button"
                onClick={handlePrintCurrent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                <Printer className="h-4 w-4" />
                Print Selected Batch
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid: Wider Sidebar (620px) to maximize preview efficiency */}
      <div className="print:hidden mx-auto grid max-w-[2100px] grid-cols-1 xl:grid-cols-[620px_minmax(0,1fr)] 2xl:grid-cols-[660px_minmax(0,1fr)]">
        {/* Left Side: Wizard Stepper & Form */}
        <aside className="border-b border-slate-800 bg-slate-950/60 p-5 xl:h-[calc(100vh-57px)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
          {/* Stepper Navigation */}
          <nav className="mb-5 flex items-center justify-between gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5">
            {stepsList.map((s) => {
              const active = currentStep === s.num;
              const disabled = !hasData && s.num > 1;
              return (
                <button
                  key={s.num}
                  type="button"
                  disabled={disabled}
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 px-1 text-xs font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow'
                      : disabled
                      ? 'cursor-not-allowed opacity-40 text-slate-500'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      s.completed
                        ? 'bg-emerald-400 text-slate-950'
                        : active
                        ? 'bg-white text-emerald-900'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.completed ? '✓' : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* STEP 1: UPLOAD */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <UploadCloud className="h-5 w-5" />
                  <h2 className="font-semibold text-white text-sm">Step 1: Upload Pulse Format Excel File</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Upload your multi-institute attendance file-PULSE Format (.xlsx, .xls, .csv). Keep all student records under a single header row for automated batch partitioning.
                </p>

                {!hasData ? (
                  <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-600/40 bg-emerald-950/10 p-8 text-center transition hover:border-emerald-500 hover:bg-emerald-950/20">
                    <UploadCloud className="h-10 w-10 text-emerald-400 mb-2" />
                    <span className="text-sm font-semibold text-white">Click or drag file here</span>
                    <span className="text-xs text-slate-400 mt-1">Accepts Excel (.xlsx, .xls) and CSV</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{uploadedName}</p>
                        <p className="text-xs text-emerald-400">
                          {totalRecords} Students · {groups.length} Institutes Loaded
                        </p>
                      </div>
                    </div>
                    <div className="relative flex justify-center">
                      <button
                        type="button"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                      >
                        Replace File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {hasData && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  Configure Batches &amp; Allocations
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP 2: MANAGE BATCHES */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Layers className="h-5 w-5" />
                  <h2 className="font-semibold text-white text-sm">Step 2: Allocate Students Per Batch</h2>
                </div>

                {/* Institute Selection */}
                <div>
                  <label className={labelClass}>Active Institute</label>
                  <select
                    className={inputClass}
                    value={selectedGroupIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedGroupIdx(idx);
                      setSelectedBatchIdx(0);
                      if (groups[idx]) {
                        setBatchSizeInputs(groups[idx].batches.map((b) => String(b.students.length)));
                      }
                    }}
                  >
                    {groups.map((g, idx) => (
                      <option key={g.id} value={idx}>
                        {idx + 1}. {g.name} ({g.rawStudents.length} total students)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Sizes Definition */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-medium text-slate-300">Target Student Counts Per Batch</span>
                    <span className="text-xs font-semibold text-emerald-400">Total in file: {rawTotal}</span>
                  </div>

                  {/* Math Equation Formula */}
                  <div className="rounded-md bg-slate-900/90 border border-slate-800 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <span>Equation:</span>
                      <span className="text-emerald-400 font-semibold">
                        {batchSizeInputs.filter((x) => Number(x) > 0).join(' + ')}
                        {remainingCount > 0 ? ` + ${remainingCount} (auto)` : ''} = {rawTotal}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>Total Batches: {activeGroup?.batches.length || 0}</span>
                      <span className={remainingCount === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {remainingCount === 0 ? '✓ All students placed' : `${remainingCount} students in final batch`}
                      </span>
                    </div>
                  </div>

                  {/* Batch Inputs */}
                  <div className="space-y-2 pt-1">
                    {batchSizeInputs.map((val, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-24 text-xs font-medium text-slate-300">Batch {i + 1}:</span>
                        <input
                          type="number"
                          min={1}
                          max={MAX_PER_PDF_ALLOWED}
                          value={val}
                          onChange={(e) => {
                            const next = [...batchSizeInputs];
                            next[i] = e.target.value.replace(/[^\d]/g, '');
                            setBatchSizeInputs(next);
                          }}
                          className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-center text-xs font-semibold text-white focus:border-emerald-500"
                        />
                        <span className="text-xs text-slate-500">students</span>
                        {batchSizeInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = batchSizeInputs.filter((_, idx) => idx !== i);
                              setBatchSizeInputs(next.length > 0 ? next : ['300']);
                            }}
                            className="text-xs text-rose-400 hover:underline ml-auto"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    {remainingCount > 0 && (
                      <div className="flex items-center gap-2 opacity-60 text-xs text-slate-400 pl-1">
                        <span className="w-24">Batch {batchSizeInputs.length + 1}:</span>
                        <span className="w-28 py-1.5 text-center bg-slate-900/50 rounded border border-dashed border-slate-700">
                          {remainingCount}
                        </span>
                        <span className="text-[11px] text-slate-500">(auto remaining)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBatchSizeInputs([...batchSizeInputs, '100'])}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Batch Box
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = batchSizeInputs.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x) && x > 0);
                        syncBatchCounts(parsed);
                      }}
                      className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
                    >
                      Apply Partition
                    </button>
                  </div>
                </div>

                {/* Formed Batches */}
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5 font-medium">Formed Batches:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeGroup?.batches.map((b, bIdx) => (
                      <button
                        key={b.batchId}
                        type="button"
                        onClick={() => setSelectedBatchIdx(bIdx)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          bIdx === selectedBatchIdx
                            ? 'border-emerald-500 bg-emerald-600 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        Batch {b.batchNumber} ({b.students.length} students)
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  Configure Details &amp; Schedule
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BATCH METADATA ONLY */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <UserCheck className="h-5 w-5" />
                    <h2 className="font-semibold text-white text-sm">Step 3: Individual Batch Settings</h2>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                    Batch {activeBatch?.batchNumber || 1} of {activeGroup?.batches.length || 1}
                  </span>
                </div>

                {/* Institute & Batch Selector */}
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <label className={labelClass}>Institute</label>
                    <select
                      className={inputClass}
                      value={selectedGroupIdx}
                      onChange={(e) => {
                        setSelectedGroupIdx(Number(e.target.value));
                        setSelectedBatchIdx(0);
                      }}
                    >
                      {groups.map((g, idx) => (
                        <option key={g.id} value={idx}>
                          {idx + 1}. {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Active Batch</label>
                    <select
                      className={inputClass}
                      value={selectedBatchIdx}
                      onChange={(e) => setSelectedBatchIdx(Number(e.target.value))}
                    >
                      {activeGroup?.batches.map((b, idx) => (
                        <option key={b.batchId} value={idx}>
                          Batch {b.batchNumber} ({b.students.length} students)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Workshop Date (DD/MM/YYYY)</label>
                    <input
                      className={inputClass}
                      value={currentMeta.workshopDate}
                      onChange={(e) => updateBatchMeta('workshopDate', e.target.value)}
                      placeholder="e.g. 15/11/2026"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Scheduled Time</label>
                    <input
                      className={inputClass}
                      value={currentMeta.scheduledTime}
                      onChange={(e) => updateBatchMeta('scheduledTime', e.target.value)}
                      placeholder="e.g. 11:00 AM - 01:00 PM"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Trainer Name</label>
                  <select
                    className={inputClass}
                    value={currentMeta.trainerName}
                    onChange={(e) => updateBatchMeta('trainerName', e.target.value)}
                  >
                    <option value="">-- Select Trainer --</option>
                    {TRAINERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Institute Name (Display on Header)</label>
                  <input
                    className={inputClass}
                    value={currentMeta.instituteName}
                    onChange={(e) => updateBatchMeta('instituteName', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Institute Address</label>
                  <input
                    className={inputClass}
                    value={currentMeta.instituteAddress}
                    onChange={(e) => updateBatchMeta('instituteAddress', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>SPOC Name &amp; Mobile</label>
                    <input
                      className={inputClass}
                      value={currentMeta.spocNameMobile}
                      onChange={(e) => updateBatchMeta('spocNameMobile', e.target.value)}
                      placeholder="e.g. John Doe - 98765X0000"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>SPOC Email</label>
                    <input
                      className={inputClass}
                      value={currentMeta.spocEmail}
                      onChange={(e) => updateBatchMeta('spocEmail', e.target.value)}
                      placeholder="spoc@institute.edu"
                    />
                  </div>
                </div>

                {/* Mass Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={applyMetaToAllBatchesInGroup}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy this header to all batches in current institute
                  </button>
                  <button
                    type="button"
                    onClick={applyMetaToAllInstitutesAndBatches}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Date, Time &amp; Trainer across all institutes
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  Go to Download Center
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & DOWNLOAD */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <h2 className="font-semibold text-white text-sm">Step 4: Download Center</h2>
                  </div>
                  <span className="text-xs text-slate-400">{flatPdfList.length} Total PDFs</span>
                </div>

                {/* Bulk Archive Export */}
                <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Full ZIP Archive</h3>
                      <p className="text-xs text-slate-400">
                        Bundle all {flatPdfList.length} PDFs into one ZIP archive.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={zipBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {zipBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
                    {zipBusy ? processStatus || 'Packaging ZIP...' : `Download All (${flatPdfList.length} PDFs) as ZIP`}
                  </button>
                </div>

                {/* Individual PDF List */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-300 block">Individual PDF Files</span>
                  <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    {flatPdfList.map((item) => {
                      const isDownloading = singleBusyId === item.key;
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 hover:border-slate-700"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white" title={item.filename}>
                              {item.filename}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>Batch {item.batch.batchNumber}</span>
                              <span>·</span>
                              <span>{item.batch.students.length} students</span>
                              <span>·</span>
                              <span>{item.batch.meta.workshopDate || 'No Date'}</span>
                              <span>·</span>
                              <span>{item.batch.meta.scheduledTime || 'No Time'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf(item)}
                            disabled={isDownloading || zipBusy}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                          >
                            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            <span>Download</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {errorMessage && <p className="text-xs text-rose-400">{errorMessage}</p>}
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Back to Batch Settings
              </button>
            </div>
          )}
        </aside>

        {/* Right Side: Live Sheet Preview with Zoom Controls */}
        <section className="min-w-0 bg-slate-900/40 xl:h-[calc(100vh-57px)] xl:overflow-auto flex flex-col">
          {/* Preview Navigation & Zoom Toolbar */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-200">Live Preview</span>
              {activeBatch && (
                <span className="text-xs text-slate-400 truncate max-w-[260px] sm:max-w-md">
                  {currentMeta.instituteName || 'Institute'} · Batch {activeBatch.batchNumber}/{activeBatch.totalBatches} ({activeBatch.students.length} Students)
                </span>
              )}
            </div>

            {/* Interactive Zoom Controls */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 shadow-sm">
              <button
                type="button"
                onClick={() => setPreviewZoom((prev) => Math.max(0.5, prev - 0.1))}
                className="text-slate-400 hover:text-white p-0.5 rounded transition"
                title="Zoom Out (-10%)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={previewZoom}
                onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                className="w-16 sm:w-24 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <span className="text-[11px] font-mono text-slate-300 w-9 text-center">
                {Math.round(previewZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setPreviewZoom((prev) => Math.min(1.5, prev + 0.1))}
                className="text-slate-400 hover:text-white p-0.5 rounded transition"
                title="Zoom In (+10%)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              <div className="h-3 w-[1px] bg-slate-800 mx-0.5" />

              <button
                type="button"
                onClick={() => setPreviewZoom(0.85)}
                className="text-slate-400 hover:text-emerald-400 p-0.5 rounded transition text-[11px] font-medium"
                title="Reset Zoom to 85%"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Scaled Preview Canvas */}
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
            {hasData && activeBatch ? (
              <div
                className="cisco-sheets transition-transform duration-100 ease-out flex flex-col items-center"
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'top center',
                  marginBottom: `${(previewZoom - 1) * 350}px`,
                }}
              >
                {studentPages.map((pageStudents, pageIndex) => renderSheet(currentMeta, pageStudents, pageIndex))}
              </div>
            ) : (
              <div className="flex min-h-[460px] w-full max-w-[800px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center my-10">
                <FileSpreadsheet className="mb-3 h-12 w-12 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-300">No Excel Sheet Uploaded</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Upload your Excel file in Step 1 to generate and inspect live preview sheets.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Hidden container strictly for native system printing */}
      <div className="cisco-sheets cisco-print-only hidden">
        {activeBatch && studentPages.map((pageStudents, pageIndex) => renderSheet(currentMeta, pageStudents, pageIndex))}
      </div>

      {/* CSS */}
      <style>{`
        .cisco-sheet {
          width: 297mm;
          min-height: 210mm;
          background: #fff;
          color: #000;
          padding: 4mm 6mm 4mm 8mm;
          margin: 0 auto 24px;
          box-sizing: border-box;
          box-shadow: 0 12px 28px rgba(0,0,0,0.4);
          font-family: Cambria, Georgia, 'Times New Roman', serif;
          font-synthesis: none;
        }
        .cisco-sheet table,
        .cisco-sheet td,
        .cisco-sheet th,
        .cisco-sheet div,
        .cisco-sheet p {
          font-family: Cambria, Georgia, 'Times New Roman', serif !important;
        }
        .cisco-sheet table {
          width: 100%;
          border-collapse: collapse;
          border: 1.2px solid #000 !important;
          table-layout: fixed;
        }
        .cisco-sheet td,
        .cisco-sheet th {
          border: 0.6px solid #000 !important;
          vertical-align: middle;
          overflow: hidden;
          color: #000;
        }
        .cisco-title {
          position: relative;
          height: 32.5pt;
          text-align: center;
          font-size: 11.06pt;
          font-weight: 700;
          padding: 0 90px 0 8px;
        }
        .cisco-logo {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          height: 29pt !important;
          width: auto !important;
          max-width: 90px;
          object-fit: contain;
        }
        .cisco-label,
        .cisco-value {
          font-size: 7.33pt;
          height: 17.4pt;
          text-align: left;
          padding: 0 3px;
        }
        .cisco-label {
          font-weight: 700;
          white-space: nowrap;
        }
        .cisco-value {
          font-weight: 400;
          white-space: normal;
          word-break: normal;
          overflow-wrap: anywhere;
          line-height: 8pt;
        }
        .cisco-head th {
          background: #d9d9d9 !important;
          font-size: 7.33pt;
          font-weight: 700;
          height: 14pt;
          text-align: center;
          padding: 0 2px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cisco-row td {
          height: 13.92pt;
          font-size: 7.33pt;
          font-weight: 400;
          padding: 0 4px;
          white-space: nowrap;
        }
        .cisco-c { text-align: center; }
        .cisco-l { text-align: left; }
        .cisco-below {
          position: relative;
          width: 100%;
          height: 102pt;
        }
        .cisco-sig-trainer,
        .cisco-sig-coord {
          position: absolute;
          top: 8pt;
          font-size: 7.33pt;
          font-weight: 700;
          color: #000;
        }
        .cisco-sig-trainer { left: 26.4pt; }
        .cisco-sig-coord { left: 67.75%; }
        .cisco-sig-line {
          border-top: 1.2px solid #000;
          margin-bottom: 3.3pt;
        }
        .cisco-sig-line-t { width: 74.6pt; }
        .cisco-sig-line-c { width: 160.8pt; }
        .cisco-sig-name { margin-top: 9pt; font-size: 7.33pt; font-weight: 700; }
        .cisco-notes-left {
          position: absolute;
          left: 1.5pt;
          top: 42pt;
          width: 41.4%;
        }
        .cisco-notes-right {
          position: absolute;
          left: 67.75%;
          top: 42pt;
          width: 32%;
        }
        .cisco-notes-title {
          font-size: 6.73pt;
          font-weight: 700;
          font-style: italic;
          text-transform: uppercase;
          margin-bottom: 2pt;
          color: #000;
        }
        .cisco-decl {
          font-size: 6.13pt;
          font-style: italic;
          line-height: 7.2pt;
          color: #000;
        }
        .cisco-inst {
          font-size: 6.13pt;
          font-style: italic;
          line-height: 8.2pt;
          color: #000;
          padding-left: 7.4pt;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cisco-print-only {
            display: block !important;
          }
          .cisco-sheets {
            zoom: 1;
            transform: none !important;
            display: block !important;
            overflow: visible !important;
          }
          .cisco-sheet {
            box-shadow: none;
            margin: 0;
            padding: 3mm 8mm;
            width: 297mm;
            height: 209mm;
            min-height: 0;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            break-inside: avoid;
          }
          .cisco-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}