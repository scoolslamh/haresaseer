import React, { useState, useEffect } from 'react';
import { UserWithPermissions } from '../types/permissions';
import { UserForm } from '../types';
import { X, Save, User, Mail, Lock, Shield } from 'lucide-react';

interface UserFormModalProps {
  user?: UserWithPermissions | null;
  isEditing: boolean;
  onSubmit: (data: UserForm) => Promise<void>;
  onClose: () => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  isEditing,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState<UserForm>({
    username: '',
    plain_password: '',
    role: 'data_entry',
    full_name: '',
    email: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordField, setShowPasswordField] = useState(false);

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        username: user.username,
        plain_password: '',
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        is_active: user.is_active
      });
    }
  }, [user, isEditing]);

  // قائمة أسماء المستخدمين المقترحة حسب الدور
  const generateUsernameOptions = (role: string) => {
    const baseNames = {
      'admin': ['admin', 'supervisor', 'manager', 'director'],
      'supervisor': ['supervisor', 'coordinator', 'leader', 'head'],
      'data_entry': ['user', 'clerk', 'operator', 'assistant']
    };
    
    const base = baseNames[role as keyof typeof baseNames] || baseNames.data_entry;
    const options = [];
    
    // إضافة الأسماء الأساسية
    base.forEach(name => {
      options.push(name);
      // إضافة أرقام للتنويع
      for (let i = 1; i <= 5; i++) {
        options.push(`${name}${i}`);
      }
    });
    
    return options;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.full_name.trim()) {
      setError('اسم المستخدم والاسم الكامل مطلوبان');
      return;
    }

    if (!isEditing && (!formData.plain_password || formData.plain_password.trim().length < 8)) {
      setError('كلمة المرور مطلوبة ويجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (isEditing && showPasswordField && formData.plain_password.trim().length > 0 && formData.plain_password.trim().length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = { ...formData };

      if (isEditing) {
        // للتعديل، إذا لم يتم تغيير كلمة المرور، لا ترسلها
        if (!showPasswordField || !formData.plain_password.trim()) {
          delete submitData.plain_password;
        }
      }
      
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في حفظ المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* معلومات أساسية */}
          <div className="bg-moe-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الدور الأساسي *
                </label>
                <div className="relative">
                  <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  >
                    <option value="data_entry">مدخل بيانات</option>
                    <option value="supervisor">مشرف</option>
                    <option value="admin">مشرف عام</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم *
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={isEditing}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">اختر اسم المستخدم</option>
                    {generateUsernameOptions(formData.role).map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    لا يمكن تغيير اسم المستخدم بعد الإنشاء
                  </p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات الاتصال</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="أدخل البريد الإلكتروني (اختياري)"
                />
              </div>
            </div>
          </div>

          {/* الأمان والصلاحيات */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">الأمان والصلاحيات</h3>
            
            {!isEditing && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    name="plain_password"
                    value={formData.plain_password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                    placeholder="8 أحرف على الأقل"
                  />
                </div>
              </div>
            )}
            
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={showPasswordField}
                    onChange={(e) => setShowPasswordField(e.target.checked)}
                    className="mr-2"
                  />
                  تغيير كلمة المرور
                </label>
                
                {showPasswordField && (
                  <div className="mt-2">
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="password"
                        name="plain_password"
                        value={formData.plain_password}
                        onChange={handleChange}
                        className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                        placeholder="أدخل كلمة المرور الجديدة"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      8 أحرف على الأقل
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-3">
              يمكن تخصيص الصلاحيات التفصيلية بعد إنشاء المستخدم من صفحة إدارة المستخدمين
            </p>
          </div>

          {/* الحالة */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-moe-600 border-gray-300 rounded focus:ring-moe-500"
              />
              <label className="text-sm font-medium text-gray-700">
                المستخدم نشط
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              المستخدمون غير النشطين لا يمكنهم تسجيل الدخول
            </p>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-moe-600 text-white py-3 px-6 rounded-lg hover:bg-moe-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? 'جاري الحفظ...' : (isEditing ? 'تحديث المستخدم' : 'إضافة المستخدم')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};