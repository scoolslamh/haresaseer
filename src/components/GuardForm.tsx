import React, { useState, useEffect } from 'react';
import { Guard, GuardForm as GuardFormType, School } from '../types';
import { X, Save, User } from 'lucide-react';
import { ConfirmationMessage } from './ConfirmationMessage';
import { OperationService } from '../services/operationService';

interface GuardFormProps {
  guard?: Guard;
  schools: School[];
  onSubmit: (data: GuardFormType) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const GuardForm: React.FC<GuardFormProps> = ({
  guard,
  schools,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<GuardFormType>({
    school_id: null,
    guard_name: '',
    civil_id: '',
    gender: '',
    birth_date: '',
    insurance: '',
    start_date: new Date().toISOString().split('T')[0],
    mobile: '',
    iban: '',
    file: '',
    status: 'على رأس العمل',
    notes: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (guard) {
      setFormData({
        school_id: guard.school_id,
        guard_name: guard.guard_name,
        civil_id: guard.civil_id,
        gender: guard.gender,
        birth_date: guard.birth_date,
        insurance: guard.insurance,
        start_date: guard.start_date,
        mobile: guard.mobile,
        iban: guard.iban,
        file: guard.file,
        status: guard.status,
        notes: guard.notes
      });
    }
  }, [guard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🔄 بدء حفظ الحارس:', { isEditing: !!guard, formData });
      const result = await onSubmit(formData);
      console.log('✅ تم حفظ الحارس بنجاح');
      
      // تسجيل العملية في سجل العمليات
      try {
        const operationType = guard ? 'تعديل بيانات' : 'إضافة حارس';
        const description = guard
          ? `تم تعديل بيانات الحارس: ${formData.guard_name}`
          : `تم إضافة حارس جديد: ${formData.guard_name}`;
        await OperationService.logOperation(operationType, description);
      } catch (operationError) {
        // لا نرمي الخطأ هنا لأن العملية الأساسية نجحت
      }
      // الإغلاق فوراً — الإشعار يعرضه المكوّن الأب
      onCancel();
    } catch (err: any) {
      console.error('❌ خطأ في حفظ الحارس:', err);
      const errorMessage = err instanceof Error ? err.message : (guard ? 'خطأ في تحديث الحارس' : 'خطأ في إضافة الحارس');
      setConfirmationText(errorMessage);
      setConfirmationType('error');
      setShowConfirmation(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? (name === 'school_id' ? null : '') : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">
              {guard ? 'تعديل بيانات الحارس' : 'إضافة حارس جديد'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* معلومات أساسية */}
          <div className="bg-moe-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الحارس *</label>
                <input
                  type="text"
                  name="guard_name"
                  value={formData.guard_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="أدخل اسم الحارس"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المدرسة</label>
                <select
                  name="school_id"
                  value={formData.school_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                >
                  <option value="">اختر المدرسة</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.school_name} - {school.region}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* المعلومات الشخصية */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">المعلومات الشخصية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السجل المدني</label>
                <input
                  type="text"
                  name="civil_id"
                  value={formData.civil_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="أدخل السجل المدني"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الملف</label>
                <input
                  type="text"
                  name="file"
                  value={formData.file}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="أدخل رقم أو اسم الملف (اختياري)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الجنس</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                >
                  <option value="">اختر الجنس</option>
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الميلاد</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التأمينات</label>
                <select
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                >
                  <option value="">اختر حالة التأمين</option>
                  <option value="نعم">نعم</option>
                  <option value="لا">لا</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ المباشرة</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                >
                  <option value="على رأس العمل">على رأس العمل</option>
                  <option value="منقطع">منقطع</option>
                  <option value="مبعد عن المدارس">مبعد</option>
                  <option value="إجازة">إجازة</option>
                </select>
              </div>
            </div>
          </div>

          {/* معلومات الاتصال والمالية */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات الاتصال والمالية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="05xxxxxxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الآيبان</label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="SA0000000000000000000000"
                />
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent resize-none"
              placeholder="أدخل أي ملاحظات إضافية..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-moe-600 text-white py-3 px-6 rounded-lg hover:bg-moe-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
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