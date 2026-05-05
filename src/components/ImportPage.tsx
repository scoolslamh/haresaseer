import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Users, Building2 } from 'lucide-react';
import { GuardService } from '../services/guardService';
import { SchoolService } from '../services/schoolService';
import { OperationService } from '../services/operationService';
import { AuthService } from '../services/authService';
import * as XLSX from 'xlsx';
import { normalizeArabicText } from '../utils/arabicUtils';

// تعريف الثوابت المطلوبة للتحقق من صحة البيانات
const GENDERS = ['ذكر', 'أنثى'];
const GUARD_STATUSES = ['على رأس العمل', 'منقطع', 'مبعد عن المدارس', 'إجازة'];
const INSURANCE_OPTIONS = ['نعم', 'لا'];
const REGIONS = ['عسير', 'جيزان', 'الباحة', 'نجران'];

interface ImportData {
  guards: any[];
}

const cleanImportText = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, ' ');
};

const makeSchoolKey = (schoolName: any, region: any, governorate: any = ''): string => {
  const parts = [schoolName, region, governorate].map((part) =>
    normalizeArabicText(cleanImportText(part)).toLowerCase()
  );

  return parts.join('|');
};

const ImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // إنشاء workbook جديد
    const wb = XLSX.utils.book_new();
    
    // البيانات النموذجية
    const templateData = [
      {
        'اسم الحارس': 'أحمد محمد علي',
        'السجل المدني': '1234567890',
        'رقم الملف': 'ملف-001',
        'الجنس': 'ذكر',
        'تاريخ الميلاد': '1985-05-15',
        'التأمينات': 'نعم',
        'تاريخ المباشرة': '2020-01-01',
        'رقم الجوال': '0501234567',
        'الآيبان': 'SA1234567890123456789012',
        'حالة الحارس': 'على رأس العمل',
        'ملاحظات الحارس': 'حارس ممتاز',
        'المنطقة': 'عسير',
        'المحافظة': 'أبها',
        'اسم المدرسة': 'مدرسة الملك عبدالعزيز الابتدائية',
        'اسم المدير': 'محمد أحمد السعيد',
        'جوال المدير': '0509876543',
        'حالة المدرسة': 'نشط',
        'ملاحظات المدرسة': 'مدرسة حكومية'
      },
      {
        'اسم الحارس': 'فاطمة سالم أحمد',
        'السجل المدني': '1122334455',
        'رقم الملف': 'ملف-002',
        'الجنس': 'أنثى',
        'تاريخ الميلاد': '1990-03-10',
        'التأمينات': 'نعم',
        'تاريخ المباشرة': '2021-02-15',
        'رقم الجوال': '0505566778',
        'الآيبان': 'SA5544332211009988776655',
        'حالة الحارس': 'إجازة',
        'ملاحظات الحارس': 'في إجازة مرضية',
        'المنطقة': 'الباحة',
        'المحافظة': 'الباحة',
        'اسم المدرسة': 'مدرسة الفجر الثانوية للبنات',
        'اسم المدير': 'نورا عبدالله الغامدي',
        'جوال المدير': '0507788990',
        'حالة المدرسة': 'نشط',
        'ملاحظات المدرسة': 'مدرسة للبنات'
      }
    ];

    // إنشاء worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // تحسين عرض الأعمدة
    const colWidths = [
      { wch: 20 }, // اسم الحارس
      { wch: 15 }, // السجل المدني
      { wch: 15 }, // رقم الملف
      { wch: 10 }, // الجنس
      { wch: 15 }, // تاريخ الميلاد
      { wch: 10 }, // التأمينات
      { wch: 15 }, // تاريخ المباشرة
      { wch: 15 }, // رقم الجوال
      { wch: 25 }, // الآيبان
      { wch: 15 }, // حالة الحارس
      { wch: 30 }, // ملاحظات الحارس
      { wch: 15 }, // المنطقة
      { wch: 15 }, // المحافظة
      { wch: 35 }, // اسم المدرسة
      { wch: 20 }, // اسم المدير
      { wch: 15 }, // جوال المدير
      { wch: 15 }, // حالة المدرسة
      { wch: 30 }  // ملاحظات المدرسة
    ];
    ws['!cols'] = colWidths;

    // إضافة الورقة إلى الكتاب
    XLSX.utils.book_append_sheet(wb, ws, 'بيانات الحراس');

    // تصدير الملف
    XLSX.writeFile(wb, 'template_guards_schools.xlsx');
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedData(null);
    setImportResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.xlsx'))) {
      handleFileSelect(droppedFile);
    }
  };

  // معالجة التواريخ من Excel
  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;
    
    // إذا كان رقم (Excel serial date)
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }
    
    // إذا كان نص
    if (typeof value === 'string') {
      return parseTextDate(value);
    }
    
    return null;
  };

  // معالجة التواريخ النصية
  const parseTextDate = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    
    // تنظيف النص
    let cleanDate = dateStr.trim();
    
    // تحويل الأرقام العربية للإنجليزية
    cleanDate = convertArabicNumbers(cleanDate);
    
    // أنماط التواريخ المختلفة
    const patterns = [
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
    ];
    
    for (const pattern of patterns) {
      const match = cleanDate.match(pattern);
      if (match) {
        let year, month, day;
        
        if (pattern.source.startsWith('^(\\d{4})')) {
          // YYYY-MM-DD or YYYY/MM/DD
          [, year, month, day] = match;
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          [, day, month, year] = match;
        }
        
        // التحقق من صحة التاريخ
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (date.getFullYear() == parseInt(year) && 
            date.getMonth() == parseInt(month) - 1 && 
            date.getDate() == parseInt(day)) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  };

  // تحويل الأرقام العربية للإنجليزية
  const convertArabicNumbers = (str: string): string => {
    const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
    const englishNumbers = '0123456789';
    
    return str.replace(/[٠-٩]/g, (match) => {
      return englishNumbers[arabicNumbers.indexOf(match)];
    });
  };

  // معالجة أرقام الجوال
  const formatPhoneNumber = (phone: any): string => {
    if (!phone) return '';
    
    let cleanPhone = String(phone).trim();
    
    // تحويل الأرقام العربية
    cleanPhone = convertArabicNumbers(cleanPhone);
    
    // إزالة المسافات والرموز
    cleanPhone = cleanPhone.replace(/[\s\-\(\)]/g, '');
    
    // معالجة مفتاح الدولة 966
    if (cleanPhone.startsWith('966')) {
      // إزالة 966 وإضافة 0
      cleanPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('+966')) {
      // إزالة +966 وإضافة 0
      cleanPhone = '0' + cleanPhone.substring(4);
    }
    
    // إضافة 0 في البداية إذا لم تكن موجودة
    if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
      cleanPhone = '0' + cleanPhone;
    }
    
    // التحقق من صحة الرقم
    if (/^05\d{8}$/.test(cleanPhone)) {
      return cleanPhone;
    }
    
    return cleanPhone; // إرجاع الرقم كما هو للمراجعة
  };

  // معالجة الآيبان
  const formatIBAN = (iban: any): string => {
    if (!iban) return '';
    
    let cleanIBAN = String(iban).trim().toUpperCase();
    
    // إزالة المسافات
    cleanIBAN = cleanIBAN.replace(/\s/g, '');
    
    // إضافة SA في البداية إذا لم تكن موجودة
    if (cleanIBAN.length === 22 && /^\d/.test(cleanIBAN)) {
      cleanIBAN = 'SA' + cleanIBAN;
    }
    
    return cleanIBAN;
  };

  // معالجة ملف Excel
  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      setCurrentStep('قراءة ملف Excel...');
      setProcessingProgress(10);
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          setCurrentStep('تحويل البيانات...');
          setProcessingProgress(30);
          
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { 
            type: 'array', 
            cellDates: true,
            cellNF: false,
            cellText: false
          });
          
          setCurrentStep('قراءة الورقة...');
          setProcessingProgress(50);
          
          // قراءة الورقة الأولى
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // تحويل إلى JSON
          setCurrentStep('تحويل إلى JSON...');
          setProcessingProgress(70);
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false
          });
          
          if (jsonData.length < 2) {
            reject(new Error('الملف يجب أن يحتوي على رأس الأعمدة وبيانات واحدة على الأقل'));
            return;
          }
          
          setCurrentStep('تنظيم البيانات...');
          setProcessingProgress(90);
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          // تصفية الصفوف الفارغة
          const filteredRows = rows.filter(row => 
            row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
          );
          
          const parsedData = filteredRows.map(row => {
            const rowData: any = {};
            headers.forEach((header, index) => {
              const cellValue = row[index];
              rowData[header] = cellValue === null || cellValue === undefined ? '' : cellValue;
            });
            return rowData;
          });
          
          setProcessingProgress(100);
          resolve(parsedData);
        } catch (error) {
          reject(new Error('خطأ في قراءة ملف Excel: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('خطأ في قراءة الملف'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // معالجة ملف CSV
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const validateGuardData = (row: any, rowIndex: number): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من الحقول المطلوبة
    if (!row['اسم الحارس']) errors.push(`الصف ${rowIndex + 2}: اسم الحارس مطلوب`);

    // التحقق من صحة البيانات
    if (row['الجنس'] && !GENDERS.includes(row['الجنس'])) {
      errors.push(`الصف ${rowIndex + 2}: الجنس يجب أن يكون "ذكر" أو "أنثى"`);
    }

    if (row['حالة الحارس'] && !GUARD_STATUSES.includes(row['حالة الحارس'])) {
      errors.push(`الصف ${rowIndex + 2}: حالة الحارس غير صحيحة`);
    }

    if (row['التأمينات'] && !INSURANCE_OPTIONS.includes(row['التأمينات'])) {
      errors.push(`الصف ${rowIndex + 2}: التأمينات يجب أن يكون "نعم" أو "لا"`);
    }

    // التحقق من تاريخ الميلاد
    if (row['تاريخ الميلاد'] && !parseTextDate(String(row['تاريخ الميلاد']))) {
      warnings.push(`الصف ${rowIndex + 2}: تنسيق تاريخ الميلاد غير صحيح`);
    }

    // التحقق من رقم الجوال
    const formattedPhone = formatPhoneNumber(row['رقم الجوال']);
    if (row['رقم الجوال'] && !/^05\d{8}$/.test(formattedPhone)) {
      warnings.push(`الصف ${rowIndex + 2}: تنسيق رقم الجوال غير صحيح`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const validateSchoolData = (row: any, rowIndex: number): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من الحقول المطلوبة
    if (!row['المنطقة']) errors.push(`الصف ${rowIndex + 2}: المنطقة مطلوبة`);
    if (!row['اسم المدرسة']) errors.push(`الصف ${rowIndex + 2}: اسم المدرسة مطلوب`);

    // التحقق من صحة المنطقة
    if (row['المنطقة'] && !REGIONS.includes(row['المنطقة'])) {
      errors.push(`الصف ${rowIndex + 2}: المنطقة يجب أن تكون إحدى: ${REGIONS.join(', ')}`);
    }

    // التحقق من رقم جوال المدير
    const formattedPhone = formatPhoneNumber(row['جوال المدير']);
    if (row['جوال المدير'] && !/^05\d{8}$/.test(formattedPhone)) {
      warnings.push(`الصف ${rowIndex + 2}: تنسيق جوال المدير غير صحيح`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const processData = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessedData(null);
    setImportResult(null);
    setProcessingProgress(0);
    setCurrentStep('بدء المعالجة...');
    
    try {
      let rows: any[] = [];
      
      // تحديد نوع الملف ومعالجته
      if (file.name.endsWith('.xlsx')) {
        setCurrentStep('معالجة ملف Excel...');
        rows = await parseExcelFile(file);
      } else if (file.name.endsWith('.csv')) {
        setCurrentStep('معالجة ملف CSV...');
        setProcessingProgress(20);
        const text = await file.text();
        setProcessingProgress(60);
        rows = parseCSV(text);
        setProcessingProgress(100);
      } else {
        throw new Error('نوع الملف غير مدعوم. يرجى استخدام ملفات Excel (.xlsx) أو CSV');
      }

      setCurrentStep(`معالجة ${rows.length} صف من البيانات...`);
      setProcessingProgress(0);
      
      const guards: any[] = [];
      const schools: any[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      const schoolKeys = new Set<string>();

      // معالجة سريعة بدون دفعات للملفات الصغيرة والمتوسطة
      for (let i = 0; i < rows.length; i++) {
        // تحديث شريط التقدم كل 10 صفوف
        if (i % 10 === 0) {
          const progress = Math.round((i / rows.length) * 100);
          setProcessingProgress(progress);
          setCurrentStep(`معالجة الصف ${i + 1} من ${rows.length}...`);
          
          // تأخير صغير جداً كل 50 صف للسماح للواجهة بالتحديث
          if (i % 50 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        const row = rows[i];
        const normalizedRow = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            cleanImportText(key),
            typeof value === 'string' ? cleanImportText(value) : value
          ])
        );

        // معالجة وتنسيق البيانات
        const processedRow = {
          ...normalizedRow,
          'تاريخ الميلاد': parseExcelDate(normalizedRow['تاريخ الميلاد']),
          'تاريخ المباشرة': parseExcelDate(normalizedRow['تاريخ المباشرة']) || new Date().toISOString().split('T')[0],
          'رقم الجوال': formatPhoneNumber(normalizedRow['رقم الجوال']),
          'جوال المدير': formatPhoneNumber(normalizedRow['جوال المدير']),
          'الآيبان': formatIBAN(normalizedRow['الآيبان'])
        };

        // معالجة بيانات الحارس
        const guardValidation = validateGuardData(processedRow, i);
        errors.push(...guardValidation.errors);
        warnings.push(...guardValidation.warnings);

        if (guardValidation.isValid) {
          guards.push({
            guard_name: processedRow['اسم الحارس'],
            civil_id: processedRow['السجل المدني'] || '',
            file: processedRow['رقم الملف'] || '',
            gender: processedRow['الجنس'] || '',
            birth_date: processedRow['تاريخ الميلاد'],
            insurance: processedRow['التأمينات'] || '',
            start_date: processedRow['تاريخ المباشرة'],
            mobile: processedRow['رقم الجوال'] || '',
            iban: processedRow['الآيبان'] || '',
            status: processedRow['حالة الحارس'] || 'على رأس العمل',
            notes: processedRow['ملاحظات الحارس'] || '',
            school_key: makeSchoolKey(
              processedRow['اسم المدرسة'],
              processedRow['المنطقة'],
              processedRow['المحافظة']
            )
          });
        }

        // معالجة بيانات المدرسة
        const schoolValidation = validateSchoolData(processedRow, i);
        errors.push(...schoolValidation.errors);
        warnings.push(...schoolValidation.warnings);

        if (schoolValidation.isValid) {
          const schoolKey = makeSchoolKey(
            processedRow['اسم المدرسة'],
            processedRow['المنطقة'],
            processedRow['المحافظة']
          );
          if (!schoolKeys.has(schoolKey)) {
            schoolKeys.add(schoolKey);
            schools.push({
              region: processedRow['المنطقة'],
              governorate: processedRow['المحافظة'] || '',
              school_name: processedRow['اسم المدرسة'],
              principal_name: processedRow['اسم المدير'] || '',
              principal_mobile: processedRow['جوال المدير'] || '',
              status: processedRow['حالة المدرسة'] || 'نشط',
              notes: processedRow['ملاحظات المدرسة'] || ''
            });
          }
        }
      }

      setProcessingProgress(100);
      setCurrentStep('اكتمال المعالجة');

      setProcessedData({
        validGuards: guards,
        validSchools: schools,
        errors,
        warnings,
        stats: {
          totalRows: rows.length,
          validGuards: guards.length,
          validSchools: schools.length
        }
      });
    } catch (error) {
      setProcessedData({
        validGuards: [],
        validSchools: [],
        errors: [error instanceof Error ? error.message : 'خطأ في قراءة الملف'],
        warnings: [],
        stats: {
          totalRows: 0,
          validGuards: 0,
          validSchools: 0
        }
      });
    } finally {
      setIsProcessing(false);
     setProcessingProgress(0);
     setCurrentStep('');
    }
  };

  const importData = async () => {
    if (!processedData || processedData.errors.length > 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setCurrentStep('بدء الاستيراد...');
    
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      setCurrentStep('إنشاء المدارس...');
      setImportProgress(10);
      
      // إنشاء المدارس أولاً
      const schoolMap = new Map<string, string>();
      const schoolImportErrors: string[] = [];
      const guardImportErrors: string[] = [];
      let createdSchoolsCount = 0;
      const totalSchools = processedData.validSchools.length;

      const existingSchools = await SchoolService.getAllSchools();
      existingSchools.forEach((school) => {
        schoolMap.set(
          makeSchoolKey(school.school_name, school.region, school.governorate),
          school.id
        );
      });
      
      for (let i = 0; i < processedData.validSchools.length; i++) {
        const school = processedData.validSchools[i];
        
        // تحديث التقدم
        if (totalSchools > 0) {
          const progress = 10 + Math.round((i / totalSchools) * 30);
          setImportProgress(progress);
          setCurrentStep(`إنشاء المدرسة ${i + 1} من ${totalSchools}...`);
        }
        
        try {
          const schoolKey = makeSchoolKey(school.school_name, school.region, school.governorate);
          if (schoolMap.has(schoolKey)) {
            continue;
          }

          const createdSchool = await SchoolService.createSchool(school);
          schoolMap.set(schoolKey, createdSchool.id);
          createdSchoolsCount++;
        } catch (error: any) {
          if (error.message?.includes('duplicate')) {
            // المدرسة موجودة، نحصل على معرفها
            const refreshedSchools = await SchoolService.getAllSchools();
            const existingSchool = refreshedSchools.find(s => 
              makeSchoolKey(s.school_name, s.region, s.governorate) ===
              makeSchoolKey(school.school_name, school.region, school.governorate)
            );
            if (existingSchool) {
              const schoolKey = makeSchoolKey(school.school_name, school.region, school.governorate);
              schoolMap.set(schoolKey, existingSchool.id);
            } else {
              schoolImportErrors.push(`${school.school_name}: موجودة مسبقاً لكن تعذر العثور عليها للربط`);
            }
          } else {
            schoolImportErrors.push(`${school.school_name}: ${error.message || 'تعذر إنشاء المدرسة'}`);
          }
        }
      }

      setCurrentStep('إنشاء الحراس...');
      setImportProgress(40);
      
      // إنشاء الحراس
      let successCount = 0;
      const totalGuards = processedData.validGuards.length;
      
      for (let i = 0; i < processedData.validGuards.length; i++) {
        const guard = processedData.validGuards[i];
        
        // تحديث التقدم
        const progress = 40 + Math.round((i / totalGuards) * 50);
        setImportProgress(progress);
        setCurrentStep(`إنشاء الحارس ${i + 1} من ${totalGuards}...`);
        
        try {
          const schoolId = schoolMap.get(guard.school_key);
          const guardData = { ...guard };
          delete guardData.school_key;
          if (schoolId) {
            guardData.school_id = schoolId;
          }
          
          // تطبيع النصوص العربية قبل الحفظ
          guardData.guard_name = normalizeArabicText(guardData.guard_name);
          guardData.notes = normalizeArabicText(guardData.notes || '');
          
          await GuardService.createGuard(guardData);
          successCount++;
        } catch (error: any) {
          console.error('Error creating guard:', error);
          guardImportErrors.push(`${guard.guard_name}: ${error.message || 'تعذر إنشاء الحارس'}`);
        }
      }

      setCurrentStep('تسجيل العملية...');
      setImportProgress(95);
      
      // تسجيل العملية
      await OperationService.logOperation(
        'إضافة حارس',
        `تم استيراد ${successCount} حارس و ${processedData.validSchools.length} مدرسة (${createdSchoolsCount} جديدة) من ملف ${file?.name}`
      );

      setImportProgress(100);
      setCurrentStep('اكتمال الاستيراد');
      
      setImportResult({
        success: schoolImportErrors.length === 0 && guardImportErrors.length === 0,
        message:
          schoolImportErrors.length === 0 && guardImportErrors.length === 0
            ? `تم استيراد ${successCount} حارس و ${processedData.validSchools.length} مدرسة بنجاح (${createdSchoolsCount} جديدة)`
            : `تم استيراد ${successCount} حارس و ${processedData.validSchools.length} مدرسة، مع وجود ${schoolImportErrors.length + guardImportErrors.length} خطأ`
      });

      // إعادة تعيين النموذج
      setTimeout(() => {
        setFile(null);
        setProcessedData(null);
        setImportResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);

    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || 'حدث خطأ أثناء الاستيراد'
      });
    } finally {
      setIsImporting(false);
     setImportProgress(0);
     setCurrentStep('');
    }
  };

  const resetForm = () => {
    setFile(null);
    setProcessedData(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">استيراد البيانات</h1>
            <p className="text-gray-600">استيراد بيانات الحراس والمدارس من ملفات Excel أو CSV</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-moe-600 text-white px-4 py-2 rounded-lg hover:bg-moe-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            تحميل القالب
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">رفع الملف</h2>
        
        <div className="bg-moe-50 border border-moe-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-moe-800 mb-2">الملفات المدعومة:</h3>
          <ul className="text-sm text-moe-700 space-y-1">
            <li>• <strong>Excel (.xlsx)</strong> - مع معالجة تلقائية للتواريخ والأرقام</li>
            <li>• <strong>CSV (.csv)</strong> - ملفات نصية مفصولة بفواصل</li>
            <li>• <strong>معالجة ذكية:</strong> تحويل التواريخ، تنسيق أرقام الجوال والآيبان</li>
            <li>• <strong>أرقام الجوال:</strong> دعم الأرقام المحلية (05xxxxxxxx) والدولية (+966xxxxxxx)</li>
            <li>• <strong>دعم الأرقام العربية:</strong> تحويل تلقائي للأرقام الإنجليزية</li>
          </ul>
        </div>
        
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-moe-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">اسحب وأفلت ملف Excel أو CSV هنا أو انقر للاختيار</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            اختيار ملف
          </button>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-moe-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-moe-600" />
              <span className="text-moe-800 font-medium">{file.name}</span>
              <span className="text-moe-600 text-sm">
                ({file.name.endsWith('.xlsx') ? 'Excel' : 'CSV'})
              </span>
              <button
                onClick={resetForm}
                className="mr-auto text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {file && !processedData && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={processData}
              disabled={isProcessing}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isProcessing ? 'جاري المعالجة... (قد تستغرق دقيقة للملفات الكبيرة)' : 'معالجة البيانات'}
            </button>
          </div>
        )}
        
        {isProcessing && (
          <div className="mt-4 bg-moe-50 border border-moe-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-moe-600"></div>
              <span className="text-moe-800 font-medium">{currentStep}</span>
            </div>
            
            {/* شريط التقدم */}
            <div className="mb-3">
              <div className="flex justify-between text-sm text-moe-700 mb-1">
                <span>التقدم</span>
                <span>{processingProgress}%</span>
              </div>
              <div className="w-full bg-moe-200 rounded-full h-3">
                <div 
                  className="bg-moe-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-sm text-moe-700">
              <p className="mb-1">
                <strong>الملف:</strong> {file?.name} ({file ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB)
              </p>
              <p className="text-moe-600">
                {processingProgress < 100 ? 'جاري المعالجة...' : 'اكتمال المعالجة'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Processing Results */}
      {processedData && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ملخص المعالجة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-moe-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-moe-600" />
                  <span className="text-moe-800 font-medium">إجمالي الصفوف</span>
                </div>
                <p className="text-2xl font-bold text-moe-900 mt-1">{processedData.stats.totalRows}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">حراس صحيحين</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">{processedData.stats.validGuards}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-800 font-medium">مدارس صحيحة</span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-1">{processedData.stats.validSchools}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">أخطاء</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">{processedData.errors.length}</p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {processedData.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">أخطاء يجب إصلاحها</h3>
              </div>
              <ul className="space-y-1">
                {processedData.errors.map((error, index) => (
                  <li key={index} className="text-red-700 text-sm">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {processedData.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">تحذيرات (تم إصلاحها تلقائياً)</h3>
              </div>
              <ul className="space-y-1">
                {processedData.warnings.map((warning, index) => (
                  <li key={index} className="text-yellow-700 text-sm">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Button */}
          {processedData.errors.length === 0 && processedData.validGuards.length > 0 && (
            <div className="space-y-4">
              {isImporting && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-green-800 font-medium">{currentStep}</span>
                  </div>
                  
                  {/* شريط تقدم الاستيراد */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-green-700 mb-1">
                      <span>تقدم الاستيراد</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-green-700">
                    {importProgress < 100 ? 'جاري الاستيراد إلى قاعدة البيانات...' : 'اكتمال الاستيراد'}
                  </p>
                </div>
              )}
              
              <div className="flex justify-center">
              <button
                onClick={importData}
                disabled={isImporting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isImporting ? 'جاري الاستيراد...' : `استيراد ${processedData.validGuards.length} حارس و ${processedData.validSchools.length} مدرسة`}
              </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`p-4 rounded-lg border ${
          importResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {importResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">{importResult.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
