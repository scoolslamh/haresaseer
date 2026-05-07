import React from 'react';
import { Guard } from '../types';
import { X, Edit, User, School, MapPin, Phone, Calendar, CreditCard, Shield, FileText, Briefcase, Star, Tag } from 'lucide-react';
import { AuthService } from '../services/authService';

interface GuardDetailsModalProps {
  guard: Guard;
  onClose: () => void;
  onEdit: () => void;
}

const statusColor = (status: string) => {
  if (status === 'على رأس العمل') return 'bg-green-100 text-green-800';
  if (status === 'مكلف داخلي')    return 'bg-blue-100 text-blue-800';
  if (status === 'إيقاف الراتب مؤقتاً' || status === 'مكفوف اليد') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

export const GuardDetailsModal: React.FC<GuardDetailsModalProps> = ({ guard, onClose, onEdit }) => {
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('ar-SA') : '-';
  const age = (d: string) => {
    if (!d) return '-';
    return `${new Date().getFullYear() - new Date(d).getFullYear()} سنة`;
  };

  const Field = ({ label, value, dir }: { label: string; value: React.ReactNode; dir?: 'ltr' }) => (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-gray-800 ${dir === 'ltr' ? 'font-mono' : ''}`} dir={dir}>{value || '-'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-moe-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-moe-600 text-white p-2 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{guard.guard_name}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${statusColor(guard.status)}`}>
                {guard.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(AuthService.hasSpecificPermission('guards.edit') || AuthService.hasPermission('admin')) && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                تعديل
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* بيانات الوظيفة */}
          <div className="bg-moe-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-moe-800 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> بيانات الوظيفة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="المسمى الوظيفي"    value={guard.job_title} />
              <Field label="المرتبة/الدرجة"    value={guard.rank} />
              <Field label="فئة التعيين"        value={guard.appointment_category} />
            </div>
          </div>

          {/* المعلومات الشخصية */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> المعلومات الشخصية
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="السجل المدني" value={guard.civil_id} />
              <Field label="الجنس" value={
                guard.gender ? (
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    guard.gender === 'ذكر' ? 'bg-moe-100 text-moe-800' : 'bg-pink-100 text-pink-800'
                  }`}>{guard.gender}</span>
                ) : '-'
              } />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">تاريخ الميلاد</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-800">{fmt(guard.birth_date)}</span>
                  {guard.birth_date && <span className="text-xs text-gray-500">({age(guard.birth_date)})</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">التأمينات</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  guard.insurance === 'نعم' ? 'bg-green-100 text-green-800' :
                  guard.insurance === 'لا'  ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {guard.insurance || '-'}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">تاريخ المباشرة</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-800">{fmt(guard.start_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* الاتصال والمالية */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> الاتصال والمالية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">رقم الجوال</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-800" dir="ltr">{guard.mobile || '-'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">الآيبان</p>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-800 font-mono text-sm" dir="ltr">{guard.iban || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات المدرسة */}
          {guard.school && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                <School className="w-4 h-4" /> المدرسة المُعيَّن فيها
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="اسم المدرسة"   value={guard.school.school_name} />
                <Field label="المنطقة"        value={guard.school.region} />
                <Field label="المحافظة"       value={guard.school.governorate} />
                <Field label="المدير/ة"       value={guard.school.principal_name} />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">جوال المدير/ة</p>
                  <span className="text-gray-800" dir="ltr">{guard.school.principal_mobile || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {!guard.school && (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
              لم يتم تعيين هذا الحارس في أي مدرسة
            </div>
          )}

          {/* ملاحظات */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> ملاحظات
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{guard.notes || 'لا توجد ملاحظات'}</p>
          </div>

          {/* معلومات النظام */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t text-xs text-gray-400">
            <div>تاريخ الإضافة: {fmt(guard.created_at)}</div>
            <div className="text-left">آخر تحديث: {fmt(guard.updated_at)}</div>
          </div>

        </div>
      </div>
    </div>
  );
};
