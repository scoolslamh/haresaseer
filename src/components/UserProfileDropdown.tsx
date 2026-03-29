import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { AuthService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface UserProfileDropdownProps {
  onProfileClick: () => void;
  onLogout: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  onProfileClick,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مشرف عام';
      case 'supervisor': return 'مشرف';
      case 'data_entry': return 'مدخل بيانات';
      default: return role;
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-moe-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-moe-600" />
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{currentUser.full_name}</p>
          <p className="text-xs text-gray-500">{getRoleLabel(currentUser.role)}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800">{currentUser.full_name}</p>
            <p className="text-xs text-gray-500">{currentUser.username}</p>
            <p className="text-xs text-moe-600">{getRoleLabel(currentUser.role)}</p>
          </div>
          
          <button
            onClick={() => {
              onProfileClick();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-right hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">إدارة الملف الشخصي</span>
          </button>
          
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-right hover:bg-red-50 transition-colors text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
};