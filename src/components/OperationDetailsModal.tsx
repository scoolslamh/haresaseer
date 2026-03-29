import React from 'react';
import { Operation } from '../types';
import { 
  X, 
  Settings, 
  User, 
  School, 
  Calendar, 
  FileText,
  ArrowRightLeft,
  UserPlus,
  FileEdit,
  Building,
  MapPin,
  Phone
} from 'lucide-react';

interface OperationDetailsModalProps {
  operation: Operation;
  onClose: () => void;
}

export const OperationDetailsModal: React.FC<OperationDetailsModalProps> = ({
  operation,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'نقل': return <ArrowRightLeft className="w-6 h-6" />;
      case 'إعادة توجيه': return <ArrowRightLeft className="w-6 h-6" />;
      case 'إضافة حارس': return <UserPlus className="w-6 h-6" />;
      case 'إضافة مدرسة': return <School className="w-6 h-6" />;
      case 'تعديل بيانات': return <FileEdit className="w-6 h-6" />;
      default: return <Settings className="w-6 h-6" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'نقل': return 'text-moe-600 bg-moe-100';
      case 'إعادة توجيه': return 'text-purple-600 bg-purple-100';
      case 'إضافة حارس': return 'text-green-600 bg-green-100';
      case 'إضافة مدرسة': return 'text-yellow-600 bg-yellow-100';
      case 'تعديل بيانات': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getOperationColor(operation.operation_type)}`}>
              {getOperationIcon(operation.operation_type)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">تفاصيل العملية</h2>
              <p className="text-sm text-gray-600">{operation.operation_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* معلومات العملية الأساسية */}
          <div className="bg-moe-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              معلومات العملية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">نوع العملية</label>
                <div className="flex items-center gap-2">
                  {getOperationIcon(operation.operation_type)}
                  <span className="text-lg font-semibold text-gray-800">{operation.operation_type}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ ووقت العملية</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-800">{formatDate(operation.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* وصف العملية */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              وصف العملية
            </h3>
            <p className="text-gray-700 leading-relaxed">{operation.description}</p>
          </div>

          {/* معلومات الحارس */}
          {operation.guard && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                معلومات الحارس
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">اسم الحارس</label>
                  <p className="text-gray-800 font-medium">{operation.guard.guard_name}</p>
                </div>
                
                {operation.guard.civil_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">السجل المدني</label>
                    <p className="text-gray-800">{operation.guard.civil_id}</p>
                  </div>
                )}
                
                {operation.guard.mobile && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">رقم الجوال</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-800" dir="ltr">{operation.guard.mobile}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">الحالة</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    operation.guard.status === 'على رأس العمل' 
                      ? 'bg-green-100 text-green-800' 
                      : operation.guard.status === 'منقطع'
                      ? 'bg-red-100 text-red-800'
                      : operation.guard.status === 'إجازة'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {operation.guard.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* معلومات المدارس */}
          {(operation.school_from || operation.school_to) && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <School className="w-5 h-5" />
                معلومات المدارس
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* المدرسة المصدر */}
                {operation.school_from && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4 text-red-600" />
                      المدرسة المصدر (من)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">اسم المدرسة: </span>
                        <span className="text-green-800 font-medium">{operation.school_from.school_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">الموقع: </span>
                        <span className="text-gray-800">{operation.school_from.region} - {operation.school_from.governorate}</span>
                      </div>
                      {operation.school_from.principal_name && (
                        <div>
                          <span className="text-gray-600">المدير/ة: </span>
                          <span className="text-gray-800">{operation.school_from.principal_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* المدرسة الهدف */}
                {operation.school_to && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4 text-green-600" />
                      المدرسة الهدف (إلى)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">اسم المدرسة: </span>
                        <span className="text-gray-800 font-medium">{operation.school_to.school_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">الموقع: </span>
                        <span className="text-gray-800">{operation.school_to.region} - {operation.school_to.governorate}</span>
                      </div>
                      {operation.school_to.principal_name && (
                        <div>
                          <span className="text-gray-600">المدير/ة: </span>
                          <span className="text-gray-800">{operation.school_to.principal_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* سهم الانتقال */}
              {operation.school_from && operation.school_to && (
                <div className="flex justify-center my-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-moe-100 rounded-full">
                    <ArrowRightLeft className="w-5 h-5 text-moe-600" />
                    <span className="text-moe-800 font-medium">تم النقل</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* معلومات المنفذ */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات المنفذ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">اسم المنفذ</label>
                <p className="text-gray-800 font-medium">
                  {operation.user?.full_name || 'غير محدد'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ التنفيذ</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-800">{formatDate(operation.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* معرف العملية */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">معرف العملية:</span>
              <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                {operation.id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};