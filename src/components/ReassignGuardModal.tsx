import React, { useEffect, useState } from 'react';
import { Guard, School as SchoolType } from '../types';
import { X, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfirmationMessage } from './ConfirmationMessage';

interface ReassignGuardModalProps {
  guards: Guard[];
  schools: SchoolType[];
  onSubmit: (guardId: string, newSchoolId: string, description: string) => Promise<void>;
  onClose: () => void;
}

const PAGE_LIMIT = 50;

export const ReassignGuardModal: React.FC<ReassignGuardModalProps> = ({
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
    guardId: '',
    newSchoolId: '',
    description: ''
  });

  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchUnassignedGuards(guardSearchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [guardSearchTerm]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchSchools(schoolSearchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [schoolSearchTerm]);

  const searchUnassignedGuards = async (term: string) => {
    try {
      setSearchingGuards(true);
      setError(null);

      let query = supabase
        .from('guards')
        .select('id, school_id, guard_name, civil_id, status')
        .is('school_id', null)
        .order('guard_name')
        .limit(PAGE_LIMIT);

      const cleanTerm = term.trim();
      if (cleanTerm) {
        query = query.or(`guard_name.ilike.%${cleanTerm}%,civil_id.ilike.%${cleanTerm}%`);
      }

      const { data, error: guardsError } = await query;
      if (guardsError) throw guardsError;

      const results = (data || []) as Guard[];
      setGuardOptions(selectedGuard && !results.some(g => g.id === selectedGuard.id)
        ? [selectedGuard, ...results]
        : results
      );
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في البحث عن الحراس غير المسندين');
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
      setError('يرجى اختيار الحارس والمدرسة');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const description =
        formData.description ||
        `إعادة توجيه الحارس ${selectedGuard?.guard_name || ''} إلى ${selectedSchool?.school_name || ''}`;

      await onSubmit(formData.guardId, formData.newSchoolId, description);

      setConfirmationText(`تم إعادة توجيه الحارس ${selectedGuard?.guard_name || ''} بنجاح!`);
      setConfirmationType('success');
      setShowConfirmation(true);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إعادة توجيه الحارس';
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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">إعادة توجيه حارس</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-moe-50 p-3 rounded-lg">
            <p className="text-moe-800 text-sm">
              <strong>ملاحظة:</strong> هذه العملية مخصصة للحراس غير المرتبطين بمدرسة حاليا
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اختر الحارس *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={guardSearchTerm}
                onChange={(e) => setGuardSearchTerm(e.target.value)}
                placeholder="ابحث باسم الحارس أو السجل المدني..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <select
                value={formData.guardId}
                onChange={(e) => handleGuardChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">
                  {searchingGuards ? 'جاري البحث...' : `اختر الحارس (${guardOptions.length} نتيجة)`}
                </option>
                {guardOptions.map(guard => (
                  <option key={guard.id} value={guard.id}>
                    {guard.guard_name} - {guard.status || '-'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedGuard && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-2">معلومات الحارس:</h3>
              <div className="text-sm space-y-1">
                <div><span className="text-purple-700 font-medium">الاسم: </span><span className="text-purple-800">{selectedGuard.guard_name}</span></div>
                <div><span className="text-purple-700 font-medium">الحالة: </span><span className="text-purple-800">{selectedGuard.status}</span></div>
                <div><span className="text-purple-700 font-medium">المدرسة الحالية: </span><span className="text-purple-800">غير مرتبط</span></div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <select
                value={formData.newSchoolId}
                onChange={(e) => handleSchoolChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">
                  {searchingSchools ? 'جاري البحث...' : `اختر المدرسة (${schoolOptions.length} نتيجة)`}
                </option>
                {schoolOptions.map(school => (
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
              <div className="text-sm space-y-1">
                <div><span className="text-green-700 font-medium">اسم المدرسة: </span><span className="text-green-800">{selectedSchool.school_name}</span></div>
                <div><span className="text-green-700 font-medium">المنطقة: </span><span className="text-green-800">{selectedSchool.region}</span></div>
                <div><span className="text-green-700 font-medium">المحافظة: </span><span className="text-green-800">{selectedSchool.governorate}</span></div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وصف العملية (اختياري)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="أدخل وصف مفصل لعملية إعادة التوجيه..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors" disabled={loading}>
              إلغاء
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50" disabled={loading || !formData.guardId || !formData.newSchoolId}>
              {loading ? 'جاري التنفيذ...' : 'تأكيد إعادة التوجيه'}
            </button>
          </div>
        </form>

        {showConfirmation && (
          <ConfirmationMessage
            type={confirmationType}
            message={confirmationText}
            onClose={() => setShowConfirmation(false)}
          />
        )}
      </div>
    </div>
  );
};
