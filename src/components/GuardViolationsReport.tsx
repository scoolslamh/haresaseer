import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Search, User, AlertTriangle,
  FileText, Download, RefreshCw, Calendar,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ViolationService } from '../services/violationService';
import { ExportService } from '../services/exportService';
import { Violation } from '../types';
import { normalizeArabicText, escapeLikePattern } from '../utils/arabicUtils';

interface GuardOption {
  id: string;
  guard_name: string;
  civil_id: string;
  school: { school_name: string } | null;
}

interface Props {
  onClose: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  'شكوى':   'bg-yellow-100 text-yellow-800',
  'إنذار':  'bg-orange-100 text-orange-800',
  'مخالفة': 'bg-red-100 text-red-800',
};

const TYPE_ICON: Record<string, string> = {
  'شكوى': '⚠️', 'إنذار': '🔶', 'مخالفة': '🔴',
};

export const GuardViolationsReport: React.FC<Props> = ({ onClose }) => {
  const [search, setSearch]               = useState('');
  const [results, setResults]             = useState<GuardOption[]>([]);
  const [searching, setSearching]         = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<GuardOption | null>(null);
  const [violations, setViolations]       = useState<Violation[]>([]);
  const [loadingV, setLoadingV]           = useState(false);
  const [exporting, setExporting]         = useState(false);

  const searchGuards = useCallback(async (term: string) => {
    if (term.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const raw        = escapeLikePattern(term.trim());
      const normalized = escapeLikePattern(normalizeArabicText(term.trim()));
      const orFilter   = raw !== normalized
        ? `guard_name.ilike.%${raw}%,guard_name.ilike.%${normalized}%`
        : `guard_name.ilike.%${raw}%`;

      const { data } = await supabase
        .from('guards')
        .select('id, guard_name, civil_id, school:schools(school_name)')
        .or(orFilter)
        .limit(10);
      setResults((data || []) as GuardOption[]);
    } finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchGuards(search), 300);
    return () => clearTimeout(t);
  }, [search, searchGuards]);

  const handleSelect = async (guard: GuardOption) => {
    setSelectedGuard(guard);
    setResults([]);
    setSearch(guard.guard_name);
    setLoadingV(true);
    try {
      const data = await ViolationService.getViolationsByGuard(guard.id);
      setViolations(data);
    } finally { setLoadingV(false); }
  };

  const stats = {
    total:      violations.length,
    complaints: violations.filter(v => v.violation_type === 'شكوى').length,
    warnings:   violations.filter(v => v.violation_type === 'إنذار').length,
    violations: violations.filter(v => v.violation_type === 'مخالفة').length,
  };

  const exportExcel = async () => {
    if (!selectedGuard || !violations.length) return;
    setExporting(true);
    try { await ExportService.exportViolationsToExcel(violations, `مخالفات_${selectedGuard.guard_name}`); }
    finally { setExporting(false); }
  };

  const exportPDF = async () => {
    if (!selectedGuard || !violations.length) return;
    setExporting(true);
    try { await ExportService.exportViolationsToPDF(violations, `مخالفات الحارس: ${selectedGuard.guard_name}`); }
    finally { setExporting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-bold text-gray-800">تقرير مخالفات الحارس</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ابحث عن الحارس باسمه
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); if (selectedGuard) { setSelectedGuard(null); setViolations([]); } }}
                placeholder="اكتب اسم الحارس للبحث..."
                className="w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 text-sm"
              />
              {searching && (
                <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}

              {/* Dropdown */}
              {results.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto">
                  {results.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleSelect(g)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-right border-b last:border-b-0 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-moe-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-moe-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{g.guard_name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {g.school?.school_name || 'غير مسند'} — {g.civil_id}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Guard card */}
          {selectedGuard && (
            <div className="bg-moe-50 rounded-xl p-4 flex items-center gap-4 border border-moe-100">
              <div className="w-12 h-12 rounded-full bg-moe-200 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-moe-700" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-base">{selectedGuard.guard_name}</p>
                <p className="text-sm text-gray-500">
                  {selectedGuard.school?.school_name || 'غير مسند'}&nbsp;—&nbsp;{selectedGuard.civil_id}
                </p>
              </div>
            </div>
          )}

          {/* Violations content */}
          {selectedGuard && (
            loadingV ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="w-7 h-7 animate-spin text-red-400" />
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'الإجمالي', value: stats.total,      cls: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200'     },
                    { label: 'شكاوى',   value: stats.complaints,  cls: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
                    { label: 'إنذارات', value: stats.warnings,    cls: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
                    { label: 'مخالفات', value: stats.violations,  cls: 'text-red-600',    bg: 'bg-red-50 border-red-200'       },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border`}>
                      <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Table or empty */}
                {violations.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-25" />
                    <p className="font-medium">لا توجد مخالفات مسجّلة لهذا الحارس</p>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">النوع</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">التاريخ</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">الوصف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {violations.map(v => (
                          <tr key={v.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLOR[v.violation_type] || 'bg-gray-100 text-gray-700'}`}>
                                <span>{TYPE_ICON[v.violation_type]}</span>
                                {v.violation_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(v.violation_date).toLocaleDateString('ar-SA')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{v.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Export */}
                {violations.length > 0 && (
                  <div className="flex justify-end gap-3 pt-1">
                    <button onClick={exportExcel} disabled={exporting}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                      <Download className="w-4 h-4" />
                      {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
                    </button>
                    <button onClick={exportPDF} disabled={exporting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
                      <Download className="w-4 h-4" />
                      {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};
