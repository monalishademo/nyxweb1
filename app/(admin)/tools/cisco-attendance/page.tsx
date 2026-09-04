'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Printer, UploadCloud } from 'lucide-react';

interface Student {
  sno: number;
  name: string;
  gender: string;
  age: string | number;
  guardian: string;
  mobile: string;
}

interface HeaderData {
  instituteName: string;
  instituteAddress: string;
  trainerName: string;
  courseName: string;
  workshopDate: string;
  scheduledTime: string;
  spocNameMobile: string;
  spocEmail: string;
}

type HeaderKey = keyof HeaderData;

const ROWS_PER_PAGE = 25;

const inputClass =
  'w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-emerald-500';

function pick(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function chunkStudents(arr: Student[], size = ROWS_PER_PAGE): Student[][] {
  const chunks: Student[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

export default function CiscoAttendancePage() {
  const [headerData, setHeaderData] = useState<HeaderData>({
    instituteName: '',
    instituteAddress: '',
    trainerName: '',
    courseName: '',
    workshopDate: '',
    scheduledTime: '',
    spocNameMobile: '',
    spocEmail: '',
  });
  const [students, setStudents] = useState<Student[]>([]);

  const updateHeader = (key: HeaderKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      const parsed: Student[] = rawData.map((item, index) => ({
        sno: index + 1,
        name: pick(item, ['Student Name', 'student name', 'Name', 'name']),
        gender: pick(item, ['Gender', 'gender']),
        age: pick(item, ['Age', 'age']),
        guardian: pick(item, [
          'Guardians Name',
          "Guardian's Name",
          'Guardian Name',
          'guardian',
          'Guardians name',
        ]),
        mobile: pick(item, ['Mobile Number', 'Mobile', 'Phone', 'mobile', 'phone']),
      }));

      setStudents(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const studentPages = chunkStudents(students, ROWS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-950 p-3 text-slate-100 print:bg-white print:p-0">
      <div className="print:hidden mx-auto mb-3 max-w-[1280px] rounded-lg border border-slate-800 bg-slate-900 p-3">
        <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
          <h1 className="text-sm font-bold text-white">Cisco Attendance Sheet Generator</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save as PDF
          </button>
        </div>

        <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Institute Name:</label>
            <input className={inputClass} value={headerData.instituteName} onChange={updateHeader('instituteName')} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Course Name:</label>
            <input className={inputClass} value={headerData.courseName} onChange={updateHeader('courseName')} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Institute Address:</label>
            <input className={inputClass} value={headerData.instituteAddress} onChange={updateHeader('instituteAddress')} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Workshop Date</label>
            <input
              className={inputClass}
              value={headerData.workshopDate}
              onChange={updateHeader('workshopDate')}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Trainer Name:</label>
            <input className={inputClass} value={headerData.trainerName} onChange={updateHeader('trainerName')} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Scheduled Time:</label>
            <input className={inputClass} value={headerData.scheduledTime} onChange={updateHeader('scheduledTime')} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Org SPOC Name & Mobile No.</label>
            <input className={inputClass} value={headerData.spocNameMobile} onChange={updateHeader('spocNameMobile')} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">Org SPOC Email ID</label>
            <input className={inputClass} value={headerData.spocEmail} onChange={updateHeader('spocEmail')} />
          </div>
        </div>

        <div className="relative flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-slate-700 bg-slate-950/50 px-2.5 py-2 hover:border-emerald-500">
          <UploadCloud className="h-5 w-5 shrink-0 text-slate-400" />
          <div>
            <p className="text-xs font-medium text-slate-300">Upload Excel (.xlsx, .xls)</p>
            <span className="text-[10px] text-slate-500">Student Name, Gender, Age, Guardians Name, Mobile Number</span>
          </div>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="absolute inset-0 cursor-pointer opacity-0" />
        </div>
        {students.length > 0 && (
          <p className="mt-1 text-[11px] font-semibold text-emerald-400">
            Successfully loaded {students.length} students ({studentPages.length} page(s))
          </p>
        )}
      </div>

      <div className="cisco-sheets flex flex-col items-center overflow-auto">
        {studentPages.map((pageStudents, pageIndex) => (
          <div className="cisco-sheet" key={pageIndex}>
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
                  <td className="cisco-value" colSpan={3}>{headerData.instituteName}</td>
                  <td className="cisco-label">&nbsp;Course Name:</td>
                  <td className="cisco-value">{headerData.courseName}</td>
                </tr>
                <tr>
                  <td className="cisco-label" colSpan={2}>&nbsp;Institute&nbsp;&nbsp;Address:</td>
                  <td className="cisco-value" colSpan={3}>{headerData.instituteAddress}</td>
                  <td className="cisco-label">&nbsp;Workshop Date</td>
                  <td className="cisco-value">{headerData.workshopDate}</td>
                </tr>
                <tr>
                  <td className="cisco-label" colSpan={2}>&nbsp;Trainer Name:</td>
                  <td className="cisco-value" colSpan={3}>{headerData.trainerName}</td>
                  <td className="cisco-label">&nbsp;Scheduled Time:</td>
                  <td className="cisco-value">{headerData.scheduledTime}</td>
                </tr>
                <tr>
                  <td className="cisco-label" colSpan={2}>&nbsp;Org SPOC Name &amp; Mobile No.</td>
                  <td className="cisco-value" colSpan={3}>{headerData.spocNameMobile}</td>
                  <td className="cisco-label">&nbsp;Org SPOC Email ID</td>
                  <td className="cisco-value">{headerData.spocEmail}</td>
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
        ))}
      </div>

      <style>{`
        .cisco-sheets { zoom: 1.18; }
        .cisco-sheet {
          width: 11in;
          min-height: 8.5in;
          background: #fff;
          color: #000;
          padding: 0.13in 0.3in 0.18in 0.43in;
          margin: 0 auto 24px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.4);
          font-family: Arial, Helvetica, sans-serif;
          font-synthesis: none;
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
          font-weight: 700;
          height: 17.4pt;
          text-align: left;
          white-space: nowrap;
          padding: 0 3px;
        }
        .cisco-head th {
          background: #d9d9d9 !important;
          font-family: Verdana, Arial, sans-serif;
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
          font-weight: 700;
          padding: 0 4px;
        }
        .cisco-c { text-align: center; }
        .cisco-l { text-align: left; }
        .cisco-below {
          position: relative;
          width: 100%;
          height: 128pt;
        }
        .cisco-sig-trainer,
        .cisco-sig-coord {
          position: absolute;
          top: 21.5pt;
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
        .cisco-sig-name { margin-top: 11.2pt; font-size: 7.33pt; font-weight: 700; }
        .cisco-notes-left {
          position: absolute;
          left: 1.5pt;
          top: 64.8pt;
          width: 41.4%;
        }
        .cisco-notes-right {
          position: absolute;
          left: 67.75%;
          top: 64.8pt;
          width: 32%;
        }
        .cisco-notes-title {
          font-size: 6.73pt;
          font-weight: 700;
          font-style: italic;
          text-transform: uppercase;
          margin-bottom: 3.2pt;
          color: #000;
        }
        .cisco-decl {
          font-size: 6.13pt;
          font-style: italic;
          line-height: 7.56pt;
          color: #000;
        }
        .cisco-inst {
          font-size: 6.13pt;
          font-style: italic;
          line-height: 8.88pt;
          color: #000;
          padding-left: 7.4pt;
        }
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cisco-sheets { zoom: 1; display: block; }
          .cisco-sheet {
            box-shadow: none;
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: auto;
            page-break-after: always;
            break-after: page;
          }
          .cisco-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          @page {
            size: letter landscape;
            margin: 0.12in 0.28in 0.18in 0.4in;
          }
        }
      `}</style>
    </div>
  );
}
