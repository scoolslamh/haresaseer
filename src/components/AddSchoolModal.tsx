import React, { useState } from 'react';
import { useEffect } from 'react';
import { SchoolForm } from '../types';
import { School } from '../types';
import { X, Building2, Save, MapPin, User, Phone } from 'lucide-react';
import { ConfirmationMessage } from './ConfirmationMessage';
import { OperationService } from '../services/operationService';

interface AddSchoolModalProps {
  school?: School;
  onSubmit: (data: SchoolForm) => Promise<void>;
  onClose: () => void;
}

export const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  school,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState<SchoolForm>({
    region: 'عسير',
    governorate: '',
    school_name: '',
    principal_name: '',
    principal_mobile: '',
    status: 'نشط',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (school) {
      setFormData({
        region: school.region,
        governorate: school.governorate,
        school_name: school.school_name,
        principal_name: school.principal_name,
        principal_mobile: school.principal_mobile,
        status: school.status,
        notes: school.notes
      });
    } else {
      setFormData({
        region: 'عسير',
        governorate: '',
        school_name: '',
        principal_name: '',
        principal_mobile: '',
        status: 'نشط',
        notes: ''
      });
    }
  }, [school]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 بدء حفظ المدرسة:', { isEditing: !!school, formData });
      const result = await onSubmit(formData);
      console.log('✅ تم حفظ المدرسة بنجاح');
      
      // تسجيل العملية في سجل العمليات
      try {
        const operationType = school ? 'تعديل بيانات' : 'إضافة مدرسة';
        const description = school
          ? `تم تعديل بيانات المدرسة: ${formData.school_name}`
          : `تم إضافة مدرسة جديدة: ${formData.school_name}`;
        await OperationService.logOperation(operationType, description);
      } catch (operationError) {
        // لا نرمي الخطأ هنا لأن العملية الأساسية نجحت
      }
      // الإغلاق فوراً — الإشعار يعرضه المكوّن الأب
      onClose();
    } catch (err: any) {
      console.error('❌ خطأ في حفظ المدرسة:', err);
      const errorMessage = err instanceof Error ? err.message : (school ? 'خطأ في تحديث المدرسة' : 'خطأ في إضافة المدرسة');
      setConfirmationText(errorMessage);
      setConfirmationType('error');
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-800">
              {school ? 'تعديل بيانات المدرسة' : 'إضافة مدرسة جديدة'}
            </h2>
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
              <p className="text-red-800 text-sm">
                {error.includes('إضافة') && school ? error.replace('إضافة', 'تحديث') : error}
              </p>
            </div>
          )}

          {/* معلومات أساسية */}
          <div className="bg-moe-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">المعلومات الأساسية</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المدرسة *</label>
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="أدخل اسم المدرسة"
                />
            </div>
          </div>

          {/* الموقع */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              الموقع
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة *</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="عسير">عسير</option>
                  <option value="جيزان">جيزان</option>
                  <option value="الباحة">الباحة</option>
                  <option value="نجران">نجران</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة *</label>
                <input
                  type="text"
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="أدخل المحافظة"
                />
              </div>
            </div>
          </div>

          {/* معلومات المدير */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات المدير/ة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المدير/ة</label>
                <input
                  type="text"
                  name="principal_name"
                  value={formData.principal_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="أدخل اسم المدير/ة"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">جوال المدير/ة</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    name="principal_mobile"
                    value={formData.principal_mobile}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* الحالة والملاحظات */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="أدخل أي ملاحظات إضافية..."
              />
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? (school ? 'جاري التحديث...' : 'جاري الإضافة...') : (school ? 'تحديث المدرسة' : 'إضافة المدرسة')}
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