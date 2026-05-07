import React, { useState } from 'react';
import { useEffect } from 'react';
import { ViolationForm, Guard } from '../types';
import { X, AlertTriangle, Save, User, Calendar, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SearchableSelect } from './SearchableSelect';
import { ConfirmationMessage } from './ConfirmationMessage';
import { OperationService } from '../services/operationService';

interface AddViolationModalProps {
  guards: Guard[]; // للعرض الأولي
  onSubmit: (data: ViolationForm) => Promise<void>;
  onClose: () => void;
}

export const AddViolationModal: React.FC<AddViolationModalProps> = ({
  guards: initialGuards,
  onSubmit,
  onClose
}) => {
  const [allGuards, setAllGuards] = useState<Guard[]>(initialGuards);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<ViolationForm>({
    guard_id: '',
    violation_type: 'إنذار',
    violation_date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');

  // تحميل جميع الحراس عند فتح المودال
  useEffect(() => {
    loadAllGuards();
  }, []);

  const loadAllGuards = async () => {
    try {
      setLoading(true);
      setError(null);

      const pageSize = 1000;
      let page = 0;
      const allGuardsData: Guard[] = [];

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
            job_title,
            rank,
            appointment_category,
            status,
            notes,
            created_at,
            updated_at,
            school:schools(id, school_name, region, governorate)
          `)
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('guard_name');

        if (guardsError) throw guardsError;
        if (!pageData || pageData.length === 0) break;

        allGuardsData.push(...(pageData as unknown as Guard[]));
        if (pageData.length < pageSize) break;
        page++;
      }

      setAllGuards(allGuardsData);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
      setAllGuards(initialGuards);
    } finally {
      setLoading(false);
    }
  };

  const selectedGuard = allGuards.find(g => g.id === formData.guard_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guard_id || !formData.description.trim()) {
      setError('يرجى اختيار الحارس وإدخال وصف المخالفة');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 بدء إضافة مخالفة:', formData);
      await onSubmit(formData);
      console.log('✅ تم إضافة المخالفة بنجاح');
      
      // تسجيل العملية في سجل العمليات
      try {
        const description = `تم إضافة ${formData.violation_type} للحارس ${selectedGuard?.guard_name}: ${formData.description}`;
        console.log('🔄 بدء تسجيل العملية في السجل:', { operationType: 'إضافة مخالفة', description });
        await OperationService.logOperation('إضافة مخالفة', description, formData.guard_id);
        console.log('✅ تم تسجيل العملية في السجل بنجاح');
      } catch (operationError) {
        console.error('❌ خطأ في تسجيل العملية:', operationError);
        // لا نرمي الخطأ هنا لأن العملية الأساسية نجحت
      }
      
      // عرض رسالة التأكيد
      setConfirmationText('تم إضافة المخالفة بنجاح!');
      setConfirmationType('success');
      setShowConfirmation(true);
      
      // إغلاق النموذج بعد ثانيتين
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('❌ خطأ في إضافة المخالفة:', err);
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إضافة المخالفة';
      setError(errorMessage);
      setConfirmationText(errorMessage);
      setConfirmationType('error');
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'شكوى': return 'text-yellow-800 bg-yellow-100';
      case 'إنذار': return 'text-orange-800 bg-orange-100';
      case 'مخالفة': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h2 className="text-lg font-bold text-gray-800">إضافة مخالفة</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

          {/* اختيار الحارس */}
          <div className="bg-moe-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              اختيار الحارس
            </h3>
            <SearchableSelect
              options={[
                { id: '', label: 'اختر الحارس' },
                ...allGuards.map(guard => ({
                  id: guard.id,
                  label: guard.guard_name,
                  subtitle: `${guard.school?.school_name || 'غير مرتبط بمدرسة'} - ${guard.status} - ${guard.civil_id || 'بدون سجل مدني'}`
                }))
              ]}
              value={formData.guard_id}
              onChange={(value) => handleChange({ target: { name: 'guard_id', value } } as any)}
              placeholder="ابحث بالاسم، المدرسة، السجل المدني، الحالة..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
              name="guard_id"
            />

            {/* معلومات الحارس المختار */}
            {selectedGuard && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <h4 className="font-medium text-gray-800 mb-2">معلومات الحارس:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">الاسم: </span>
                    <span className="text-gray-800 font-medium">{selectedGuard.guard_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">المدرسة: </span>
                    <span className="text-gray-800">{selectedGuard.school?.school_name || 'غير مرتبط'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">الحالة: </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedGuard.status === 'على رأس العمل'
                        ? 'bg-green-100 text-green-800'
                        : selectedGuard.status === 'مكلف داخلي'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedGuard.status === 'إيقاف الراتب مؤقتاً' || selectedGuard.status === 'مكفوف اليد'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedGuard.status}
                    </span>
                  </div>
                  {selectedGuard.mobile && (
                    <div>
                      <span className="text-gray-600">الجوال: </span>
                      <span className="text-gray-800" dir="ltr">{selectedGuard.mobile}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* تفاصيل المخالفة */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تفاصيل المخالفة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع المخالفة *
                </label>
                <select
                  name="violation_type"
                  value={formData.violation_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="شكوى">شكوى</option>
                  <option value="إنذار">إنذار</option>
                  <option value="مخالفة">مخالفة</option>
                </select>
                
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getViolationColor(formData.violation_type)}`}>
                    <AlertTriangle className="w-3 h-3" />
                    {formData.violation_type}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ المخالفة *
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    name="violation_date"
                    value={formData.violation_date}
                    onChange={handleChange}
                    required
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف المخالفة *
              </label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  placeholder="أدخل وصف مفصل للمخالفة..."
                />
              </div>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">تاريخ الإضافة:</span>
              <span className="text-gray-800">{new Date().toLocaleDateString('ar-SA')}</span>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'جاري الإضافة...' : 'إضافة المخالفة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
      
      {/* رسالة التأكيد */}
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