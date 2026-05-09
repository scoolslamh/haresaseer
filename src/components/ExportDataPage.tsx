import React, { useState, useEffect, useCallback } from 'react';
import { Download, Users, School, CheckSquare, Square, FileSpreadsheet, Filter, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { GuardService } from '../services/guardService';
import { SchoolService } from '../services/schoolService';
import { Guard, School as SchoolType, GuardFilters, GUARD_STATUS_OPTIONS } from '../types';
import { AuthService } from '../services/authService';

// ─── تعريف حقول الحراس ───────────────────────────────────────────────────────
const GUARD_FIELDS = [
  // بيانات الحارس
  { key: 'guard_name',           label: 'اسم الحارس',       group: 'بيانات الحارس',  default: true  },
  { key: 'civil_id',             label: 'السجل المدني',      group: 'بيانات الحارس',  default: true  },
  { key: 'gender',               label: 'الجنس',             group: 'بيانات الحارس',  default: true  },
  { key: 'birth_date',           label: 'تاريخ الميلاد',     group: 'بيانات الحارس',  default: false },
  { key: 'mobile',               label: 'رقم الجوال',        group: 'بيانات الحارس',  default: true  },
  { key: 'iban',                 label: 'الآيبان',           group: 'بيانات الحارس',  default: false },
  { key: 'job_title',            label: 'المسمى الوظيفي',    group: 'بيانات الحارس',  default: false },
  { key: 'rank',                 label: 'المرتبة/الدرجة',    group: 'بيانات الحارس',  default: false },
  { key: 'appointment_category', label: 'فئة التعيين',       group: 'بيانات الحارس',  default: false },
  { key: 'start_date',           label: 'تاريخ المباشرة',    group: 'بيانات الحارس',  default: false },
  { key: 'insurance',            label: 'التأمينات',         group: 'بيانات الحارس',  default: true  },
  { key: 'status',               label: 'الحالة',            group: 'بيانات الحارس',  default: true  },
  { key: 'notes',                label: 'ملاحظات',           group: 'بيانات الحارس',  default: false },
  // بيانات المدرسة
  { key: 'school_name',          label: 'المدرسة',           group: 'بيانات المدرسة', default: true  },
  { key: 'region',               label: 'المنطقة',           group: 'بيانات المدرسة', default: true  },
  { key: 'governorate',          label: 'المحافظة',          group: 'بيانات المدرسة', default: true  },
  { key: 'principal_name',       label: 'المدير/ة',          group: 'بيانات المدرسة', default: false },
  { key: 'principal_mobile',     label: 'جوال المدير',       group: 'بيانات المدرسة', default: false },
];

// ─── تعريف حقول المدارس ──────────────────────────────────────────────────────
const SCHOOL_FIELDS = [
  { key: 'school_name',      label: 'اسم المدرسة',  default: true  },
  { key: 'region',           label: 'المنطقة',       default: true  },
  { key: 'governorate',      label: 'المحافظة',      default: true  },
  { key: 'file_number',      label: 'رقم الملف',     default: false },
  { key: 'principal_name',   label: 'المدير/ة',      default: true  },
  { key: 'principal_mobile', label: 'جوال المدير',   default: false },
  { key: 'status',           label: 'الحالة',        default: false },
  { key: 'guards_count',     label: 'عدد الحراس',    default: true  },
  { key: 'notes',            label: 'ملاحظات',       default: false },
];

const REGIONS = ['عسير', 'جيزان', 'الباحة', 'نجران'];

const defaultGuardFields = new Set(GUARD_FIELDS.filter(f => f.default).map(f => f.key));
const defaultSchoolFields = new Set(SCHOOL_FIELDS.filter(f => f.default).map(f => f.key));

// ─── استخراج قيمة حقل الحارس ─────────────────────────────────────────────────
function guardValue(guard: Guard, key: string): string {
  switch (key) {
    case 'guard_name':           return guard.guard_name || '';
    case 'civil_id':             return guard.civil_id || '';
    case 'gender':               return guard.gender || '';
    case 'birth_date':           return guard.birth_date || '';
    case 'mobile':               return guard.mobile || '';
    case 'iban':                 return guard.iban || '';
    case 'job_title':            return guard.job_title || '';
    case 'rank':                 return guard.rank || '';
    case 'appointment_category': return guard.appointment_category || '';
    case 'start_date':           return guard.start_date || '';
    case 'insurance':            return guard.insurance || '';
    case 'status':               return guard.status || '';
    case 'notes':                return guard.notes || '';
    case 'school_name':          return guard.school?.school_name || '';
    case 'region':               return guard.school?.region || '';
    case 'governorate':          return guard.school?.governorate || '';
    case 'principal_name':       return guard.school?.principal_name || '';
    case 'principal_mobile':     return guard.school?.principal_mobile || '';
    default:                     return '';
  }
}

// ─── استخراج قيمة حقل المدرسة ────────────────────────────────────────────────
function schoolValue(school: SchoolType, key: string): string | number {
  switch (key) {
    case 'school_name':      return school.school_name || '';
    case 'region':           return school.region || '';
    case 'governorate':      return school.governorate || '';
    case 'file_number':      return school.file_number || '';
    case 'principal_name':   return school.principal_name || '';
    case 'principal_mobile': return school.principal_mobile || '';
    case 'status':           return school.status || '';
    case 'guards_count':     return school.guards_count ?? 0;
    case 'notes':            return school.notes || '';
    default:                 return '';
  }
}

export const ExportDataPage: React.FC = () => {
  const [tab, setTab] = useState<'guards' | 'schools'>('guards');

  // حقول مختارة
  const [guardFields,  setGuardFields]  = useState<Set<string>>(new Set(defaultGuardFields));
  const [schoolFields, setSchoolFields] = useState<Set<string>>(new Set(defaultSchoolFields));

  // فلاتر الحراس
  const [guardFilters, setGuardFilters] = useState<GuardFilters>({
    region: 'all', status: 'all', gender: 'all', insurance: 'all',
  });

  // فلاتر المدارس
  const [schoolFilters, setSchoolFilters] = useState<{ region: string; status: string }>({
    region: 'all', status: 'all',
  });

  const [guardCount,  setGuardCount]  = useState<number | null>(null);
  const [schoolCount, setSchoolCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [exportMsg,    setExportMsg]    = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── جلب العدد عند تغيير الفلاتر ─────────────────────────────────────────
  const fetchGuardCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const { totalCount } = await GuardService.getFilteredGuards(guardFilters, 1, 1);
      setGuardCount(totalCount);
    } catch { setGuardCount(null); }
    finally  { setCountLoading(false); }
  }, [guardFilters]);

  const fetchSchoolCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const { totalCount } = await SchoolService.getFilteredSchools(schoolFilters, 1, 1);
      setSchoolCount(totalCount);
    } catch { setSchoolCount(null); }
    finally  { setCountLoading(false); }
  }, [schoolFilters]);

  useEffect(() => { fetchGuardCount();  }, [fetchGuardCount]);
  useEffect(() => { fetchSchoolCount(); }, [fetchSchoolCount]);

  // ─── تصدير الحراس ─────────────────────────────────────────────────────────
  const exportGuards = async () => {
    if (guardFields.size === 0) { setExportMsg({ type: 'error', text: 'يرجى تحديد عمود واحد على الأقل' }); return; }
    setExporting(true); setExportMsg(null);
    try {
      const guards = await GuardService.getGuardsForExport(guardFilters);
      const orderedFields = GUARD_FIELDS.filter(f => guardFields.has(f.key));
      const rows = guards.map(g => {
        const row: Record<string, string> = {};
        orderedFields.forEach(f => { row[f.label] = guardValue(g, f.key); });
        return row;
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = orderedFields.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, 'بيانات الحراس');
      XLSX.writeFile(wb, `بيانات_الحراس_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`);
      setExportMsg({ type: 'success', text: `تم تصدير ${guards.length} سجل بنجاح` });
    } catch (err: any) {
      setExportMsg({ type: 'error', text: err?.message || 'خطأ في التصدير' });
    } finally { setExporting(false); }
  };

  // ─── تصدير المدارس ────────────────────────────────────────────────────────
  const exportSchools = async () => {
    if (schoolFields.size === 0) { setExportMsg({ type: 'error', text: 'يرجى تحديد عمود واحد على الأقل' }); return; }
    setExporting(true); setExportMsg(null);
    try {
      const schools = await SchoolService.getSchoolsForExport(schoolFilters);
      const orderedFields = SCHOOL_FIELDS.filter(f => schoolFields.has(f.key));
      const rows = schools.map(s => {
        const row: Record<string, string | number> = {};
        orderedFields.forEach(f => { row[f.label] = schoolValue(s, f.key); });
        return row;
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = orderedFields.map(f => ({ wch: f.key === 'school_name' ? 35 : 18 }));
      XLSX.utils.book_append_sheet(wb, ws, 'بيانات المدارس');
      XLSX.writeFile(wb, `بيانات_المدارس_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`);
      setExportMsg({ type: 'success', text: `تم تصدير ${schools.length} سجل بنجاح` });
    } catch (err: any) {
      setExportMsg({ type: 'error', text: err?.message || 'خطأ في التصدير' });
    } finally { setExporting(false); }
  };

  // ─── مساعدات الحقول ───────────────────────────────────────────────────────
  const toggleField = (key: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const selectAll   = (fields: typeof GUARD_FIELDS, setter: (s: Set<string>) => void) =>
    setter(new Set(fields.map(f => f.key)));
  const deselectAll = (setter: (s: Set<string>) => void) => setter(new Set());

  // ─── مكون مربع الاختيار ───────────────────────────────────────────────────
  const FieldCheckbox = ({ fieldKey, label, checked, onToggle }: {
    fieldKey: string; label: string; checked: boolean; onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-right ${
        checked
          ? 'bg-moe-50 border-moe-300 text-moe-800 font-medium'
          : 'bg-white border-gray-200 text-gray-600 hover:border-moe-200'
      }`}
    >
      {checked
        ? <CheckSquare className="w-4 h-4 text-moe-600 flex-shrink-0" />
        : <Square      className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      {label}
    </button>
  );

  // ─── مكون الفلاتر ─────────────────────────────────────────────────────────
  const SelectFilter = ({ label, value, onChange, options }: {
    label: string; value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-moe-300 focus:border-moe-400 bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const count   = tab === 'guards' ? guardCount : schoolCount;
  const fields  = tab === 'guards' ? guardFields : schoolFields;
  const canExport = AuthService.hasSpecificPermission('guards.export') ||
                    AuthService.hasSpecificPermission('admin') ||
                    AuthService.getCurrentUser()?.role === 'admin';

  // تجميع حقول الحراس حسب المجموعة
  const guardGroups = Array.from(new Set(GUARD_FIELDS.map(f => f.group)));

  return (
    <div className="space-y-6">
      {/* ─── العنوان ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-8 h-8 text-moe-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تصدير البيانات</h1>
          <p className="text-gray-500 text-sm">تصدير بيانات الحراس والمدارس بصيغة Excel مع التحكم في الأعمدة والفلاتر</p>
        </div>
      </div>

      {/* ─── التبويبات ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setTab('guards'); setExportMsg(null); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'guards'
              ? 'bg-white text-moe-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          بيانات الحراس
        </button>
        <button
          onClick={() => { setTab('schools'); setExportMsg(null); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'schools'
              ? 'bg-white text-moe-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <School className="w-4 h-4" />
          بيانات المدارس
        </button>
      </div>

      {/* ─── الفلاتر ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-moe-600" />
          <h2 className="font-semibold text-gray-700">فلترة البيانات</h2>
          <span className="text-xs text-gray-400">(اختياري — الكل افتراضياً)</span>
        </div>

        {tab === 'guards' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SelectFilter
              label="المنطقة"
              value={guardFilters.region || 'all'}
              onChange={v => setGuardFilters(p => ({ ...p, region: v }))}
              options={[{ value: 'all', label: 'جميع المناطق' }, ...REGIONS.map(r => ({ value: r, label: r }))]}
            />
            <SelectFilter
              label="الجنس"
              value={guardFilters.gender || 'all'}
              onChange={v => setGuardFilters(p => ({ ...p, gender: v }))}
              options={[{ value: 'all', label: 'الجميع' }, { value: 'ذكر', label: 'ذكر' }, { value: 'أنثى', label: 'أنثى' }]}
            />
            <SelectFilter
              label="الحالة"
              value={guardFilters.status || 'all'}
              onChange={v => setGuardFilters(p => ({ ...p, status: v }))}
              options={[{ value: 'all', label: 'جميع الحالات' }, ...GUARD_STATUS_OPTIONS.map(s => ({ value: s, label: s }))]}
            />
            <SelectFilter
              label="التأمينات"
              value={guardFilters.insurance || 'all'}
              onChange={v => setGuardFilters(p => ({ ...p, insurance: v }))}
              options={[{ value: 'all', label: 'الجميع' }, { value: 'يصرف بدل', label: 'يصرف بدل' }, { value: 'لا يصرف', label: 'لا يصرف' }]}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SelectFilter
              label="المنطقة"
              value={schoolFilters.region}
              onChange={v => setSchoolFilters(p => ({ ...p, region: v }))}
              options={[{ value: 'all', label: 'جميع المناطق' }, ...REGIONS.map(r => ({ value: r, label: r }))]}
            />
            <SelectFilter
              label="الحالة"
              value={schoolFilters.status}
              onChange={v => setSchoolFilters(p => ({ ...p, status: v }))}
              options={[{ value: 'all', label: 'جميع الحالات' }, { value: 'نشط', label: 'نشط' }, { value: 'غير نشط', label: 'غير نشط' }]}
            />
          </div>
        )}
      </div>

      {/* ─── اختيار الأعمدة ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">الأعمدة المراد تصديرها</h2>
          <div className="flex gap-2">
            <button
              onClick={() => tab === 'guards'
                ? selectAll(GUARD_FIELDS,  setGuardFields)
                : selectAll(SCHOOL_FIELDS, setSchoolFields)}
              className="text-xs px-3 py-1.5 bg-moe-50 text-moe-700 rounded-lg hover:bg-moe-100 transition-colors"
            >
              تحديد الكل
            </button>
            <button
              onClick={() => tab === 'guards' ? deselectAll(setGuardFields) : deselectAll(setSchoolFields)}
              className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              إلغاء الكل
            </button>
          </div>
        </div>

        {tab === 'guards' ? (
          <div className="space-y-4">
            {guardGroups.map(group => (
              <div key={group}>
                <p className="text-xs font-semibold text-moe-600 mb-2 pb-1 border-b border-moe-100">
                  {group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {GUARD_FIELDS.filter(f => f.group === group).map(f => (
                    <FieldCheckbox
                      key={f.key}
                      fieldKey={f.key}
                      label={f.label}
                      checked={guardFields.has(f.key)}
                      onToggle={() => toggleField(f.key, guardFields, setGuardFields)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {SCHOOL_FIELDS.map(f => (
              <FieldCheckbox
                key={f.key}
                fieldKey={f.key}
                label={f.label}
                checked={schoolFields.has(f.key)}
                onToggle={() => toggleField(f.key, schoolFields, setSchoolFields)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── شريط التصدير ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* معلومات التصدير */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              {countLoading
                ? <RefreshCw className="w-4 h-4 animate-spin text-moe-500" />
                : <span className="inline-flex items-center gap-1 bg-moe-50 text-moe-700 px-3 py-1 rounded-full font-medium">
                    {count !== null ? count.toLocaleString('ar-SA') : '—'} سجل
                  </span>}
            </div>
            <span className="text-gray-400">|</span>
            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-3 py-1 rounded-full">
              {fields.size} عمود محدد
            </span>
          </div>

          {/* زر التصدير */}
          {canExport ? (
            <button
              onClick={tab === 'guards' ? exportGuards : exportSchools}
              disabled={exporting || fields.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-moe-700 text-white rounded-lg hover:bg-moe-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {exporting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> جاري التصدير...</>
              ) : (
                <><Download className="w-4 h-4" /> تصدير Excel</>
              )}
            </button>
          ) : (
            <p className="text-sm text-red-500">ليس لديك صلاحية التصدير</p>
          )}
        </div>

        {/* رسالة النتيجة */}
        {exportMsg && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            exportMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {exportMsg.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportDataPage;
