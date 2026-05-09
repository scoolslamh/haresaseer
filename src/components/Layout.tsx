import React, { useState } from "react";
import {
  Home,
  AlertTriangle,
  Settings,
  Menu,
  X,
  Shield,
  FileText,
  Upload,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { AuthService } from "../services/authService";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onProfileClick: () => void;
  userPermissions: string[];
  onPermissionsChange: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  onProfileClick,
  userPermissions,
  onPermissionsChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    AuthService.logout()
      .then(() => {
        sessionStorage.removeItem("hasShownWelcome");
        window.location.href = window.location.origin;
      })
      .catch(() => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = window.location.origin;
      });
  };

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const hasAnyPermission = (...permissions: string[]): boolean => {
    if (isAdmin) return true;
    return permissions.some((p) => userPermissions.includes(p));
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "الصفحة الرئيسية",
      icon: Home,
      color: "text-moe-700",
      bg: "bg-moe-50",
      visible: isAdmin || userPermissions.length > 0,
    },
    {
      id: "inquiry",
      label: "الاستعلام",
      icon: FileText,
      color: "text-moe-800",
      bg: "bg-moe-50",
      visible: hasAnyPermission(
        "reports.inquiry",
        "guards.view",
        "guards.create",
        "guards.edit",
        "guards.delete",
        "guards.export",
        "schools.view",
        "schools.create",
        "schools.edit",
        "schools.delete",
      ),
    },
    {
      id: "operations",
      label: "إدارة العمليات",
      icon: Settings,
      color: "text-moe-600",
      bg: "bg-moe-50",
      visible: hasAnyPermission(
        "operations.view",
        "operations.transfer",
        "operations.reassign",
        "operations.bulk_delete",
        "operations.export",
      ),
    },
    {
      id: "violations",
      label: "المخالفات",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      visible: hasAnyPermission(
        "violations.view",
        "violations.create",
        "violations.edit",
        "violations.delete",
      ),
    },
    {
      id: "import",
      label: "استيراد البيانات",
      icon: Upload,
      color: "text-moe-500",
      bg: "bg-moe-50",
      visible: hasAnyPermission("import.data"),
    },
    {
      id: "export",
      label: "تصدير البيانات",
      icon: FileSpreadsheet,
      color: "text-green-700",
      bg: "bg-green-50",
      visible: hasAnyPermission("guards.export", "reports.export"),
    },
    {
      id: "users",
      label: "إدارة المستخدمين",
      icon: UserCheck,
      color: "text-moe-700",
      bg: "bg-moe-50",
      visible: hasAnyPermission(
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "users.manage_permissions",
      ),
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.visible);

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}
      >
        {/* Header */}
        <div className="h-20 w-full bg-gradient-to-b from-moe-900 to-moe-800 flex items-center justify-center px-4">
          <img
            src="/samaya.png"
            alt="وزارة التعليم"
            className="h-14 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 flex-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 mb-1 rounded-lg text-right transition-all ${
                  currentPage === item.id
                    ? "bg-moe-100 text-moe-900 font-medium shadow-sm"
                    : "text-gray-700 hover:bg-moe-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 🔻 شعار Samaya في الأسفل */}
        <div className="mt-auto p-4 border-t flex flex-col items-center gap-2">
          <img
            src="/samaya.png"
            alt="Samaya"
            className="h-10 opacity-70 hover:opacity-100 transition"
          />
          <span className="text-xs text-gray-400">
            الأمن والسلامة والمرافق بعسير
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:mr-0 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <UserProfileDropdown
              onProfileClick={onProfileClick}
              onLogout={handleLogout}
            />
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-moe-800" />
              <h1 className="text-lg font-bold text-moe-900">نظام الحراسات</h1>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-end">
            <UserProfileDropdown
              onProfileClick={onProfileClick}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 w-full min-w-0 overflow-x-auto">{children}</main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
