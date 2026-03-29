import { ImportGuardData, GuardFormData } from '../types/guard';
import { normalizeArabicText } from './arabicUtils';

// تعريف الثوابت المطلوبة للتحقق من صحة البيانات
const GENDERS = ['ذكر', 'أنثى'];
const GUARD_STATUSES = ['على رأس العمل', 'منقطع', 'مبعد عن المدارس', 'إجازة'];
const INSURANCE_OPTIONS = ['نعم', 'لا'];

// حدود الطول الأقصى لكل حقل
const FIELD_MAX_LENGTHS: Record<string, number> = {
  guard_name: 100,
  school_name: 150,
  principal_name: 100,
  region: 50,
  governorate: 50,
  city: 50,
  civil_id: 20,
  mobile: 20,
  principal_mobile: 20,
  iban: 34,
  notes: 500
};

// دالة تنظيف النص من المحارف الخطرة
function sanitizeField(value: string, maxLength?: number): string {
  if (!value) return '';
  // إزالة وسوم HTML ومحارف التحكم
  let sanitized = value
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

const MAX_CSV_ROWS = 1000;

export class CSVParser {
  static parseCSV(csvContent: string): ImportGuardData[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('ملف CSV يجب أن يحتوي على رأس الأعمدة وبيانات واحدة على الأقل');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data: ImportGuardData[] = [];

    if (lines.length - 1 > MAX_CSV_ROWS) {
      throw new Error(`يتجاوز عدد الصفوف الحد الأقصى المسموح به (${MAX_CSV_ROWS} صف)`);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const rawValue = values[index] || '';
        const headerKey = header.toLowerCase();
        // تحديد الحقل المناسب للتحقق من طوله
        const fieldKey = Object.keys(FIELD_MAX_LENGTHS).find(k => headerKey.includes(k)) || undefined;
        const value = sanitizeField(rawValue, fieldKey ? FIELD_MAX_LENGTHS[fieldKey] : 200);
        
        // تحويل أسماء الأعمدة العربية إلى الإنجليزية
        switch (header.toLowerCase()) {
          case 'المنطقة':
          case 'region':
            row.region = normalizeArabicText(value);
            break;
          case 'المحافظة':
          case 'governorate':
            row.governorate = normalizeArabicText(value);
            break;
          case 'المدينة':
          case 'city':
            row.city = normalizeArabicText(value);
            break;
          case 'اسم المدرسة':
          case 'school_name':
          case 'school':
            row.school_name = normalizeArabicText(value);
            break;
          case 'المدير / ة':
          case 'المدير':
          case 'principal_name':
          case 'principal':
            row.principal_name = normalizeArabicText(value);
            break;
          case 'الجوال':
          case 'جوال المدير':
          case 'principal_mobile':
            row.principal_mobile = value;
            break;
          case 'اسم الحارس':
          case 'guard_name':
          case 'name':
            row.guard_name = normalizeArabicText(value);
            break;
          case 'السجل المدني':
          case 'civil_id':
            row.civil_id = value;
            break;
          case 'الجنس':
          case 'gender':
            row.gender = normalizeArabicText(value);
            break;
          case 'تاريخ الميلاد':
          case 'birth_date':
            row.birth_date = value;
            break;
          case 'التأمينات':
          case 'insurance':
            row.insurance = normalizeArabicText(value);
            break;
          case 'تاريخ المباشرة':
          case 'start_date':
            row.start_date = value;
            break;
          case 'رقم الجوال':
          case 'mobile':
            row.mobile = value;
            break;
          case 'الآيبان':
          case 'iban':
            row.iban = value;
            break;
          case 'ملاحظات':
          case 'notes':
            row.notes = normalizeArabicText(value);
            break;
        }
      });

      if (row.guard_name && row.school_name) {
        data.push(row);
      }
    }

    return data;
  }

  static validateAndConvertData(importData: ImportGuardData[]): GuardFormData[] {
    return importData.map((item, index) => {
      if (!item.guard_name || !item.school_name) {
        throw new Error(`الصف ${index + 2}: اسم الحارس واسم المدرسة مطلوبان`);
      }

      // التحقق من صحة التاريخ
      let birth_date = '';
      if (item.birth_date) {
        const parsedDate = new Date(item.birth_date);
        if (!isNaN(parsedDate.getTime())) {
          birth_date = parsedDate.toISOString().split('T')[0];
        }
      }

      let start_date = new Date().toISOString().split('T')[0];
      if (item.start_date) {
        const parsedDate = new Date(item.start_date);
        if (!isNaN(parsedDate.getTime())) {
          start_date = parsedDate.toISOString().split('T')[0];
        }
      }

      return {
        region: item.region || '',
        governorate: item.governorate || '',
        city: item.city || '',
        school_name: item.school_name,
        principal_name: item.principal_name || '',
        principal_mobile: item.principal_mobile || '',
        guard_name: item.guard_name,
        civil_id: item.civil_id || '',
        gender: item.gender || '',
        birth_date,
        insurance: item.insurance || '',
        start_date,
        mobile: item.mobile || '',
        iban: item.iban || '',
        notes: item.notes || ''
      };
    });
  }

  static generateSampleCSV(): string {
    const headers = [
      'المنطقة', 'المحافظة', 'المدينة', 'اسم المدرسة', 'المدير / ة', 
      'الجوال', 'اسم الحارس', 'السجل المدني', 'الجنس', 'تاريخ الميلاد', 
      'التأمينات', 'تاريخ المباشرة', 'رقم الجوال', 'الآيبان', 'ملاحظات'
    ];
    
    const sampleData = [
      [
        'الرياض', 'الرياض', 'الرياض', 'مدرسة الأمل الابتدائية', 'أحمد محمد السعد',
        '0501234567', 'محمد علي أحمد', '1234567890', 'ذكر', '1985-05-15',
        'نعم', '2024-01-15', '0509876543', 'SA1234567890123456789012', 'حارس ممتاز'
      ],
      [
        'مكة', 'جدة', 'جدة', 'مدرسة النور المتوسطة', 'فاطمة أحمد',
        '0507654321', 'سالم محمد', '0987654321', 'ذكر', '1980-12-20',
        'لا', '2024-02-01', '0501122334', 'SA9876543210987654321098', ''
      ],
      [
        'الشرقية', 'الدمام', 'الخبر', 'مدرسة الفجر الثانوية', 'عبدالله سالم',
        '0503456789', 'أحمد سالم', '1122334455', 'ذكر', '1990-03-10',
        'نعم', '2024-01-20', '0505566778', 'SA5544332211009988776655', 'في إجازة مرضية'
      ]
    ];

    const csvContent = [headers.join(','), ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\r\n');
    
    // إضافة BOM للترميز العربي الصحيح
    return '\uFEFF' + csvContent;
  }
}