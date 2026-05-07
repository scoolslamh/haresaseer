import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  MapPin,
  User,
  Phone,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { School } from '../types';
import { DashboardService } from '../services/dashboardService';

interface SchoolsWithoutGuardsModalProps {
  onClose: () => void;
  onAddGuard?: (schoolId: string) => void;
}

type SortField = 'school_name' | 'region' | 'governorate' | 'principal_name';
type SortDir   = 'asc' | 'desc';

const REGIONS = ['عسير', 'جيزان', 'الباحة', 'نجران'] as const;

export const SchoolsWithoutGuardsModal: React.FC<SchoolsWithoutGuardsModalProps> = ({
  onClose,
  onAddGuard,
}) => {
  const [schools, setSchools]           = useState<School[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortField, setSortField]       = useState<SortField>('school_name');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');

  useEffect(() => { loadSchools(); }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      setSchools(await DashboardService.getSchoolsWithoutGuards());
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...schools];

    if (selectedRegion !== 'all') {
      list = list.filter(s => s.region === selectedRegion);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(s =>
        s.school_name.toLowerCase().includes(q) ||
        s.governorate.toLowerCase().includes(q) ||
        (s.principal_name ?? '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const va = (a[sortField] ?? '').toString();
      const vb = (b[sortField] ?? '').toString();
      return sortDir === 'asc'
        ? va.localeCompare(vb, 'ar')
        : vb.localeCompare(va, 'ar');
    });

    return list;
  }, [schools, searchTerm, selectedRegion, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1 opacity-50">
      <ChevronUp   className={`w-3 h-3 -mb-1 ${sortField === field && sortDir === 'asc'  ? 'opacity-100 text-moe-600' : ''}`} />
      <ChevronDown className={`w-3 h-3      ${sortField === field && sortDir === 'desc' ? 'opacity-100 text-moe-600' : ''}`} />
    </span>
  );

  /* ---- جدول المناطق ---- */
  const regionCounts = useMemo(() =>
    REGIONS.map(r => ({ region: r, count: schools.filter(s => s.region === r).length })),
    [schools]
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* ---- Header ---- */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">المدارس بدون حراس</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {schools.length} مدرسة إجمالاً
                {filtered.length !== schools.length && ` · ${filtered.length} ظاهرة`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSchools}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-moe-600 text-white rounded-lg hover:bg-moe-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ---- ملخص المناطق ---- */}
        <div className="px-6 py-3 border-b bg-red-50 shrink-0">
          <div className="flex flex-wrap gap-3">
            {regionCounts.map(({ region, count }) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(selectedRegion === region ? 'all' : region)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedRegion === region
                    ? 'bg-red-600 text-white border-red-600'
                    : count > 0
                    ? 'bg-white text-red-700 border-red-300 hover:bg-red-100'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {region}
                <span className={`font-bold ${selectedRegion === region ? 'text-white' : 'text-red-600'}`}>
                  {count}
                </span>
              </button>
            ))}
            {selectedRegion !== 'all' && (
              <button
                onClick={() => setSelectedRegion('all')}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                إظهار الكل
              </button>
            )}
          </div>
        </div>

        {/* ---- بحث ---- */}
        <div className="px-6 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المدرسة أو المحافظة أو المدير..."
              className="w-full pr-10 pl-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ---- خطأ ---- */}
        {error && (
          <div className="mx-6 mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ---- الجدول (قابل للتمرير) ---- */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-moe-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Building2 className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium">
                {searchTerm || selectedRegion !== 'all' ? 'لا توجد نتائج' : 'جميع المدارس لديها حراس!'}
              </p>
              {(searchTerm || selectedRegion !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setSelectedRegion('all'); }}
                  className="mt-2 text-xs text-moe-600 underline"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="border-b">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-8">#</th>
                  <th
                    className="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => toggleSort('school_name')}
                  >
                    <span className="flex items-center gap-1">
                      اسم المدرسة <SortIcon field="school_name" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => toggleSort('region')}
                  >
                    <span className="flex items-center gap-1">
                      المنطقة <SortIcon field="region" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => toggleSort('governorate')}
                  >
                    <span className="flex items-center gap-1">
                      المحافظة <SortIcon field="governorate" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => toggleSort('principal_name')}
                  >
                    <span className="flex items-center gap-1">
                      المدير/ة <SortIcon field="principal_name" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">الجوال</th>
                  {onAddGuard && (
                    <th className="px-4 py-3 font-medium text-gray-600 text-center whitespace-nowrap">إجراء</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((school, idx) => (
                  <tr key={school.id} className="hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="font-medium text-gray-800">{school.school_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                        <MapPin className="w-3 h-3" />
                        {school.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{school.governorate || '-'}</td>
                    <td className="px-4 py-3">
                      {school.principal_name ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-700">{school.principal_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">غير محدد</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {school.principal_mobile ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-700 font-mono text-xs" dir="ltr">
                            {school.principal_mobile}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    {onAddGuard && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { onAddGuard(school.id); onClose(); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          إضافة حارس
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="border-t bg-gray-50 px-6 py-3 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>
            عرض <strong>{filtered.length}</strong> من أصل <strong>{schools.length}</strong> مدرسة بدون حراس
          </span>
          <span>آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}</span>
        </div>

      </div>
    </div>
  );
};
