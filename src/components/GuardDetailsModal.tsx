import React from 'react';
import { Guard } from '../types';
import { X, Edit, User, School, MapPin, Phone, Calendar, CreditCard, Shield, FileText } from 'lucide-react';
import { AuthService } from '../services/authService';

interface GuardDetailsModalProps {
  guard: Guard;
  onClose: () => void;
  onEdit: () => void;
}

export const GuardDetailsModal: React.FC<GuardDetailsModalProps> = ({
  guard,
  onClose,
  onEdit
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    return `${age} سنة`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">تفاصيل الحارس</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* المعلومات الأساسية */}
          <div className="bg-moe-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              المعلومات الأساسية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">اسم الحارس</label>
                <p className="text-lg font-semibold text-gray-800">{guard.guard_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">الحالة</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  guard.status === 'على رأس العمل' 
                    ? 'bg-green-100 text-green-800' 
                    : guard.status === 'منقطع'
                    ? 'bg-red-100 text-red-800'
                    : guard.status === 'إجازة'
                    ? 'bg-yellow-100 text-yellow-800'
                    : guard.status === 'مبعد عن المدارس'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {guard.status === 'مبعد عن المدارس' ? 'مبعد' : guard.status}
                </span>
              </div>
            </div>
          </div>

          {/* معلومات المدرسة */}
          {guard.school && (
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <School className="w-5 h-5" />
                معلومات المدرسة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">اسم المدرسة</label>
                  <p className="text-gray-800 font-medium">{guard.school.school_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">رقم الملف</label>
                  <p className="text-gray-800">{guard.school.file_number}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">المنطقة</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-800">{guard.school.region}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">المحافظة</label>
                  <p className="text-gray-800">{guard.school.governorate}</p>
                </div>
                
                {guard.school.principal_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">المدير/ة</label>
                    <p className="text-gray-800">{guard.school.principal_name}</p>
                  </div>
                )}
                
                {guard.school.principal_mobile && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">جوال المدير/ة</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-800" dir="ltr">{guard.school.principal_mobile}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* المعلومات الشخصية */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              المعلومات الشخصية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guard.civil_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">السجل المدني</label>
                  <p className="text-gray-800">{guard.civil_id}</p>
                </div>
              )}
              
              {guard.file && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">رقم الملف</label>
                  <p className="text-gray-800">{guard.file}</p>
                </div>
              )}
              
              {guard.gender && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">الجنس</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    guard.gender === 'ذكر' 
                      ? 'bg-moe-100 text-moe-800' 
                      : 'bg-pink-100 text-pink-800'
                  }`}>
                    {guard.gender}
                  </span>
                </div>
              )}
              
              {guard.birth_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ الميلاد</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-800">{formatDate(guard.birth_date)}</p>
                      <p className="text-sm text-gray-500">العمر: {calculateAge(guard.birth_date)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {guard.insurance && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">التأمينات</label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      guard.insurance === 'نعم' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {guard.insurance}
                    </span>
                  </div>
                </div>
              )}
              
              {guard.start_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ المباشرة</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-800">{formatDate(guard.start_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* معلومات الاتصال والمالية */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              معلومات الاتصال والمالية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guard.mobile && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">رقم الجوال</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-800" dir="ltr">{guard.mobile}</p>
                  </div>
                </div>
              )}
              
              {guard.iban && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">الآيبان</label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-800 font-mono" dir="ltr">{guard.iban}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ملاحظات */}
          {guard.notes && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ملاحظات
              </h3>
              <p className="text-gray-700 leading-relaxed">{guard.notes}</p>
            </div>
          )}

          {/* معلومات النظام */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات النظام</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <label className="block font-medium mb-1">تاريخ الإنشاء</label>
                <p>{formatDate(guard.created_at)}</p>
              </div>
              <div>
                <label className="block font-medium mb-1">آخر تحديث</label>
                <p>{formatDate(guard.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};