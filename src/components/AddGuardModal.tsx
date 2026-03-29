import React, { useState } from 'react';
import { GuardForm, School } from '../types';
import { X, UserPlus, Save, User, School as SchoolIcon, Phone, CreditCard } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

interface AddGuardModalProps {
  schools: School[];
  onSubmit: (data: GuardForm) => Promise<void>;
  onClose: () => void;
}

export const AddGuardModal: React.FC<AddGuardModalProps> = ({
  schools,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState<GuardForm>({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في إضافة الحارس');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? (name === 'school_id' ? null : '') : value
    }));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-bold text-gray-800">إضافة حارس جديد</h2>
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

          {/* معلومات أساسية */}
          <div className="bg-moe-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              المعلومات الأساسية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحارس *</label>
                <input
                  type="text"
                  name="guard_name"
                  value={formData.guard_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="أدخل اسم الحارس"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدرسة</label>
                <SearchableSelect
                  options={[
                    { id: '', label: 'اختر المدرسة (اختياري)' },
                    ...schools.map(school => ({
                      id: school.id,
                      label: school.school_name,
                      subtitle: `${school.region} - ${school.governorate}`
                    }))
                  ]}
                  value={formData.school_id || ''}
                  onChange={(value) => handleChange({ target: { name: 'school_id', value } } as any)}
                  placeholder="ابحث عن المدرسة..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* المعلومات الشخصية */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">المعلومات الشخصية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السجل المدني</label>
                <input
                  type="text"
                  name="civil_id"
                  value={formData.civil_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="أدخل السجل المدني"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الملف</label>
                <input
                  type="text"
                  name="file"
                  value={formData.file}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="أدخل رقم أو اسم الملف (اختياري)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">اختر الجنس</option>
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التأمينات</label>
                <select
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">اختر حالة التأمين</option>
                  <option value="نعم">نعم</option>
                  <option value="لا">لا</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ المباشرة</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              معلومات الاتصال والمالية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="05xxxxxxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الآيبان</label>
                <div className="relative">
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="SA0000000000000000000000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="أدخل أي ملاحظات إضافية..."
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'جاري الإضافة...' : 'إضافة الحارس'}
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
    </div>
  );
};