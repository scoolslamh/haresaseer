import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { AuthService } from '../services/authService';

export const WelcomeMessage: React.FC = () => {
  const [show, setShow] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مشرف عام';
      case 'supervisor': return 'مشرف';
      case 'data_entry': return 'مدخل بيانات';
      default: return role;
    }
  };

  const getWelcomeTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء الخير';
  };

  if (!show || !currentUser) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4 max-w-sm animate-slide-down">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800">
              {getWelcomeTime()}، {currentUser.full_name}
            </h3>

            <p className="text-xs text-gray-600">
              مرحباً بك في نظام الحراسات
            </p>

            <p className="text-xs text-moe-600">
              {getRoleLabel(currentUser.role)}
            </p>
          </div>

          <button onClick={() => setShow(false)}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};