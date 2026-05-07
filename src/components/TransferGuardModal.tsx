import React, { useEffect, useState } from 'react';
import { Guard, School as SchoolType } from '../types';
import { X, ArrowRightLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfirmationMessage } from './ConfirmationMessage';

interface TransferGuardModalProps {
  guard?: Guard | null;
  guards: Guard[];
  schools: SchoolType[];
  onSubmit: (guardId: string, newSchoolId: string, description: string) => Promise<void>;
  onClose: () => void;
}

const PAGE_LIMIT = 50;

export const TransferGuardModal: React.FC<TransferGuardModalProps> = ({
  guard,
  guards: initialGuards,
  schools: initialSchools,
  onSubmit,
  onClose
}) => {
  const [guardOptions, setGuardOptions] = useState<Guard[]>(initialGuards.slice(0, PAGE_LIMIT));
  const [schoolOptions, setSchoolOptions] = useState<SchoolType[]>(initialSchools.slice(0, PAGE_LIMIT));
  const [guardSearchTerm, setGuardSearchTerm] = useState('');
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingGuards, setSearchingGuards] = useState(false);
  const [searchingSchools, setSearchingSchools] = useState(false);

  const [formData, setFormData] = useState({
    guardId: guard?.id || '',
    newSchoolId: '',
    description: ''
  });

  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(guard || null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchAssignedGuards(guardSearchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [guardSearchTerm]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchSchools(schoolSearchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [schoolSearchTerm]);

  useEffect(() => {
    if (guard?.id) {
      loadGuardById(guard.id);
    }
  }, [guard?.id]);

  const mapGuard = (row: any): Guard => ({
    ...row,
    school: Array.isArray(row.school) ? row.school[0] : row.school
  });

  const loadGuardById = async (guardId: string) => {
    const { data, error: guardError } = await supabase
      .from('guards')
      .select(`
        id,
        school_id,
        guard_name,
        civil_id,
        status,
        school:schools(id, school_name, region, governorate)
      `)
      .eq('id', guardId)
      .single();

    if (!guardError && data) {
      setSelectedGuard(mapGuard(data));
      setGuardOptions(prev => prev.some(g => g.id === data.id) ? prev : [mapGuard(data), ...prev]);
    }
  };

  const searchAssignedGuards = async (term: string) => {
    try {
      setSearchingGuards(true);
      setError(null);

      let query = supabase
        .from('guards')
        .select(`
          id,
          school_id,
          guard_name,
          civil_id,
          status,
          school:schools(id, school_name, region, governorate)
        `)
        .not('school_id', 'is', null)
        .order('guard_name')
        .limit(PAGE_LIMIT);

      const cleanTerm = term.trim();
      if (cleanTerm) {
        query = query.or(`guard_name.ilike.%${cleanTerm}%,civil_id.ilike.%${cleanTerm}%`);
      }

      const { data, error: guardsError } = await query;
      if (guardsError) throw guardsError;

      const results = (data || []).map(mapGuard);
      setGuardOptions(selectedGuard && !results.some(g => g.id === selectedGuard.id)
        ? [selectedGuard, ...results]
        : results
      );
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في البحث عن الحراس');
    } finally {
      setSearchingGuards(false);
    }
  };

  const searchSchools = async (term: string) => {
    try {
      setSearchingSchools(true);
      setError(null);

      let query = supabase
        .from('schools')
        .select('id, school_name, region, governorate, principal_name, principal_mobile, status, notes, created_at, updated_at')
        .eq('status', 'نشط')
        .order('school_name')
        .limit(PAGE_LIMIT);

      const cleanTerm = term.trim();
      if (cleanTerm) {
        query = query.or(`school_name.ilike.%${cleanTerm}%,region.ilike.%${cleanTerm}%,governorate.ilike.%${cleanTerm}%`);
      }

      const { data, error: schoolsError } = await query;
      if (schoolsError) throw schoolsError;

      const results = data || [];
      setSchoolOptions(selectedSchool && !results.some(s => s.id === selectedSchool.id)
        ? [selectedSchool, ...results]
        : results
      );
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في البحث عن المدارس');
    } finally {
      setSearchingSchools(false);
    }
  };

  const handleGuardChange = (guardId: string) => {
    const nextGuard = guardOptions.find(g => g.id === guardId) || null;
    setSelectedGuard(nextGuard);
    setFormData(prev => ({ ...prev, guardId }));
    setError(null);
  };

  const handleSchoolChange = (schoolId: string) => {
    const nextSchool = schoolOptions.find(s => s.id === schoolId) || null;
    setSelectedSchool(nextSchool);
    setFormData(prev => ({ ...prev, newSchoolId: schoolId }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guardId || !formData.newSchoolId) {
      setError('يرجى اختيار الحارس والمدرسة الجديدة');
      return;
    }

    if (selectedGuard?.school_id === formData.newSchoolId) {
      setError('الحارس موجود بالفعل في هذه المدرسة');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const description =
        formData.description ||
        `نقل الحارس ${selectedGuard?.guard_name || ''} من ${selectedGuard?.school?.school_name || 'غير محدد'} إلى ${selectedSchool?.school_name || ''}`;

      await onSubmit(formData.guardId, formData.newSchoolId, description);

      setConfirmationText(`تم نقل الحارس ${selectedGuard?.guard_name || ''} بنجاح!`);
      setConfirmationType('success');
      setShowConfirmation(true);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في نقل الحارس';
      setError(errorMessage);
      setConfirmationText(errorMessage);
      setConfirmationType('error');
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">نقل حارس</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اختر الحارس *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={guardSearchTerm}
                onChange={(e) => setGuardSearchTerm(e.target.value)}
                placeholder="ابحث باسم الحارس أو السجل المدني..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              />
              <select
                value={formData.guardId}
                onChange={(e) => handleGuardChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="">
                  {searchingGuards ? 'جاري البحث...' : `اختر الحارس (${guardOptions.length} نتيجة)`}
                </option>
                {guardOptions.map(guardOption => (
                  <option key={guardOption.id} value={guardOption.id}>
                    {guardOption.guard_name} - {guardOption.school?.school_name || '-'} - {guardOption.school?.region || '-'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedGuard && (
            <div className="bg-moe-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-moe-800 mb-2">المعلومات الحالية:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-moe-700 font-medium">الاسم: </span><span className="text-moe-800">{selectedGuard.guard_name}</span></div>
                <div><span className="text-moe-700 font-medium">المدرسة الحالية: </span><span className="text-moe-800">{selectedGuard.school?.school_name || 'غير مرتبط بمدرسة'}</span></div>
                <div><span className="text-moe-700 font-medium">المنطقة: </span><span className="text-moe-800">{selectedGuard.school?.region || '-'}</span></div>
                <div><span className="text-moe-700 font-medium">المحافظة: </span><span className="text-moe-800">{selectedGuard.school?.governorate || '-'}</span></div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المدرسة الجديدة *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={schoolSearchTerm}
                onChange={(e) => setSchoolSearchTerm(e.target.value)}
                placeholder="ابحث باسم المدرسة أو المنطقة أو المحافظة..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              />
              <select
                value={formData.newSchoolId}
                onChange={(e) => handleSchoolChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="">
                  {searchingSchools ? 'جاري البحث...' : `اختر المدرسة الجديدة (${schoolOptions.filter(s => s.id !== selectedGuard?.school_id).length} نتيجة)`}
                </option>
                {schoolOptions
                  .filter(school => school.id !== selectedGuard?.school_id)
                  .map(school => (
                    <option key={school.id} value={school.id}>
                      {school.school_name} - {school.region} - {school.governorate}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {selectedSchool && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">معلومات المدرسة الجديدة:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-green-700 font-medium">اسم المدرسة: </span><span className="text-green-800">{selectedSchool.school_name}</span></div>
                <div><span className="text-green-700 font-medium">المنطقة: </span><span className="text-green-800">{selectedSchool.region}</span></div>
                <div><span className="text-green-700 font-medium">المحافظة: </span><span className="text-green-800">{selectedSchool.governorate}</span></div>
                {selectedSchool.principal_name && (
                  <div><span className="text-green-700 font-medium">المدير/ة: </span><span className="text-green-800">{selectedSchool.principal_name}</span></div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وصف العملية (اختياري)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent resize-none"
              placeholder="أدخل وصف مفصل لعملية النقل..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !formData.guardId || !formData.newSchoolId}
              className="flex-1 bg-moe-600 text-white py-2 px-4 rounded-lg hover:bg-moe-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'جاري النقل...' : 'تأكيد النقل'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </div>

      {showConfirmation && (
        <ConfirmationMessage
          message={confirmationText}
          type={confirmationType}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};
