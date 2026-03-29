import React from 'react';
import { Guard } from '../types/guard';
import { Edit, Trash2, Phone, Calendar, User, MapPin, School, CreditCard, Shield } from 'lucide-react';

interface GuardCardProps {
  guard: Guard;
  onEdit: (guard: Guard) => void;
  onDelete: (id: string) => void;
}

export const GuardCard: React.FC<GuardCardProps> = ({ guard, onEdit, onDelete }) => {
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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-moe-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-moe-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{guard.guard_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-moe-100 text-moe-800">
                  {guard.file && (
                    <span className="text-xs text-gray-500 mr-2">
                      ملف: {guard.file}
                    </span>
                  )}

                  {guard.gender || 'غير محدد'}
                </span>
                {guard.insurance && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    guard.insurance === 'نعم' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    تأمين: {guard.insurance}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(guard)}
              className="p-2 text-moe-600 hover:bg-moe-50 rounded-lg transition-colors"
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(guard.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* معلومات المدرسة */}
          <div className="bg-moe-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-moe-800 mb-2">
              <School className="w-4 h-4" />
              <span className="font-medium">معلومات المدرسة</span>
            </div>
            <p className="text-sm text-moe-700 font-medium">{guard.school_name}</p>
            {guard.principal_name && (
              <p className="text-sm text-moe-600">المدير/ة: {guard.principal_name}</p>
            )}
          </div>

          {/* معلومات الموقع */}
          {(guard.region || guard.governorate || guard.city) && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {[guard.region, guard.governorate, guard.city].filter(Boolean).join(' - ')}
              </span>
            </div>
          )}

          {/* معلومات شخصية */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {guard.civil_id && (
              <div className="flex items-center gap-2 text-gray-600">
                <CreditCard className="w-4 h-4" />
                <span>السجل: {guard.civil_id}</span>
              </div>
            )}

            {guard.birth_date && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>العمر: {calculateAge(guard.birth_date)}</span>
              </div>
            )}
          </div>

          {/* معلومات الاتصال */}
          <div className="space-y-2">
            {guard.mobile && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm" dir="ltr">{guard.mobile}</span>
              </div>
            )}

            {guard.principal_mobile && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">جوال المدير: <span dir="ltr">{guard.principal_mobile}</span></span>
              </div>
            )}
          </div>

          {/* تاريخ المباشرة */}
          {guard.start_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">تاريخ المباشرة: {formatDate(guard.start_date)}</span>
            </div>
          )}

          {/* الآيبان */}
          {guard.iban && (
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-mono" dir="ltr">{guard.iban}</span>
            </div>
          )}

          {/* ملاحظات */}
          {guard.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{guard.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};