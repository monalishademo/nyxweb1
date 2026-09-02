'use client';

import React, { useState, useMemo } from 'react';
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
  RefreshCw,
  Wand2,
  Sparkles,
  Edit3
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
  isFormatError?: boolean;
  suggestedValue?: string;
}

const ALLOWED_BENEFICIARY_TYPES = [
  'Farmers / Villagers', 'Daily Wagers', 'Entrepreneurs', 'Government Officials',
  'Salaried', 'Self Employed / Freelancers', 'Doctors', 'Healthcare personnel',
  'School Staff', 'Contract workers', 'Admin staff', 'Defence Personnel',
  'Faculty / Professors', 'Forest Officials', 'Home Makers', 'Nurses',
  'SHGs / JLG', 'Trainees', 'Others', 'School', 'Community', 'College',
  'ITI', 'Institution', 'NGO', 'Coaching', 'Anganwadi'
];

const ALLOWED_CATEGORIES = ['GEN', 'OBC', 'ST', 'SC', 'NA'];

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
  const [defaultFaculty, setDefaultFaculty] = useState<string>('003C5000007IsjpIAC');
  const [formatTab, setFormatTab] = useState<'all' | 'format' | 'standard'>('all');

  // Format today's date safely (YYYY-MM-DD)
  const getTodayFormattedDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Step 3 & 4 States
  const [defaultBatchDate, setDefaultBatchDate] = useState<string>(getTodayFormattedDate());
  const [batches, setBatches] = useState<BatchConfig[]>([]);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const totalStudentCount = rawRows.length;

  // Helper: Format Date String safely
  const formatDateLocal = (dateObj: Date) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: Get Next Working Date (Skips Sunday)
  const getNextWorkingDate = (dateStr: string, addDaysCount: number = 1) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    let added = 0;
    while (added < addDaysCount) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) {
        added++;
      }
    }
    return formatDateLocal(d);
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

  // DIRECT COMPUTED VALIDATION ENGINE (Ensures Instant Reactivity)
  const validationErrors: ValidationError[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    let errList: ValidationError[] = [];

    const allRowsHaveCenter = rawRows.every((r) => Boolean(r['Center+Project'] || centerCode));
    const allRowsHaveSchool = rawRows.every((r) => Boolean(r['EducationInstitute'] || globalSchoolName));

    if (!allRowsHaveCenter && !centerCode.trim()) {
      errList.push({
        rowIndex: -1,
        excelRowNumber: 1,
        field: 'Center Code',
        currentValue: 'Missing',
        issue: 'Center Code is missing in records. Please enter Center Code in the box above.',
        isFormatError: false,
      });
    }

    if (!allRowsHaveSchool && !globalSchoolName.trim()) {
      errList.push({
        rowIndex: -1,
        excelRowNumber: 1,
        field: 'School / Institute Name',
        currentValue: 'Missing',
        issue: 'School/Institute Name is compulsory. Please enter School Name.',
        isFormatError: false,
      });
    }

    rawRows.forEach((row, index) => {
      const excelRowNumber = index + 2;

      // 1. Center Code Check
      const rowCenter = String(row['Center+Project'] || centerCode).trim();
      if (!rowCenter) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Center Code',
          currentValue: 'Missing',
          issue: 'Center Code is required for this record.',
          isFormatError: false,
        });
      }

      // 2. STRICT LAST NAME CHECK
      const fn = String(row.FirstName || '').trim();
      const ln = String(row.LastName || '').trim();

      if (!ln) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Last Name',
          currentValue: fn ? `"${fn}" (No surname)` : 'Missing',
          issue: 'Last Name is compulsory. Please enter candidate surname.',
          isFormatError: false,
        });
      }

      // 3. Gender Validation
      let genderRaw = String(row.Gender || '').trim();
      const upperGender = genderRaw.toUpperCase();
      if (upperGender !== 'MALE' && upperGender !== 'FEMALE' && upperGender !== 'NA') {
        let suggestion = 'Male';
        if (upperGender.startsWith('F') || upperGender.includes('FEM')) suggestion = 'Female';
        else if (upperGender.startsWith('M')) suggestion = 'Male';

        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Gender',
          currentValue: genderRaw || 'Missing',
          issue: "Gender must be strictly 'Male', 'Female', or 'NA'.",
          isFormatError: Boolean(genderRaw),
          suggestedValue: suggestion,
        });
      }

      // 4. Category Check
      let catRaw = String(row.Category || '').trim().toUpperCase();
      if (catRaw && !ALLOWED_CATEGORIES.includes(catRaw)) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Category',
          currentValue: catRaw,
          issue: 'Category must be Gen/OBC/ST/SC/NA.',
          isFormatError: true,
          suggestedValue: 'NA',
        });
      }

      // 5. Age Formatting & Number Check
      let ageRaw = String(row.Age || '').trim();
      if (!ageRaw) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Age',
          currentValue: 'Missing',
          issue: 'Age is required.',
          isFormatError: false,
        });
      } else {
        const cleanedAge = ageRaw.replace(/[^\d.]/g, '').split('.')[0];
        if (/[^\d]/.test(ageRaw) || ageRaw.includes('.') || ageRaw.includes('₹')) {
          errList.push({
            rowIndex: index,
            excelRowNumber,
            field: 'Age',
            currentValue: ageRaw,
            issue: 'Age formatting issue (Currency symbol / decimals detected). Expected clean integer text.',
            isFormatError: true,
            suggestedValue: cleanedAge || '14',
          });
        }
      }

      // 6. Mobile Formatting & Validation
      let mobileRaw = String(row.Mobile || '').trim();
      const cleanedMobile = mobileRaw.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Mobile',
          currentValue: mobileRaw || 'Missing',
          issue: 'Mobile must be exactly 10 digits starting with 6, 7, 8, or 9.',
          isFormatError: Boolean(mobileRaw && mobileRaw.length !== 10),
          suggestedValue: cleanedMobile,
        });
      } else if (mobileRaw !== cleanedMobile) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Mobile',
          currentValue: mobileRaw,
          issue: 'Mobile has extra characters/country codes. Clean format needed.',
          isFormatError: true,
          suggestedValue: cleanedMobile,
        });
      }

      // 7. Guardian Name
      let guardian = String(row.PrimaryParentGuardian || '').trim();
      if (!guardian) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Guardian Name',
          currentValue: 'Missing',
          issue: 'Parent or Guardian Name (PrimaryParentGuardian) is required.',
          isFormatError: false,
        });
      }

      // 8. Education Institute
      let school = String(row.EducationInstitute || globalSchoolName).trim();
      if (!school) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'School Name',
          currentValue: 'Missing',
          issue: 'School/Institute Name is required.',
          isFormatError: false,
        });
      }

      // 9. Beneficiary Type
      let benType = String(row.BeneficiaryType || 'School').trim();
      if (benType && !ALLOWED_BENEFICIARY_TYPES.includes(benType)) {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'Beneficiary Type',
          currentValue: benType,
          issue: `Invalid Beneficiary Type. Must match allowed master list.`,
          isFormatError: true,
          suggestedValue: 'School',
        });
      }

      // 10. State Check
      let state = String(row.State || '').trim();
      if (state.toUpperCase() === 'UP') {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'State',
          currentValue: state,
          issue: 'State abbreviations not allowed.',
          isFormatError: true,
          suggestedValue: 'Uttar Pradesh',
        });
      } else if (state.toUpperCase() === 'J&K') {
        errList.push({
          rowIndex: index,
          excelRowNumber,
          field: 'State',
          currentValue: state,
          issue: 'State abbreviations not allowed.',
          isFormatError: true,
          suggestedValue: 'Jammu and Kashmir',
        });
      }
    });

    return errList;
  }, [rawRows, centerCode, defaultCourse, globalSchoolName]);

  // Setter for Raw Rows
  const updateRowField = (index: number, fieldKey: string, newValue: string) => {
    setRawRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [fieldKey]: newValue } : r))
    );
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
        studentCount: Math.min(batchMap[k].count, 300),
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

  // STEP 1: Upload File & Normalize Columns immediately
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, raw: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { raw: false });

        const normalizedRows = rawJson.map((row) => {
          let fn = getRowValue(row, 'FirstName', 'First Name');
          let ln = getRowValue(row, 'LastName', 'Last Name', 'Surname');

          if (!fn && !ln) {
            let fullName = getRowValue(row, 'FullName', 'Name', 'StudentName', 'Student Name');
            if (fullName) {
              let parts = fullName.split(/\s+/).filter(Boolean);
              if (parts.length > 1) {
                ln = parts.pop() || '';
                fn = parts.join(' ');
              } else if (parts.length === 1) {
                fn = parts[0];
                ln = ''; // Strictly empty so it gets caught as an error!
              }
            }
          }

          return {
            FirstName: fn,
            LastName: ln,
            'Center+Project': getRowValue(row, 'Center+Project', 'Center', 'CenterCode', 'Center Code'),
            Gender: getRowValue(row, 'Gender'),
            Mobile: getRowValue(row, 'Mobile', 'Phone', 'Contact'),
            Age: getRowValue(row, 'Age'),
            Category: getRowValue(row, 'Category') || 'NA',
            Birthdate: getRowValue(row, 'Birthdate') || '',
            Email: getRowValue(row, 'Email') || '',
            Course: getRowValue(row, 'Course', 'CourseName'),
            Batch: getRowValue(row, 'Batch') || '',
            Project: getRowValue(row, 'Project') || '',
            PrimaryParentGuardian: getRowValue(row, 'PrimaryParentGuardian', 'PrimaryParentGuardianName', 'ParentName', 'FatherName', 'Guardian'),
            HouseholdIncome: getRowValue(row, 'HouseholdIncome') || '',
            SourceData: getRowValue(row, 'SourceData') || 'School',
            SubTopic: getRowValue(row, 'SubTopic') || '',
            State: getRowValue(row, 'State') || '',
            District: getRowValue(row, 'District') || '',
            City: getRowValue(row, 'City') || '',
            PinCode: getRowValue(row, 'PinCode', 'Pincode') || '',
            TypeofDisability: getRowValue(row, 'TypeofDisability') || '',
            BeneficiaryType: getRowValue(row, 'BeneficiaryType') || 'School',
            DeliveryModeOfBatch: getRowValue(row, 'DeliveryModeOfBatch', 'DeliveryMode') || 'Hybrid',
            Faculty: getRowValue(row, 'Faculty') || defaultFaculty,
            EducationInstitute: getRowValue(row, 'EducationInstitute', 'SchoolName', 'School'),
          };
        });

        setRawRows(normalizedRows);

        let extractedCenter = '';
        for (const row of normalizedRows) {
          const cVal = row['Center+Project'];
          if (cVal) {
            extractedCenter = cVal;
            break;
          }
        }

        if (extractedCenter) {
          setCenterCode(extractedCenter);
          setIsCenterCodeMissing(false);
        } else {
          setCenterCode('');
          setIsCenterCodeMissing(true);
        }

        const extractedCourse = normalizedRows[0]?.Course;
        if (extractedCourse) {
          setDefaultCourse(extractedCourse);
          setIsCourseMissing(false);
        } else {
          setIsCourseMissing(true);
        }

        const extractedSchool = normalizedRows[0]?.EducationInstitute;
        if (extractedSchool) {
          setGlobalSchoolName(extractedSchool);
          setIsSchoolMissing(false);
        } else {
          setIsSchoolMissing(true);
        }

        extractBatchesFromExcel(normalizedRows);
        setCurrentStep(2);
      } catch (err) {
        alert('Failed to process Excel file. Please upload a valid file.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // 1-Click Auto Fix for All Format Errors
  const handleAutoFixAllFormatting = () => {
    setRawRows((prev) =>
      prev.map((r) => {
        let row = { ...r };

        if (centerCode && !row['Center+Project']) {
          row['Center+Project'] = centerCode;
        }

        let gVal = String(row.Gender || '').toUpperCase();
        if (gVal.startsWith('F') || gVal.includes('FEM')) {
          row.Gender = 'Female';
        } else if (gVal.startsWith('M')) {
          row.Gender = 'Male';
        }

        let aVal = row.Age;
        if (aVal) {
          const cleanedAge = String(aVal).replace(/[^\d.]/g, '').split('.')[0];
          if (cleanedAge) row.Age = cleanedAge;
        }

        let mVal = row.Mobile;
        if (mVal) {
          const cleanedMob = String(mVal).replace(/\D/g, '').slice(-10);
          if (cleanedMob.length === 10) row.Mobile = cleanedMob;
        }

        let sVal = String(row.State || '').toUpperCase();
        if (sVal === 'UP') row.State = 'Uttar Pradesh';
        if (sVal === 'J&K') row.State = 'Jammu and Kashmir';

        return row;
      })
    );
  };

  // Single Field Fix Trigger
  const handleFixSingleError = (err: ValidationError) => {
    if (err.rowIndex === -1) {
      if (err.field === 'Center Code' && !centerCode) {
        setCenterCode('P192874');
      }
      return;
    }

    if (!err.suggestedValue) return;
    let targetKey = err.field === 'Last Name' ? 'LastName' : err.field;
    updateRowField(err.rowIndex, targetKey, err.suggestedValue);
  };

  // STEP 3: Setup Default Batches (Max 300 students per batch)
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
  const handleRecreateSchedule = (targetStartDate?: string) => {
    const dateToUse = targetStartDate || defaultBatchDate;
    setupDefaultBatches(totalStudentCount, dateToUse);
  };

  // Strict Live Batch Schedule & Time Collision Validator
  const validateBatchSchedule = (currentBatches: BatchConfig[]) => {
    const bErrs: string[] = [];

    const totalAllocated = currentBatches.reduce((a, b) => a + b.studentCount, 0);
    if (totalAllocated !== totalStudentCount) {
      bErrs.push(`Total allocated students (${totalAllocated}) does not match Total Records (${totalStudentCount}).`);
    }

    currentBatches.forEach((b) => {
      if (b.studentCount > 300) {
        bErrs.push(`Batch ${b.batchName}: Maximum batch size cannot exceed 300 students.`);
      }

      const [sh, sm] = b.startTime.split(':').map(Number);
      const startDec = sh + sm / 60;
      const [eh, em] = b.endTime.split(':').map(Number);
      const endDec = eh + em / 60;

      if (startDec < 10.5 || endDec > 17.5) {
        bErrs.push(`Batch ${b.batchName}: Schedule (${b.startTime} - ${b.endTime}) exceeds school hours (10:30 AM - 05:30 PM).`);
      }
    });

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

      const [year, month, day] = b.batchDate.split('-').map(Number);
      const dObj = new Date(year, month - 1, day);
      const dayOfWeek = dObj.getDay();
      const batchDayVal = dayOfWeek >= 1 && dayOfWeek <= 6 ? String(dayOfWeek) : '1';

      slice.forEach((row) => {
        const firstName = String(row.FirstName || '').trim();
        const lastName = String(row.LastName || '').trim();

        let genderRaw = String(row.Gender || '').trim().toUpperCase();
        let gender = genderRaw.startsWith('F') ? 'Female' : 'Male';

        let mobile = String(row.Mobile || '').replace(/\D/g, '').slice(-10);
        let guardian = String(row.PrimaryParentGuardian || '').trim();
        let school = String(row.EducationInstitute || globalSchoolName).trim();
        let pincodeStr = String(row.PinCode || '').trim();

        const cleanAgeStr = String(row.Age || '').replace(/[^\d.]/g, '').split('.')[0] || '14';

        finalData.push({
          'Center+Project': String(row['Center+Project'] || centerCode),
          'FirstName': firstName,
          'LastName': lastName,
          'Gender': gender,
          'Category': row.Category || 'NA',
          'Birthdate': String(row.Birthdate || ''),
          'Age': cleanAgeStr,
          'Mobile': mobile,
          'Email': row.Email || '',
          'Course': row.Course || defaultCourse,
          'Batch': row.Batch || '',
          'Project': row.Project || '',
          'PrimaryParentGuardian': guardian,
          'HouseholdIncome': row.HouseholdIncome || '',
          'SourceData': row.SourceData || 'School',
          'SubTopic': row.SubTopic || '',
          'State': row.State || '',
          'District': row.District || '',
          'City': row.City || '',
          'PinCode': pincodeStr,
          'TypeofDisability': row.TypeofDisability || '',
          'BeneficiaryType': row.BeneficiaryType || 'School',
          'BatchName': String(b.batchName),
          'DeliveryModeOfBatch': row.DeliveryModeOfBatch || 'Hybrid',
          'RequestedBatchSize': '300',
          'IncludeHolidays': 'TRUE',
          'BatchDays': `${batchDayVal};`,
          'BatchType': 'Normal',
          'BatchStartDate': String(b.batchDate),
          'Faculty': row.Faculty || defaultFaculty,
          'BatchStartTime': `${b.startTime}:00`,
          'BatchEndTime': `${b.endTime}:00`,
          'EducationInstitute': school,
          'Country': 'India',
        });
      });
    });

    setProcessedData(finalData);
    setCurrentStep(4);
  };

  // STEP 4: ZIP Export
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

        Object.keys(ws).forEach((cell) => {
          if (cell[0] === '!') return;
          const colHeader = ws[XLSX.utils.encode_cell({ r: 0, c: XLSX.utils.decode_cell(cell).c })]?.v;
          if (['Age', 'BatchDays', 'BatchStartTime', 'BatchEndTime', 'BatchStartDate', 'Mobile', 'RequestedBatchSize', 'PinCode'].includes(colHeader)) {
            ws[cell].t = 's';
          }
        });

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

  // Error Filtering
  const formatErrors = validationErrors.filter((e) => e.isFormatError);
  const standardErrors = validationErrors.filter((e) => !e.isFormatError);
  const displayedErrors = formatTab === 'format' ? formatErrors : formatTab === 'standard' ? standardErrors : validationErrors;

  return (
    <div className="w-full max-w-6xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-100 font-sans">
      
      {/* Top Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                ABC Pulse Batch Create
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full">
                MAX 300 / BATCH
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict Pulse Portal Template Formatter & Automated Batch Scheduler
            </p>
          </div>
        </div>

        {totalStudentCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-semibold shadow-2xs">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Total Records:</span>
            <span className="text-white bg-indigo-600 px-2 py-0.5 rounded-md font-mono text-xs font-bold">
              {totalStudentCount}
            </span>
          </div>
        )}
      </div>

      {/* 4-STEP STEPPER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          currentStep === 1
            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-xs'
            : currentStep > 1
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
            currentStep === 1 ? 'bg-indigo-600 text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Step 1: Upload</div>
            <div className="text-[10px] text-slate-500">Excel / CSV Import</div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          currentStep === 2
            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-xs'
            : currentStep > 2
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
            currentStep === 2 ? 'bg-indigo-600 text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {currentStep > 2 ? '✓' : '2'}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Step 2: Error & Format Check</div>
            <div className="text-[10px] text-slate-500">Auto-Fix & Validate</div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          currentStep === 3
            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-xs'
            : currentStep > 3
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
            currentStep === 3 ? 'bg-indigo-600 text-white' : currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {currentStep > 3 ? '✓' : '3'}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Step 3: Batch Create</div>
            <div className="text-[10px] text-slate-500">Max 300 / Batch Config</div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          currentStep === 4
            ? 'bg-emerald-50/80 border-emerald-600 text-emerald-900 shadow-xs'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
            currentStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            4
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Step 4: Zip Export</div>
            <div className="text-[10px] text-slate-500">Export School ZIP</div>
          </div>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {currentStep === 1 && (
        <div className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            id="pulse-excel-input"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <Upload className="w-6 h-6 stroke-[1.8]" />
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {file ? file.name : 'Upload Student Excel or CSV File'}
          </h3>
          <p className="text-xs text-slate-500 mb-6">Supports standard XLSX, XLS, or CSV formats.</p>

          <label
            htmlFor="pulse-excel-input"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Select Excel Document
          </label>
        </div>
      )}

      {/* STEP 2: Strict Error Check & Live Fix View */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Missing Global Headers */}
          {(isCenterCodeMissing || isCourseMissing || isSchoolMissing) && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
              <div className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Global Header Inputs (Missing in sheet - apply to all records):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {isCenterCodeMissing && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Center+Project *</label>
                    <input
                      type="text"
                      placeholder="e.g. P192874"
                      value={centerCode}
                      onChange={(e) => setCenterCode(e.target.value)}
                      className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full font-mono font-bold focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>
                )}

                {isCourseMissing && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Course Name *</label>
                    <input
                      type="text"
                      value={defaultCourse}
                      onChange={(e) => setDefaultCourse(e.target.value)}
                      className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>
                )}

                {isSchoolMissing && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">School / Institute Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. PINGBONI HIGH SCHOOL (H.S)"
                      value={globalSchoolName}
                      onChange={(e) => setGlobalSchoolName(e.target.value)}
                      className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              {validationErrors.length === 0 ? (
                <span className="text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  All {totalStudentCount} records are fully verified & formatted!
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-rose-700 font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Found {validationErrors.length} total issues (Must fix to proceed)
                  </span>
                  {formatErrors.length > 0 && (
                    <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      {formatErrors.length} format issues auto-fixable
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* 1-Click Auto Fix Button */}
              {formatErrors.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFixAllFormatting}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>⚡ Auto-Fix Formatting Errors</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-medium cursor-pointer"
              >
                ← Re-upload File
              </button>

              {/* STRICT LOCK BUTTON: Disabled whenever validationErrors > 0 */}
              <button
                type="button"
                disabled={validationErrors.length > 0}
                onClick={() => setCurrentStep(3)}
                className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-xs ${
                  validationErrors.length === 0
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                {validationErrors.length > 0 && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span>Proceed to Step 3 (Batch Create)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Error & Formatting Report Box */}
          {validationErrors.length > 0 && (
            <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-3 bg-rose-50/80 border-b border-rose-200 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Comprehensive Issue Log ({validationErrors.length} issues)
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormatTab('all')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${formatTab === 'all' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    All ({validationErrors.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatTab('format')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${formatTab === 'format' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    Formatting ({formatErrors.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatTab('standard')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${formatTab === 'standard' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    Missing / Strict ({standardErrors.length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">Row #</th>
                      <th className="p-2.5">Field</th>
                      <th className="p-2.5">Current Value</th>
                      <th className="p-2.5">Issue Description</th>
                      <th className="p-2.5 text-right">Action / Fix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedErrors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-mono text-rose-600 font-bold">
                          {err.excelRowNumber === 1 ? 'Header' : `Row ${err.excelRowNumber}`}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">{err.field}</td>
                        <td className="p-2.5 font-mono text-amber-700 font-bold bg-amber-50/50 rounded">
                          {err.currentValue}
                        </td>
                        <td className="p-2.5 text-rose-700">{err.issue}</td>
                        <td className="p-2.5 text-right">
                          {err.suggestedValue ? (
                            <button
                              type="button"
                              onClick={() => handleFixSingleError(err)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                              title={`Change to: ${err.suggestedValue}`}
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Fix to &quot;{err.suggestedValue}&quot;
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Edit in table</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive In-line Editable Verification Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center gap-2 font-bold text-indigo-700">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Live Verification Table (FirstName &amp; LastName are strictly verified):</span>
              </div>
              <span>Total Records: <b>{totalStudentCount}</b></span>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto whitespace-nowrap">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100/80 text-slate-600 sticky top-0 border-b border-slate-200 shadow-2xs z-10">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Status</th>
                    <th className="p-2.5 border-r border-slate-200">Row</th>
                    <th className="p-2.5 border-r border-slate-200">Center+Project</th>
                    <th className="p-2.5 border-r border-slate-200">FirstName</th>
                    <th className="p-2.5 border-r border-slate-200">LastName *</th>
                    <th className="p-2.5 border-r border-slate-200">Gender</th>
                    <th className="p-2.5 border-r border-slate-200">Mobile</th>
                    <th className="p-2.5 border-r border-slate-200">Age (Text)</th>
                    <th className="p-2.5 border-r border-slate-200">PrimaryParentGuardian</th>
                    <th className="p-2.5 border-r border-slate-200">BeneficiaryType</th>
                    <th className="p-2.5 border-r border-slate-200">Course</th>
                    <th className="p-2.5 border-r border-slate-200">EducationInstitute</th>
                    <th className="p-2.5 border-r border-slate-200">State</th>
                    <th className="p-2.5 border-r border-slate-200">District</th>
                    <th className="p-2.5">PinCode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawRows.map((row, i) => {
                    const rowNum = i + 2;

                    const rowCenter = String(row['Center+Project'] || centerCode).trim();
                    const fn = String(row.FirstName || '').trim();
                    const ln = String(row.LastName || '').trim();

                    const genderVal = String(row.Gender || '').trim();
                    const mobileVal = String(row.Mobile || '').trim();
                    const ageVal = String(row.Age || '').trim();
                    const guardianVal = String(row.PrimaryParentGuardian || '').trim();
                    const schoolVal = String(row.EducationInstitute || globalSchoolName).trim();

                    // Real-time cell-level error flags
                    const isLastNameErr = !ln;
                    const isGenderErr = !['MALE', 'FEMALE', 'NA'].includes(genderVal.toUpperCase());
                    const isMobileErr = !/^[6-9]\d{9}$/.test(mobileVal.replace(/\D/g, '').slice(-10));
                    const isAgeErr = !ageRawIsValid(ageVal);
                    const isCenterErr = !rowCenter;
                    const hasRowError = isLastNameErr || isGenderErr || isMobileErr || isAgeErr || isCenterErr || !guardianVal || !schoolVal;

                    return (
                      <tr key={i} className={`transition-colors ${hasRowError ? 'bg-rose-50/50 hover:bg-rose-100/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-2.5 border-r border-slate-100">
                          {hasRowError ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Error
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-100 text-slate-500 font-mono">Row {rowNum}</td>

                        {/* Center Code Cell */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={row['Center+Project'] || ''}
                            onChange={(e) => updateRowField(i, 'Center+Project', e.target.value)}
                            className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-1.5 py-0.5 font-mono text-xs w-28 focus:bg-white outline-none"
                            placeholder={centerCode || 'Center...'}
                          />
                        </td>

                        {/* FirstName Cell */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={row.FirstName || ''}
                            onChange={(e) => updateRowField(i, 'FirstName', e.target.value)}
                            className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-1.5 py-0.5 text-xs w-28 focus:bg-white outline-none font-medium text-slate-900"
                            placeholder="First name..."
                          />
                        </td>

                        {/* LastName Cell (Compulsory) */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={row.LastName || ''}
                            onChange={(e) => updateRowField(i, 'LastName', e.target.value)}
                            className={`text-xs px-2 py-1 rounded w-32 outline-none border font-bold transition-all ${
                              isLastNameErr
                                ? 'bg-rose-100 text-rose-900 border-rose-400 placeholder:text-rose-400 ring-2 ring-rose-300/40'
                                : 'bg-transparent border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-slate-900'
                            }`}
                            placeholder="Last name (Required)..."
                          />
                        </td>

                        {/* Gender Cell */}
                        <td className="p-2 border-r border-slate-100">
                          <select
                            value={genderVal.toUpperCase() === 'FEMALE' ? 'Female' : genderVal.toUpperCase() === 'MALE' ? 'Male' : genderVal}
                            onChange={(e) => updateRowField(i, 'Gender', e.target.value)}
                            className={`px-1.5 py-0.5 rounded text-xs font-semibold outline-none border ${
                              isGenderErr ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-transparent border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white'
                            }`}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            {genderVal && !['Male', 'Female'].includes(genderVal) && (
                              <option value={genderVal}>{genderVal} (Invalid)</option>
                            )}
                          </select>
                        </td>

                        {/* Mobile Cell */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={row.Mobile || ''}
                            onChange={(e) => updateRowField(i, 'Mobile', e.target.value)}
                            className={`font-mono text-xs px-1.5 py-0.5 rounded w-28 outline-none border ${
                              isMobileErr ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' : 'bg-transparent border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white'
                            }`}
                          />
                        </td>

                        {/* Age Cell */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={row.Age || ''}
                            onChange={(e) => updateRowField(i, 'Age', e.target.value)}
                            className={`font-mono text-xs px-1.5 py-0.5 rounded w-20 outline-none border ${
                              isAgeErr ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-transparent border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white'
                            }`}
                          />
                        </td>

                        {/* Guardian Name */}
                        <td className="p-2.5 border-r border-slate-100">{guardianVal || <span className="text-rose-600 font-bold">Missing</span>}</td>

                        {/* Beneficiary Type */}
                        <td className="p-2.5 border-r border-slate-100">{row.BeneficiaryType || 'School'}</td>

                        {/* Course */}
                        <td className="p-2.5 border-r border-slate-100 text-slate-600">{row.Course || defaultCourse}</td>

                        {/* School Name */}
                        <td className="p-2.5 border-r border-slate-100 text-slate-800">{schoolVal || <span className="text-rose-600 font-bold">Missing</span>}</td>

                        {/* State */}
                        <td className="p-2.5 border-r border-slate-100">{row.State || '-'}</td>
                        <td className="p-2.5 border-r border-slate-100">{row.District || '-'}</td>
                        <td className="p-2.5 font-mono">{row.PinCode || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Batch Schedule Setup */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Batch Setup (School Hours: 10:30 AM - 05:30 PM | Max 300 Students / Batch)
              </span>
              <span className="text-[11px] text-slate-500">
                Total Allocated: <b className="text-indigo-600">{batches.reduce((a, b) => a + b.studentCount, 0)}</b> / {totalStudentCount} Students
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Start Date:
              </label>
              <input
                type="date"
                value={defaultBatchDate}
                onChange={(e) => {
                  setDefaultBatchDate(e.target.value);
                  handleRecreateSchedule(e.target.value);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRecreateSchedule()}
                className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg transition cursor-pointer font-semibold shadow-2xs"
                title="Re-calculate Batch Schedule"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Schedule
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-medium cursor-pointer"
              >
                ← Back
              </button>

              <button
                type="button"
                disabled={batchErrors.length > 0}
                onClick={handleProcessBatches}
                className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition shadow-xs ${
                  batchErrors.length === 0
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                {batchErrors.length > 0 && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span>Process & Proceed to Step 4</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {batchErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Schedule Overlap & Collision Errors ({batchErrors.length}):
              </div>
              <ul className="text-xs text-rose-700 list-disc list-inside space-y-1">
                {batchErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {batches.map((b, idx) => (
              <div key={idx} className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={b.batchName}
                    onChange={(e) => handleBatchConfigChange(idx, 'batchName', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Capacity (Max 300)</label>
                  <input
                    type="number"
                    max={300}
                    min={0}
                    value={b.studentCount}
                    onChange={(e) => handleBatchConfigChange(idx, 'studentCount', e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Batch Date
                  </label>
                  <input
                    type="date"
                    value={b.batchDate}
                    onChange={(e) => handleBatchConfigChange(idx, 'batchDate', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={b.startTime}
                    onChange={(e) => handleBatchConfigChange(idx, 'startTime', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">End Time (+2 hrs)</label>
                  <input
                    type="text"
                    readOnly
                    value={b.endTime}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-700 font-mono font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: ZIP Export & Preview */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-200 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
              <FileCheck2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Batch Processing Completed Successfully!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Generated <b>{batches.length} Batch Excel files</b> for <b>{totalStudentCount} Students</b> ({globalSchoolName || 'School'}).
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-600 hover:text-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold cursor-pointer shadow-2xs"
              >
                ← Edit Batches
              </button>

              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Archive className="w-4 h-4" />
                <span>{isZipping ? 'Creating ZIP Archive...' : 'Download School Batches ZIP Archive'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-emerald-700">Final Pulse Portal Output Preview</span>
              <span>Total Processed Records: <b>{processedData.length}</b></span>
            </div>

            <div className="overflow-x-auto max-h-[450px] overflow-y-auto whitespace-nowrap">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100/80 text-slate-600 sticky top-0 border-b border-slate-200 shadow-2xs z-10">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">#</th>
                    <th className="p-2.5 border-r border-slate-200">Center+Project</th>
                    <th className="p-2.5 border-r border-slate-200">FirstName</th>
                    <th className="p-2.5 border-r border-slate-200">LastName</th>
                    <th className="p-2.5 border-r border-slate-200">Gender</th>
                    <th className="p-2.5 border-r border-slate-200">Mobile</th>
                    <th className="p-2.5 border-r border-slate-200">Age</th>
                    <th className="p-2.5 border-r border-slate-200">PrimaryParentGuardian</th>
                    <th className="p-2.5 border-r border-slate-200">BatchName</th>
                    <th className="p-2.5 border-r border-slate-200">DeliveryModeOfBatch</th>
                    <th className="p-2.5 border-r border-slate-200">RequestedBatchSize</th>
                    <th className="p-2.5 border-r border-slate-200">IncludeHolidays</th>
                    <th className="p-2.5 border-r border-slate-200">BatchDays</th>
                    <th className="p-2.5 border-r border-slate-200">BatchType</th>
                    <th className="p-2.5 border-r border-slate-200">BatchStartDate</th>
                    <th className="p-2.5 border-r border-slate-200">Faculty</th>
                    <th className="p-2.5 border-r border-slate-200">BatchStartTime</th>
                    <th className="p-2.5 border-r border-slate-200">BatchEndTime</th>
                    <th className="p-2.5 border-r border-slate-200">EducationInstitute</th>
                    <th className="p-2.5">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 border-r border-slate-100 text-slate-400 font-mono">{i + 1}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono text-indigo-600 font-bold">{row['Center+Project']}</td>
                      <td className="p-2.5 border-r border-slate-100">{row.FirstName}</td>
                      <td className="p-2.5 border-r border-slate-100 font-medium text-slate-900">{row.LastName}</td>
                      <td className="p-2.5 border-r border-slate-100">{row.Gender}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono">{row.Mobile}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono">{row.Age}</td>
                      <td className="p-2.5 border-r border-slate-100 text-slate-700">{row.PrimaryParentGuardian}</td>
                      <td className="p-2.5 border-r border-slate-100 text-emerald-700 font-bold font-mono">{row.BatchName}</td>
                      <td className="p-2.5 border-r border-slate-100">{row.DeliveryModeOfBatch}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono">{row.RequestedBatchSize}</td>
                      <td className="p-2.5 border-r border-slate-100">{row.IncludeHolidays}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono font-bold text-amber-700">{row.BatchDays}</td>
                      <td className="p-2.5 border-r border-slate-100">{row.BatchType}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono text-purple-700">{row.BatchStartDate}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono text-[10px]">{row.Faculty}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono">{row.BatchStartTime}</td>
                      <td className="p-2.5 border-r border-slate-100 font-mono">{row.BatchEndTime}</td>
                      <td className="p-2.5 border-r border-slate-100 text-slate-700">{row.EducationInstitute || '-'}</td>
                      <td className="p-2.5">{row.Country}</td>
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

// Inline helper for age valid check
function ageRawIsValid(val: string) {
  if (!val) return false;
  return !/[^\d]/.test(val) && !val.includes('.') && !val.includes('₹');
}