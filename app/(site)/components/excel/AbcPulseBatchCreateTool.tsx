'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  AlertTriangle, 
  ArrowLeft,
  Users,
  Clock,
  Archive,
  ArrowRight,
  XCircle,
  FileCheck2,
  Lock,
  Calendar,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface AbcPulseBatchCreateToolProps {
  onBack?: () => void;
}

interface BatchConfig {
  batchName: string;
  studentCount: number;
  batchDate: string;
  startTime: string;
  endTime: string;
}

interface ValidationError {
  rowIndex: number;
  excelRowNumber: number;
  field: string;
  currentValue: string;
  issue: string;
}

const ALLOWED_BENEFICIARY_TYPES = [
  'Farmers / Villagers', 'Daily Wagers', 'Entrepreneurs', 'Government Officials',
  'Salaried', 'Self Employed / Freelancers', 'Doctors', 'Healthcare personnel',
  'School Staff', 'Contract workers', 'Admin staff', 'Defence Personnel',
  'Faculty / Professors', 'Forest Officials', 'Home Makers', 'Nurses',
  'SHGs / JLG', 'Trainees', 'Others', 'School', 'Community', 'College',
  'ITI', 'Institution', 'NGO', 'Coaching', 'Anganwadi'
];

export default function AbcPulseBatchCreateTool({ onBack }: AbcPulseBatchCreateToolProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 States
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Step 2 States (Global Defaults if missing in Excel)
  const [centerCode, setCenterCode] = useState<string>('');
  const [isCenterCodeMissing, setIsCenterCodeMissing] = useState<boolean>(false);
  const [defaultCourse, setDefaultCourse] = useState<string>('Certificate Course in Cyber Awareness AI Basic');
  const [isCourseMissing, setIsCourseMissing] = useState<boolean>(false);
  const [globalSchoolName, setGlobalSchoolName] = useState<string>('');
  const [isSchoolMissing, setIsSchoolMissing] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Step 3 & 4 States
  const [defaultBatchDate, setDefaultBatchDate] = useState<string>('2026-08-03');
  const [batches, setBatches] = useState<BatchConfig[]>([]);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const totalStudentCount = rawRows.length;

  // Helper: Get Next Working Date (Skips Sunday)
  const getNextWorkingDate = (dateStr: string, addDaysCount: number = 1) => {
    let d = new Date(dateStr);
    let added = 0;
    while (added < addDaysCount) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) {
        added++;
      }
    }
    return d.toISOString().split('T')[0];
  };

  // Helper: 2-hour slots in 10:30 to 17:30
  const getSlotSchedule = (batchIndex: number, startDateStr: string) => {
    const daySlots = [
      { start: '10:30', end: '12:30' },
      { start: '12:30', end: '14:30' },
      { start: '15:30', end: '17:30' },
    ];

    const dayOffset = Math.floor(batchIndex / daySlots.length);
    const slotIdx = batchIndex % daySlots.length;

    let targetDate = startDateStr;
    if (dayOffset > 0) {
      targetDate = getNextWorkingDate(startDateStr, dayOffset);
    }

    return {
      batchDate: targetDate,
      startTime: daySlots[slotIdx].start,
      endTime: daySlots[slotIdx].end,
    };
  };

  // Dynamic Property Getter
  const getRowValue = (row: any, ...possibleKeys: string[]) => {
    if (!row) return '';
    const keys = Object.keys(row);
    for (const pKey of possibleKeys) {
      const targetNormalized = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedKey = keys.find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNormalized
      );
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
        return String(row[matchedKey]).trim();
      }
    }
    return '';
  };

  // Detect and Extract Pre-existing Batches directly from Excel File
  const extractBatchesFromExcel = (rows: any[]) => {
    const batchMap: { [key: string]: { count: number; date: string; start: string; end: string } } = {};

    rows.forEach((r) => {
      const bName = getRowValue(r, 'BatchName', 'Batch Name', 'Batch');
      const bDate = getRowValue(r, 'BatchStartDate', 'Batch Date', 'StartDate') || defaultBatchDate;
      let bStart = getRowValue(r, 'BatchStartTime', 'Start Time', 'StartTime') || '10:30';
      let bEnd = getRowValue(r, 'BatchEndTime', 'End Time', 'EndTime') || '12:30';

      if (bStart.length > 5) bStart = bStart.substring(0, 5);
      if (bEnd.length > 5) bEnd = bEnd.substring(0, 5);

      if (bName) {
        if (!batchMap[bName]) {
          batchMap[bName] = { count: 0, date: bDate, start: bStart, end: bEnd };
        }
        batchMap[bName].count += 1;
      }
    });

    const batchKeys = Object.keys(batchMap);
    if (batchKeys.length > 0) {
      const excelBatches: BatchConfig[] = batchKeys.map((k) => ({
        batchName: String(k),
        studentCount: batchMap[k].count,
        batchDate: batchMap[k].date,
        startTime: batchMap[k].start,
        endTime: batchMap[k].end,
      }));
      setBatches(excelBatches);
      validateBatchSchedule(excelBatches);
    } else {
      setupDefaultBatches(rows.length, defaultBatchDate);
    }
  };

  // STEP 1: Upload File & Process
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        setRawRows(rawJson);

        // Auto-detect Global Columns
        const extractedCenter = getRowValue(rawJson[0], 'Center', 'CenterCode', 'Center Code');
        if (extractedCenter) {
          setCenterCode(extractedCenter);
          setIsCenterCodeMissing(false);
        } else {
          setCenterCode('');
          setIsCenterCodeMissing(true);
        }

        const extractedCourse = getRowValue(rawJson[0], 'Course', 'CourseName');
        if (extractedCourse) {
          setDefaultCourse(extractedCourse);
          setIsCourseMissing(false);
        } else {
          setIsCourseMissing(true);
        }

        const extractedSchool = getRowValue(rawJson[0], 'EducationInstitute', 'SchoolName', 'School');
        if (extractedSchool) {
          setGlobalSchoolName(extractedSchool);
          setIsSchoolMissing(false);
        } else {
          setIsSchoolMissing(true);
        }

        validateRawRows(rawJson, extractedCenter, extractedCourse, extractedSchool);
        extractBatchesFromExcel(rawJson);

        setCurrentStep(2);
      } catch (err) {
        alert('Failed to process Excel file. Please upload a valid file.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // STEP 2: Error Check & Report Engine
  const validateRawRows = (rows: any[], activeCenter: string, activeCourse: string, activeSchool: string) => {
    let errList: ValidationError[] = [];

    if (isCenterCodeMissing && !activeCenter.trim()) {
      errList.push({
        rowIndex: -1,
        excelRowNumber: 1,
        field: 'Center Code',
        currentValue: 'Missing',
        issue: 'Global Center Code is missing. Please fill the Center Code field above.',
      });
    }

    if (isSchoolMissing && !activeSchool.trim()) {
      errList.push({
        rowIndex: -1,
        excelRowNumber: 1,
        field: 'School / Institute Name',
        currentValue: 'Missing',
        issue: 'School/Institute Name is compulsory. Please enter the School Name above.',
      });
    }

    rows.forEach((row, index) => {
      const excelRowNumber = index + 2;

      // Center
      const rowCenter = getRowValue(row, 'Center', 'CenterCode', 'Center Code') || activeCenter;
      if (!rowCenter.trim()) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Center Code',
          currentValue: 'Missing',
          issue: 'Center Code is required for this record.',
        });
      }

      // Name Rules
      let fullName = getRowValue(row, 'FullName', 'Name', 'StudentName');
      if (!fullName) {
        const fn = getRowValue(row, 'FirstName');
        const ln = getRowValue(row, 'LastName');
        fullName = `${fn} ${ln}`.trim();
      }

      let lastName = '';
      if (fullName) {
        let parts = fullName.split(/\s+/);
        lastName = parts.length === 1 ? parts[0] : parts.pop() || '';
      }

      if (!lastName) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'LastName',
          currentValue: fullName || 'Empty',
          issue: 'Last Name is required.',
        });
      }

      // Gender Strict
      let genderRaw = getRowValue(row, 'Gender').trim().toUpperCase();
      if (genderRaw !== 'MALE' && genderRaw !== 'FEMALE') {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Gender',
          currentValue: genderRaw || 'Missing',
          issue: 'Gender must be strictly "Male" or "Female".',
        });
      }

      // Mobile Strict (10 Digits starting with 6-9)
      let mobile = getRowValue(row, 'Mobile', 'Phone', 'Contact');
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Mobile',
          currentValue: mobile || 'Missing',
          issue: 'Mobile must be exactly 10 digits starting with 6, 7, 8, or 9.',
        });
      }

      // Age
      let age = getRowValue(row, 'Age');
      if (!age) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Age',
          currentValue: 'Missing',
          issue: 'Age is required.',
        });
      }

      // Guardian Name
      let guardian = getRowValue(
        row, 
        'PrimaryParentGuardianName',
        'PrimaryParentGuardian', 
        'ParentName', 
        'ParentsName',
        'FatherName', 
        'FathersName',
        'Guardian'
      );

      if (!guardian) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Guardian Name',
          currentValue: 'Missing',
          issue: 'Parent or Guardian Name (PrimaryParentGuardianName) is required.',
        });
      }

      // Education Institute
      let school = getRowValue(row, 'EducationInstitute', 'SchoolName', 'School') || activeSchool;
      if (!school) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'School Name',
          currentValue: 'Missing',
          issue: 'School/Institute Name is required.',
        });
      }

      // Beneficiary Type
      let benType = getRowValue(row, 'BeneficiaryType') || 'School';
      if (benType && !ALLOWED_BENEFICIARY_TYPES.includes(benType)) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Beneficiary Type',
          currentValue: benType,
          issue: `Invalid Beneficiary Type. Must match allowed master list.`,
        });
      }

      // State Check
      let state = getRowValue(row, 'State');
      if (state.toUpperCase() === 'UP' || state.toUpperCase() === 'J&K') {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'State',
          currentValue: state,
          issue: 'State abbreviations like "UP" or "J&K" not allowed. Use full State name.',
        });
      }
    });

    setValidationErrors(errList);
  };

  // STEP 3: Setup Default Batches
  const setupDefaultBatches = (totalStudents: number, startDateStr: string) => {
    const numBatches = Math.ceil(totalStudents / 300);
    const newBatches: BatchConfig[] = [];
    let remaining = totalStudents;

    for (let i = 0; i < numBatches; i++) {
      const count = Math.min(remaining, 300);
      remaining -= count;

      const schedule = getSlotSchedule(i, startDateStr);

      newBatches.push({
        batchName: String(i + 1),
        studentCount: count,
        batchDate: schedule.batchDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
    }

    setBatches(newBatches);
    validateBatchSchedule(newBatches);
  };

  // Step 3 Config Changes & Validation
  const handleBatchConfigChange = (index: number, field: keyof BatchConfig, value: any) => {
    const updated = [...batches];

    if (field === 'studentCount') {
      const valNum = value === '' ? 0 : Number(value);
      const newCapacity = Math.max(0, Math.min(valNum, 300));

      let allocatedBefore = 0;
      for (let i = 0; i < index; i++) {
        allocatedBefore += updated[i].studentCount;
      }

      let remaining = totalStudentCount - allocatedBefore - newCapacity;
      updated[index].studentCount = newCapacity;

      let currentIdx = index + 1;

      while (remaining > 0) {
        const capacity = Math.min(remaining, 300);
        remaining -= capacity;

        const schedule = getSlotSchedule(currentIdx, defaultBatchDate);

        if (currentIdx < updated.length) {
          updated[currentIdx].studentCount = capacity;
        } else {
          updated.push({
            batchName: String(updated.length + 1),
            studentCount: capacity,
            batchDate: schedule.batchDate,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          });
        }
        currentIdx++;
      }

      if (currentIdx < updated.length) {
        updated.splice(currentIdx);
      }
    } else if (field === 'startTime') {
      updated[index].startTime = value;
      const [h, m] = value.split(':').map(Number);
      const endDecimal = h + m / 60 + 2;
      const endH = Math.floor(endDecimal);
      const endM = Math.round((endDecimal % 1) * 60);
      updated[index].endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } else {
      (updated[index] as any)[field] = value;
    }

    setBatches(updated);
    validateBatchSchedule(updated);
  };

  // Re-calculate / Re-create Batches Schedule Automatically
  const handleRecreateSchedule = () => {
    setupDefaultBatches(totalStudentCount, defaultBatchDate);
  };

  // Strict Live Batch Schedule & Time Collision Validator
  const validateBatchSchedule = (currentBatches: BatchConfig[]) => {
    const bErrs: string[] = [];

    const totalAllocated = currentBatches.reduce((a, b) => a + b.studentCount, 0);
    if (totalAllocated !== totalStudentCount) {
      bErrs.push(`Total allocated students (${totalAllocated}) does not match Total Records (${totalStudentCount}).`);
    }

    currentBatches.forEach((b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const startDec = sh + sm / 60;
      const [eh, em] = b.endTime.split(':').map(Number);
      const endDec = eh + em / 60;

      if (startDec < 10.5 || endDec > 17.5) {
        bErrs.push(`Batch ${b.batchName}: Schedule (${b.startTime} - ${b.endTime}) exceeds school hours (10:30 AM - 05:30 PM).`);
      }
    });

    // Strict Check: Detect Time Overlaps on the Same Date
    for (let i = 0; i < currentBatches.length; i++) {
      for (let j = i + 1; j < currentBatches.length; j++) {
        const b1 = currentBatches[i];
        const b2 = currentBatches[j];

        if (b1.batchDate === b2.batchDate) {
          const [s1h, s1m] = b1.startTime.split(':').map(Number);
          const [s2h, s2m] = b2.startTime.split(':').map(Number);

          const start1 = s1h + s1m / 60;
          const end1 = start1 + 2;
          const start2 = s2h + s2m / 60;
          const end2 = start2 + 2;

          if (Math.max(start1, start2) < Math.min(end1, end2)) {
            bErrs.push(`Time Collision Error: Batch ${b1.batchName} and Batch ${b2.batchName} overlap on ${b1.batchDate}! (${b1.startTime}-${b1.endTime} vs ${b2.startTime}-${b2.endTime})`);
          }
        }
      }
    }

    setBatchErrors(bErrs);
    return bErrs.length === 0;
  };

  // STEP 3 -> STEP 4 Output Generation
  const handleProcessBatches = () => {
    const isValid = validateBatchSchedule(batches);
    if (!isValid) return;

    let currentIdx = 0;
    const finalData: any[] = [];

    batches.forEach((b) => {
      const slice = rawRows.slice(currentIdx, currentIdx + b.studentCount);
      currentIdx += b.studentCount;

      const dayOfWeek = new Date(b.batchDate).getDay();
      const batchDayVal = dayOfWeek >= 1 && dayOfWeek <= 5 ? String(dayOfWeek) : '1';

      slice.forEach((row) => {
        let fullName = getRowValue(row, 'FullName', 'Name', 'StudentName');
        if (!fullName) {
          const fn = getRowValue(row, 'FirstName');
          const ln = getRowValue(row, 'LastName');
          fullName = `${fn} ${ln}`.trim();
        }

        let firstName = '';
        let lastName = '';
        if (fullName) {
          let parts = fullName.split(/\s+/);
          if (parts.length === 1) {
            firstName = '';
            lastName = parts[0];
          } else {
            lastName = parts.pop() || '';
            firstName = parts.join(' ');
          }
        }

        let genderRaw = getRowValue(row, 'Gender').trim().toUpperCase();
        let gender = genderRaw === 'FEMALE' ? 'FEMALE' : 'MALE';

        let mobile = String(getRowValue(row, 'Mobile', 'Phone', 'Contact')).trim();
        let guardian = getRowValue(
          row, 
          'PrimaryParentGuardianName',
          'PrimaryParentGuardian', 
          'ParentName', 
          'ParentsName',
          'FatherName', 
          'FathersName',
          'Guardian'
        );
        let school = getRowValue(row, 'EducationInstitute', 'SchoolName', 'School') || globalSchoolName;
        let pincodeStr = String(getRowValue(row, 'PinCode', 'Pincode')).trim();

        finalData.push({
          Center: String(getRowValue(row, 'Center', 'CenterCode', 'Center Code') || centerCode),
          FirstName: firstName,
          LastName: lastName,
          Gender: gender,
          Category: getRowValue(row, 'Category') || 'NA',
          Birthdate: String(getRowValue(row, 'Birthdate')),
          Age: String(getRowValue(row, 'Age')),
          Mobile: mobile,
          Email: getRowValue(row, 'Email'),
          Course: getRowValue(row, 'Course', 'CourseName') || defaultCourse,
          Batch: getRowValue(row, 'Batch'),
          Project: getRowValue(row, 'Project'),
          PrimaryParentGuardianName: guardian,
          HouseholdIncome: getRowValue(row, 'HouseholdIncome'),
          SourceData: getRowValue(row, 'SourceData') || 'School',
          SubTopic: getRowValue(row, 'SubTopic'),
          State: getRowValue(row, 'State'),
          District: getRowValue(row, 'District'),
          City: getRowValue(row, 'City'),
          PinCode: pincodeStr,
          TypeofDisability: getRowValue(row, 'TypeofDisability') || 'NA',
          BeneficiaryType: getRowValue(row, 'BeneficiaryType') || 'School',
          BatchName: String(b.batchName),
          DeliveryMode: getRowValue(row, 'DeliveryMode') || 'Hybrid',
          RequestedLanguage: getRowValue(row, 'RequestedLanguage') || '300',
          IncludeHolidays: 'TRUE',
          BatchDay: `${batchDayVal};`,
          BatchType: 'Normal',
          BatchStartDate: String(b.batchDate),
          Faculty: getRowValue(row, 'Faculty') || '003C50000000000000',
          BatchStartTime: `${b.startTime}:00`,
          BatchEndTime: `${b.endTime}:00`,
          EducationInstitute: school,
          Country: 'India',
        });
      });
    });

    setProcessedData(finalData);
    setCurrentStep(4);
  };

  // STEP 4: ZIP Export Named by School / Institute Name
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const schoolCleanName = (globalSchoolName || processedData[0]?.EducationInstitute || 'School')
        .replace(/[^a-zA-Z0-9]/g, '_');

      batches.forEach((b) => {
        const batchRecords = processedData.filter((row) => String(row.BatchName) === String(b.batchName));
        const ws = XLSX.utils.json_to_sheet(batchRecords);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Batch_${b.batchName}`);

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const fileName = `${schoolCleanName}_Batch_${b.batchName}_${b.batchDate}.xlsx`;
        zip.file(fileName, excelBuffer);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pulse_Portal_Batches_${schoolCleanName}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">ABC Pulse Batch Create</h2>
            <p className="text-xs text-slate-400">Guided Batch Generator & School ZIP Exporter</p>
          </div>
        </div>

        {totalStudentCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-semibold">
            <Users className="w-4 h-4" />
            <span>Total Students:</span>
            <span className="text-white bg-blue-600 px-2 py-0.5 rounded-md font-mono text-sm">{totalStudentCount}</span>
          </div>
        )}
      </div>

      {/* 4-STEP STEPPER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          currentStep === 1 ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
          <div>
            <div className="text-xs font-bold">Step 1: Upload</div>
            <div className="text-[10px] text-slate-400">Excel / CSV Import</div>
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          currentStep === 2 ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">2</div>
          <div>
            <div className="text-xs font-bold">Step 2: Error Check</div>
            <div className="text-[10px] text-slate-400">Validate Data File</div>
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          currentStep === 3 ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">3</div>
          <div>
            <div className="text-xs font-bold">Step 3: Batch Create</div>
            <div className="text-[10px] text-slate-400">Time & Date Schedule</div>
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center gap-3 transition ${
          currentStep === 4 ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">4</div>
          <div>
            <div className="text-xs font-bold">Step 4: Zip Export</div>
            <div className="text-[10px] text-slate-400">Export School ZIP</div>
          </div>
        </div>
      </div>

      {/* STEP 1 SECTION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 transition-colors bg-slate-950/50 rounded-2xl p-12 text-center">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              id="pulse-excel-input"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="pulse-excel-input" className="cursor-pointer flex flex-col items-center gap-3">
              <Upload className="w-12 h-12 text-blue-400 mb-1" />
              <span className="text-base font-semibold text-slate-200">
                {file ? file.name : 'Upload Student Excel or CSV File'}
              </span>
              <span className="text-xs text-slate-500">Supports .xlsx, .xls, .csv formats</span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 2 SECTION */}
      {currentStep === 2 && (
        <div className="space-y-6">
          
          {(isCenterCodeMissing || isCourseMissing || isSchoolMissing) && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3">
              <div className="text-xs text-amber-300 font-bold">
                Global Header Inputs (These values are missing in your sheet and will apply to ALL records):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {isCenterCodeMissing && (
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Center Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. P192874"
                      value={centerCode}
                      onChange={(e) => {
                        setCenterCode(e.target.value);
                        validateRawRows(rawRows, e.target.value, defaultCourse, globalSchoolName);
                      }}
                      className="bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-white w-full font-mono font-bold"
                    />
                  </div>
                )}

                {isCourseMissing && (
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Course Name *</label>
                    <input
                      type="text"
                      value={defaultCourse}
                      onChange={(e) => {
                        setDefaultCourse(e.target.value);
                        validateRawRows(rawRows, centerCode, e.target.value, globalSchoolName);
                      }}
                      className="bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-white w-full"
                    />
                  </div>
                )}

                {isSchoolMissing && (
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">School / Institute Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Kantapahari High School"
                      value={globalSchoolName}
                      onChange={(e) => {
                        setGlobalSchoolName(e.target.value);
                        validateRawRows(rawRows, centerCode, defaultCourse, e.target.value);
                      }}
                      className="bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-white w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              {validationErrors.length === 0 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> All {totalStudentCount} records are valid and ready for Batch Creation!
                </span>
              ) : (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> Found {validationErrors.length} errors across {totalStudentCount} records.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800"
              >
                ← Re-upload File
              </button>

              <button
                disabled={validationErrors.length > 0}
                onClick={() => setCurrentStep(3)}
                className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition ${
                  validationErrors.length === 0
                    ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {validationErrors.length > 0 && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span>Proceed to Step 3 (Batch Create)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Error Log */}
          {validationErrors.length > 0 && (
            <div className="bg-slate-950 border border-red-500/30 rounded-xl overflow-hidden">
              <div className="p-3 bg-red-950/40 border-b border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Comprehensive Error Log Report ({validationErrors.length} issues found)
              </div>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-2.5">Row #</th>
                      <th className="p-2.5">Field</th>
                      <th className="p-2.5">Current Value</th>
                      <th className="p-2.5">Issue Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {validationErrors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-red-950/20">
                        <td className="p-2.5 font-mono text-red-400 font-bold">Row {err.excelRowNumber}</td>
                        <td className="p-2.5 text-white">{err.field}</td>
                        <td className="p-2.5 font-mono text-amber-300">{err.currentValue}</td>
                        <td className="p-2.5 text-red-300">{err.issue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clean Non-Editable Preview Table (Green/Red Marked) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold text-blue-400">
                Data Verification Sheet View (Green = Valid, Red = Error)
              </span>
              <span>Total Records: {totalStudentCount}</span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto whitespace-nowrap">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800 shadow-sm z-10">
                  <tr>
                    <th className="p-3 border-r border-slate-800">Status</th>
                    <th className="p-3 border-r border-slate-800">Row</th>
                    <th className="p-3 border-r border-slate-800">Center</th>
                    <th className="p-3 border-r border-slate-800">Student Name</th>
                    <th className="p-3 border-r border-slate-800">Gender</th>
                    <th className="p-3 border-r border-slate-800">Mobile</th>
                    <th className="p-3 border-r border-slate-800">Age</th>
                    <th className="p-3 border-r border-slate-800">Guardian Name</th>
                    <th className="p-3 border-r border-slate-800">Beneficiary Type</th>
                    <th className="p-3 border-r border-slate-800">Course</th>
                    <th className="p-3 border-r border-slate-800">School Name</th>
                    <th className="p-3 border-r border-slate-800">State</th>
                    <th className="p-3 border-r border-slate-800">District</th>
                    <th className="p-3">PinCode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rawRows.map((row, i) => {
                    const rowNum = i + 2;
                    const hasRowError = validationErrors.some((e) => e.excelRowNumber === rowNum);

                    const rowCenter = getRowValue(row, 'Center', 'CenterCode', 'Center Code') || centerCode;
                    const nameVal = getRowValue(row, 'FullName', 'Name', 'StudentName') || `${getRowValue(row, 'FirstName')} ${getRowValue(row, 'LastName')}`.trim();
                    const genderVal = getRowValue(row, 'Gender');
                    const mobileVal = getRowValue(row, 'Mobile', 'Phone', 'Contact');
                    const ageVal = getRowValue(row, 'Age');
                    const guardianVal = getRowValue(row, 'PrimaryParentGuardianName', 'PrimaryParentGuardian', 'ParentName', 'FatherName', 'Guardian');
                    const schoolVal = getRowValue(row, 'EducationInstitute', 'SchoolName', 'School') || globalSchoolName;

                    return (
                      <tr key={i} className={`transition ${hasRowError ? 'bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-slate-900/50'}`}>
                        <td className="p-3 border-r border-slate-800/50">
                          {hasRowError ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                              Error
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="p-3 border-r border-slate-800/50 text-slate-500 font-mono">Row {rowNum}</td>
                        <td className="p-3 border-r border-slate-800/50 font-mono">{rowCenter || <span className="text-red-400 font-bold">Missing</span>}</td>
                        <td className="p-3 border-r border-slate-800/50 font-medium text-white">{nameVal || <span className="text-red-400 font-bold">Missing</span>}</td>
                        <td className="p-3 border-r border-slate-800/50">{genderVal || <span className="text-red-400 font-bold">Missing</span>}</td>
                        <td className="p-3 border-r border-slate-800/50 font-mono">{mobileVal || <span className="text-red-400 font-bold">Missing</span>}</td>
                        <td className="p-3 border-r border-slate-800/50">{ageVal || <span className="text-red-400 font-bold">Missing</span>}</td>
                        <td className="p-3 border-r border-slate-800/50">{guardianVal || <span className="text-red-400 font-bold">Missing</span>}</td>
                        <td className="p-3 border-r border-slate-800/50">{getRowValue(row, 'BeneficiaryType') || 'School'}</td>
                        <td className="p-3 border-r border-slate-800/50 text-slate-400">{getRowValue(row, 'Course') || defaultCourse}</td>
                        <td className="p-3 border-r border-slate-800/50 text-slate-300">{schoolVal || <span className="text-red-400 font-bold">Missing</span>}</td>
                        <td className="p-3 border-r border-slate-800/50">{getRowValue(row, 'State') || '-'}</td>
                        <td className="p-3 border-r border-slate-800/50">{getRowValue(row, 'District') || '-'}</td>
                        <td className="p-3 font-mono">{getRowValue(row, 'PinCode', 'Pincode') || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 SECTION */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-amber-400 block">
                Batch Setup (School Hours: 10:30 AM - 05:30 PM | Max 3 Batches/Day)
              </span>
              <span className="text-[11px] text-slate-400">
                Total Allocated: <b>{batches.reduce((a, b) => a + b.studentCount, 0)}</b> / {totalStudentCount} Students
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRecreateSchedule}
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg transition cursor-pointer"
                title="Re-calculate Batch Schedule"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Schedule
              </button>

              <button
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800"
              >
                ← Back
              </button>

              <button
                disabled={batchErrors.length > 0}
                onClick={handleProcessBatches}
                className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition ${
                  batchErrors.length === 0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {batchErrors.length > 0 && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span>Process & Proceed to Step 4 (Zip Export)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Strict Red Collision Error Log Box */}
          {batchErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Schedule Overlap & Collision Errors ({batchErrors.length}):
              </div>
              <ul className="text-xs text-red-300 list-disc list-inside space-y-1">
                {batchErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Batch Cards List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {batches.map((b, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={b.batchName}
                    onChange={(e) => handleBatchConfigChange(idx, 'batchName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Capacity (Max 300)</label>
                  <input
                    type="number"
                    max={300}
                    min={0}
                    value={b.studentCount}
                    onChange={(e) => handleBatchConfigChange(idx, 'studentCount', e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-400" /> Batch Date
                  </label>
                  <input
                    type="date"
                    value={b.batchDate}
                    onChange={(e) => handleBatchConfigChange(idx, 'batchDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={b.startTime}
                    onChange={(e) => handleBatchConfigChange(idx, 'startTime', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">End Time (+2 hrs)</label>
                  <input
                    type="text"
                    readOnly
                    value={b.endTime}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4 SECTION */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/30 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <FileCheck2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Batch Processing Completed Successfully!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generated <b>{batches.length} Batch Excel files</b> for <b>{totalStudentCount} Students</b> ({globalSchoolName || 'School'}).
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-400 hover:text-white px-4 py-2.5 rounded-xl border border-slate-800"
              >
                ← Edit Batches
              </button>

              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-2.5 px-6 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <Archive className="w-4 h-4" />
                <span>{isZipping ? 'Creating ZIP Archive...' : 'Download School Batches ZIP Archive'}</span>
              </button>
            </div>
          </div>

          {/* Final Processed Output Preview Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Final Pulse Portal Output Preview</span>
              <span>Total Records: {processedData.length}</span>
            </div>

            <div className="overflow-x-auto max-h-[450px] overflow-y-auto whitespace-nowrap">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800 shadow-sm z-10">
                  <tr>
                    <th className="p-3 border-r border-slate-800">#</th>
                    <th className="p-3 border-r border-slate-800">Center</th>
                    <th className="p-3 border-r border-slate-800">FirstName</th>
                    <th className="p-3 border-r border-slate-800">LastName</th>
                    <th className="p-3 border-r border-slate-800">Gender</th>
                    <th className="p-3 border-r border-slate-800">Mobile</th>
                    <th className="p-3 border-r border-slate-800">PrimaryParentGuardianName</th>
                    <th className="p-3 border-r border-slate-800">BatchName</th>
                    <th className="p-3 border-r border-slate-800">BatchStartDate</th>
                    <th className="p-3 border-r border-slate-800">BatchStartTime</th>
                    <th className="p-3 border-r border-slate-800">BatchEndTime</th>
                    <th className="p-3 border-r border-slate-800">EducationInstitute</th>
                    <th className="p-3">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {processedData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-900/50 transition">
                      <td className="p-3 border-r border-slate-800/50 text-slate-500">{i + 1}</td>
                      <td className="p-3 border-r border-slate-800/50 font-mono text-emerald-400">{row.Center}</td>
                      <td className="p-3 border-r border-slate-800/50">{row.FirstName}</td>
                      <td className="p-3 border-r border-slate-800/50 font-medium text-white">{row.LastName}</td>
                      <td className="p-3 border-r border-slate-800/50">{row.Gender}</td>
                      <td className="p-3 border-r border-slate-800/50 font-mono">{row.Mobile}</td>
                      <td className="p-3 border-r border-slate-800/50 text-slate-200">{row.PrimaryParentGuardianName}</td>
                      <td className="p-3 border-r border-slate-800/50 text-emerald-400 font-bold">{row.BatchName}</td>
                      <td className="p-3 border-r border-slate-800/50 font-mono text-purple-300">{row.BatchStartDate}</td>
                      <td className="p-3 border-r border-slate-800/50">{row.BatchStartTime}</td>
                      <td className="p-3 border-r border-slate-800/50">{row.BatchEndTime}</td>
                      <td className="p-3 border-r border-slate-800/50 text-slate-300">{row.EducationInstitute || '-'}</td>
                      <td className="p-3">{row.Country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}