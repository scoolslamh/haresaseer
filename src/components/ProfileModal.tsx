import React, { useState, useEffect } from 'react';
import { X, Save, User, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { User as UserType } from '../types';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name,
        email: currentUser.email,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      // التحقق من كلمة المرور الجديدة
      if (formData.new_password && formData.new_password !== formData.confirm_password) {
        throw new Error('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
      }

      // تحديث البيانات
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email
      };

      if (formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      await UserService.updateProfile(user.id, updateData);
      
      // تحديث البيانات المحلية
      const updatedUser = { ...user, full_name: formData.full_name, email: formData.email };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      setMessage({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' });
      
      // إعادة تعيين كلمات المرور
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'حدث خطأ في تحديث البيانات' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">الملف الشخصي</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">تغيير كلمة المرور</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور الحالية
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                    placeholder="اتركه فارغاً إذا لم ترد تغيير كلمة المرور"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-moe-600 text-white py-2 px-4 rounded-lg hover:bg-moe-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};