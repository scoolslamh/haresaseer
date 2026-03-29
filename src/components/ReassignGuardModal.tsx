import React, { useState, useEffect } from 'react';
import { Guard, School as SchoolType } from '../types';
import { X, RotateCcw } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../lib/supabase';
import { ConfirmationMessage } from './ConfirmationMessage';

interface ReassignGuardModalProps {
  guards: Guard[];
  schools: SchoolType[];
  onSubmit: (guardId: string, newSchoolId: string, description: string) => Promise<void>;
  onClose: () => void;
}

export const ReassignGuardModal: React.FC<ReassignGuardModalProps> = ({
  guards: initialGuards,
  schools: initialSchools,
  onSubmit,
  onClose
}) => {
  const [allUnassignedGuards, setAllUnassignedGuards] = useState<Guard[]>(initialGuards);
  const [allSchools, setAllSchools] = useState<SchoolType[]>(initialSchools);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    guardId: '',
    newSchoolId: '',
    description: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 بدء تحميل جميع بيانات إعادة التوجيه...');

      const pageSize = 1000;

      let allUnassignedGuardsData: Guard[] = [];
      let page = 0;

      while (true) {
        const { data: pageData, error: guardsError } = await supabase
          .from('guards')
          .select(`
            id,
            school_id,
            guard_name,
            civil_id,
            gender,
            birth_date,
            insurance,
            start_date,
            mobile,
            iban,
            file,
            status,
            notes,
            created_at,
            updated_at
          `)
          .is('school_id', null)
          .order('guard_name')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (guardsError) {
          console.error('❌ خطأ في جلب الحراس غير المسندين:', guardsError);
          throw guardsError;
        }

        if (!pageData || pageData.length === 0) break;

        allUnassignedGuardsData = [...allUnassignedGuardsData, ...pageData];
        page++;

        if (pageData.length < pageSize) break;
      }

      let allSchoolsData: SchoolType[] = [];
      page = 0;

      while (true) {
        const { data: pageData, error: schoolsError } = await supabase
          .from('schools')
          .select('*')
          .eq('status', 'نشط')
          .order('school_name')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (schoolsError) {
          console.error('❌ خطأ في جلب المدارس:', schoolsError);
          throw schoolsError;
        }

        if (!pageData || pageData.length === 0) break;

        allSchoolsData = [...allSchoolsData, ...pageData];
        page++;

        if (pageData.length < pageSize) break;
      }

      console.log(
        `✅ تم تحميل ${allUnassignedGuardsData.length} حارس غير مسند و ${allSchoolsData.length} مدرسة`
      );

      setAllUnassignedGuards(allUnassignedGuardsData);
      setAllSchools(allSchoolsData);
    } catch (err: any) {
      console.error('خطأ في تحميل البيانات:', err);
      setError('خطأ في تحميل جميع بيانات الحراس والمدارس');
      setAllUnassignedGuards(initialGuards);
      setAllSchools(initialSchools);
    } finally {
      setLoading(false);
    }
  };

  const selectedGuard = allUnassignedGuards.find(g => g.id === formData.guardId);
  const selectedSchool = allSchools.find(s => s.id === formData.newSchoolId);

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
        `إعادة توجيه الحارس ${selectedGuard?.guard_name} إلى ${selectedSchool?.school_name}`;
        

      await onSubmit(formData.guardId, formData.newSchoolId, description);

      setConfirmationText(`تم إعادة توجيه الحارس ${selectedGuard?.guard_name} بنجاح!`);
      setConfirmationType('success');
      setShowConfirmation(true);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : 'خطأ في إعادة توجيه الحارس';
      setError(errorMessage);
      setConfirmationText(errorMessage);
      setConfirmationType('error');
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">إعادة توجيه حارس</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
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
              <strong>ملاحظة:</strong> هذه العملية مخصصة للحراس غير المرتبطين بمدرسة حالياً
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر الحارس *
            </label>
            <SearchableSelect
              options={[
                { id: '', label: 'اختر الحارس' },
                ...allUnassignedGuards.map(guard => ({
                  id: guard.id,
                  label: guard.guard_name,
                  subtitle: `الحالة: ${guard.status}`
                }))
              ]}
              value={formData.guardId}
              onChange={(value) =>
                handleChange({ target: { name: 'guardId', value } } as React.ChangeEvent<
                  HTMLSelectElement
                >)
              }
              placeholder="ابحث عن الحارس..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              name="guardId"
            />
          </div>

          {selectedGuard && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-2">معلومات الحارس:</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-purple-700 font-medium">الاسم: </span>
                  <span className="text-purple-800">{selectedGuard.guard_name}</span>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">الحالة: </span>
                  <span className="text-purple-800">{selectedGuard.status}</span>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">المدرسة الحالية: </span>
                  <span className="text-purple-800">غير مرتبط</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المدرسة الجديدة *
            </label>
            <SearchableSelect
              options={[
                { id: '', label: 'اختر المدرسة' },
                ...allSchools.map(school => ({
                  id: school.id,
                  label: school.school_name,
                  subtitle: `${school.region} - ${school.governorate}`
                }))
              ]}
              value={formData.newSchoolId}
              onChange={(value) =>
                handleChange({ target: { name: 'newSchoolId', value } } as React.ChangeEvent<
                  HTMLSelectElement
                >)
              }
              placeholder="ابحث عن المدرسة..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              name="newSchoolId"
            />
          </div>

          {selectedSchool && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">معلومات المدرسة الجديدة:</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-green-700 font-medium">اسم المدرسة: </span>
                  <span className="text-green-800">{selectedSchool.school_name}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">المنطقة: </span>
                  <span className="text-green-800">{selectedSchool.region}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">المحافظة: </span>
                  <span className="text-green-800">{selectedSchool.governorate}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف العملية (اختياري)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="أدخل وصف مفصل لعملية إعادة التوجيه..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
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