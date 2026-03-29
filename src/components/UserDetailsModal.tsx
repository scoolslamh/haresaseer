import React from 'react';
import { UserWithPermissions } from '../types/permissions';
import { AuthService } from '../services/authService';
import { X, Edit, Shield, User, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface UserDetailsModalProps {
  user: UserWithPermissions;
  onClose: () => void;
  onEdit: () => void;
  onManagePermissions: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  onClose,
  onEdit,
  onManagePermissions
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مشرف عام';
      case 'supervisor': return 'مشرف';
      case 'data_entry': return 'مدخل بيانات';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-moe-100 text-moe-800';
      case 'data_entry': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // تجميع الصلاحيات حسب الوحدة
  const permissionsByModule = user.permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as { [key: string]: any[] });

  const getModuleDisplayName = (module: string) => {
    const moduleNames: { [key: string]: string } = {
      'guards': 'الحراس',
      'schools': 'المدارس',
      'operations': 'العمليات',
      'violations': 'المخالفات',
      'import': 'الاستيراد',
      'reports': 'التقارير',
      'users': 'المستخدمين',
      'system': 'النظام'
    };
    return moduleNames[module] || module;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">تفاصيل المستخدم</h2>
          </div>
          <div className="flex items-center gap-2">
            {EnhancedAuthService.hasPermission('users.manage_permissions') && (
              <button
                onClick={onManagePermissions}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Shield className="w-4 h-4" />
                إدارة الصلاحيات
              </button>
            )}
            {EnhancedAuthService.hasPermission('users.edit') && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                تعديل
              </button>
            )}
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
                <label className="block text-sm font-medium text-gray-600 mb-1">الاسم الكامل</label>
                <p className="text-lg font-semibold text-gray-800">{user.full_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">اسم المستخدم</label>
                <p className="text-gray-800 font-mono">@{user.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">الدور الأساسي</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">الحالة</label>
                <div className="flex items-center gap-2">
                  {user.is_active ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">نشط</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">غير نشط</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              معلومات الاتصال
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">البريد الإلكتروني</label>
              <p className="text-gray-800">{user.email || 'غير محدد'}</p>
            </div>
          </div>

          {/* الصلاحيات */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              الصلاحيات ({user.permissions.length})
            </h3>
            
            {user.permissions.length === 0 ? (
              <p className="text-gray-600">لا توجد صلاحيات محددة لهذا المستخدم</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                  <div key={module} className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      {getModuleDisplayName(module)}
                      <span className="text-sm text-gray-500">({modulePermissions.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {modulePermissions.map(permission => (
                        <div key={permission.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                          <CheckCircle className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-purple-800">{permission.display_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* معلومات النظام */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              معلومات النظام
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ الإنشاء</label>
                <p className="text-gray-800">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">آخر تحديث</label>
                <p className="text-gray-800">{formatDate(user.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};