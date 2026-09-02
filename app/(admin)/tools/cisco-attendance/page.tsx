'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Printer, UploadCloud } from 'lucide-react';
import Link from 'next/link';

interface Student {
  sno: number;
  name: string;
  gender: string;
  age: string | number;
  guardian: string;
  mobile: string;
}

export default function CiscoAttendancePage() {
  const [headerData, setHeaderData] = useState({
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);

      const parsedStudents: Student[] = rawData.map((item, index) => ({
        sno: index + 1,
        name: item['Student Name'] || item['name'] || item['Name'] || '',
        gender: item['Gender'] || item['gender'] || '',
        age: item['Age'] || item['age'] || '',
        guardian: item['Guardians Name'] || item['Guardian Name'] || item['guardian'] || '',
        mobile: item['Mobile Number'] || item['Mobile'] || item['Phone'] || '',
      }));

      setStudents(parsedStudents);
    };
    reader.readAsBinaryString(file);
  };

  const chunkStudents = (arr: Student[], size = 25) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
  };

  const studentPages = chunkStudents(students, 25);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* কন্ট্রোল প্যানেল (প্রিন্ট করার সময় লুকানো থাকবে) */}
      <div className="print:hidden max-w-6xl mx-auto mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/tools" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">Cisco Attendance Sheet Generator</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg shadow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        {/* হেডার ডেটা ইনপুট ফর্ম */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Institute Name</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.instituteName}
              onChange={(e) => setHeaderData({ ...headerData, instituteName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Course Name</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.courseName}
              onChange={(e) => setHeaderData({ ...headerData, courseName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Institute Address</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.instituteAddress}
              onChange={(e) => setHeaderData({ ...headerData, instituteAddress: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Workshop Date</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.workshopDate}
              onChange={(e) => setHeaderData({ ...headerData, workshopDate: e.target.value })}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Trainer Name</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.trainerName}
              onChange={(e) => setHeaderData({ ...headerData, trainerName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Scheduled Time</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.scheduledTime}
              onChange={(e) => setHeaderData({ ...headerData, scheduledTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Org SPOC Name & Mobile No.</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.spocNameMobile}
              onChange={(e) => setHeaderData({ ...headerData, spocNameMobile: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Org SPOC Email ID</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              value={headerData.spocEmail}
              onChange={(e) => setHeaderData({ ...headerData, spocEmail: e.target.value })}
            />
          </div>
        </div>

        {/* এক্সেল ফাইল আপলোড */}
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-emerald-500 transition cursor-pointer relative bg-slate-950/50">
          <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-300 font-medium">Click to upload or drag Excel (.xlsx, .xls) file</p>
          <p className="text-xs text-slate-500 mt-1">Columns: Student Name, Gender, Age, Guardians Name, Mobile Number</p>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        {students.length > 0 && (
          <p className="text-xs text-emerald-400 mt-2 font-semibold text-center">
            ✓ Successfully loaded {students.length} students ({studentPages.length} page(s))
          </p>
        )}
      </div>

      {/* প্রিন্ট ও প্রিভিউ শিট (অরিজিনাল পিডিএফ লেআউট অনুযায়ী নিখুঁত) */}
      <div className="flex flex-col items-center">
        {studentPages.map((pageStudents, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white text-black w-[1100px] p-4 mb-8 border border-gray-400 shadow-2xl print:shadow-none print:border-none print:m-0 print:p-2 print:w-full print:break-after-page"
            style={{ fontFamily: 'Cambria, Georgia, serif' }}
          >
            {/* টপ হেডার ও আসল লোগো */}
            <div className="border border-black border-b-0 px-3 py-1.5 flex justify-between items-center bg-white">
              <div className="w-1/4"></div>
              <h2 className="text-sm font-bold tracking-wide text-center w-2/4 uppercase">
                Attendance Sheet :: Non-LMS
              </h2>
              <div className="w-1/4 flex justify-end">
                <img src="/niit-logo.png" alt="NIIT Foundation Logo" className="h-8 object-contain" />
              </div>
            </div>

            {/* হেডার ইনফরমেশন টেবিল */}
            <table className="w-full border-collapse border border-black text-[10.5px] mb-1 font-medium">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-0.5 font-bold w-[18%] bg-gray-50">Institute Name</td>
                  <td className="border border-black px-2 py-0.5 w-[32%]">{headerData.instituteName}</td>
                  <td className="border border-black px-2 py-0.5 font-bold w-[18%] bg-gray-50">Course Name</td>
                  <td className="border border-black px-2 py-0.5 w-[32%]" suppressHydrationWarning>{headerData.courseName}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 font-bold bg-gray-50">Institute Address</td>
                  <td className="border border-black px-2 py-0.5">{headerData.instituteAddress}</td>
                  <td className="border border-black px-2 py-0.5 font-bold bg-gray-50">Workshop Date</td>
                  <td className="border border-black px-2 py-0.5" suppressHydrationWarning>{headerData.workshopDate}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 font-bold bg-gray-50">Trainer Name</td>
                  <td className="border border-black px-2 py-0.5">{headerData.trainerName}</td>
                  <td className="border border-black px-2 py-0.5 font-bold bg-gray-50">Scheduled Time</td>
                  <td className="border border-black px-2 py-0.5" suppressHydrationWarning>{headerData.scheduledTime}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 font-bold bg-gray-50">Org SPOC Name & Mobile No.</td>
                  <td className="border border-black px-2 py-0.5">{headerData.spocNameMobile}</td>
                  <td className="border border-black px-2 py-0.5 font-bold bg-gray-50">Org SPOC Email ID</td>
                  <td className="border border-black px-2 py-0.5">{headerData.spocEmail}</td>
                </tr>
              </tbody>
            </table>

            {/* স্টুডেন্ট টেবিল (২৫টি সারি) */}
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-100 text-center font-bold">
                  <th className="border border-black py-0.5 px-1 w-[4%]">Sno.</th>
                  <th className="border border-black py-0.5 px-2 w-[26%] text-center">Student Name</th>
                  <th className="border border-black py-0.5 px-1 w-[8%]">Gender</th>
                  <th className="border border-black py-0.5 px-1 w-[6%]">Age</th>
                  <th className="border border-black py-0.5 px-2 w-[24%]">Guardians Name</th>
                  <th className="border border-black py-0.5 px-2 w-[16%]" suppressHydrationWarning>Mobile Number</th>
                  <th className="border border-black py-0.5 px-2 w-[16%]">Signatures</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 25 }).map((_, i) => {
                  const student = pageStudents[i];
                  const currentSno = pageIndex * 25 + (i + 1);
                  return (
                    <tr key={i} className="h-[17px] text-center">
                      <td className="border border-black px-1 font-semibold">{currentSno}</td>
                      <td className="border border-black px-2 text-left">{student?.name || ''}</td>
                      <td className="border border-black px-1">{student?.gender || ''}</td>
                      <td className="border border-black px-1">{student?.age || ''}</td>
                      <td className="border border-black px-2 text-left">{student?.guardian || ''}</td>
                      <td className="border border-black px-2" suppressHydrationWarning>{student?.mobile || ''}</td>
                      <td className="border border-black px-2"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* সিগনেচার সেকশন */}
            <div className="mt-2 flex justify-between items-end px-2 text-xs font-bold">
              <div className="w-56 text-center">
                <div className="border-t border-black mb-1"></div>
                <p>Trainer&apos;s Signature</p>
              </div>

              <div className="w-72 text-left">
                <div className="border-t border-black mb-1"></div>
                <p className="text-center">Institute/Organization Coordinator&apos;s Signature</p>
                <p className="mt-1 text-[10px] text-gray-800">Name:</p>
              </div>
            </div>

            {/* একদম নিচে ডিক্লারেশন এবং ইন্সট্রাকশন অংশ */}
            <div className="mt-2 pt-1 border-t border-gray-300 flex justify-between items-start px-1 text-[7.5px] leading-tight text-gray-900">
              <div className="w-[49%]">
                <p className="font-bold uppercase text-[8px] mb-0.5">STUDENT DECLARATION</p>
                <p className="italic text-[7px] text-gray-700">
                  &quot;By signing in the attendance sheet, I confirm that I have attended the above training session and the information provided by me is true and correct. I also give my consent to the organisation to use my personal data for training. assessment, certification.&quot;
                </p>
              </div>
              <div className="w-[49%]">
                <p className="font-bold uppercase text-[8px] mb-0.5">IMPORTANT INSTRUCTIONS</p>
                <ul className="list-disc list-inside text-[7px] text-gray-700 space-y-0.2">
                  <li>Only students physically present must sign</li>
                  <li>No proxy attendance allowed</li>
                  <li>No overwriting permitted</li>
                  <li>In case of correction, strike once and countersign by trainer</li>
                  <li>Signature is mandatory</li>
                  <li>This document is an official record and will be used for audit & reporting</li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* প্রিন্ট সিএসএস স্টাইল */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4 landscape;
            margin: 2mm;
          }
        }
      `}</style>
    </div>
  );
}