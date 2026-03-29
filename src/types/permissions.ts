// أنواع البيانات للصلاحيات
import { User } from './index';

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  module: string;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted_by: string | null;
  granted_at: string;
  permission?: Permission;
}

export interface PermissionModule {
  name: string;
  display_name: string;
  permissions: Permission[];
}

export interface UserWithPermissions extends User {
  permissions?: Permission[];
}

// مجموعات الصلاحيات المحددة مسبقاً
export interface PermissionGroup {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'guards_full',
    name: 'guards_full',
    display_name: 'إدارة الحراس كاملة',
    description: 'جميع صلاحيات إدارة الحراس',
    permissions: ['guards.view', 'guards.create', 'guards.edit', 'guards.delete', 'guards.export']
  },
  {
    id: 'guards_readonly',
    name: 'guards_readonly',
    display_name: 'عرض الحراس فقط',
    description: 'عرض والبحث في الحراس بدون تعديل',
    permissions: ['guards.view', 'guards.export']
  },
  {
    id: 'schools_full',
    name: 'schools_full',
    display_name: 'إدارة المدارس كاملة',
    description: 'جميع صلاحيات إدارة المدارس',
    permissions: ['schools.view', 'schools.create', 'schools.edit', 'schools.delete']
  },
  {
    id: 'operations_full',
    name: 'operations_full',
    display_name: 'إدارة العمليات كاملة',
    description: 'جميع صلاحيات العمليات والنقل',
    permissions: ['operations.view', 'operations.transfer', 'operations.reassign', 'operations.bulk_delete', 'operations.export']
  },
  {
    id: 'supervisor_role',
    name: 'supervisor_role',
    display_name: 'صلاحيات المشرف',
    description: 'صلاحيات المشرف الأساسية',
    permissions: [
      'guards.view', 'guards.create', 'guards.edit', 'guards.export',
      'schools.view', 'schools.create', 'schools.edit',
      'operations.view', 'operations.transfer', 'operations.reassign',
      'violations.view', 'violations.create', 'violations.edit',
      'import.data', 'reports.dashboard', 'reports.inquiry'
    ]
  },
  {
    id: 'data_entry_role',
    name: 'data_entry_role',
    display_name: 'صلاحيات مدخل البيانات',
    description: 'صلاحيات مدخل البيانات الأساسية',
    permissions: [
      'guards.view', 'guards.create', 'guards.edit',
      'schools.view',
      'reports.dashboard', 'reports.inquiry'
    ]
  }
];

// وحدات النظام
export const SYSTEM_MODULES = [
  { name: 'guards', display_name: 'الحراس', icon: 'Users' },
  { name: 'schools', display_name: 'المدارس', icon: 'School' },
  { name: 'operations', display_name: 'العمليات', icon: 'Settings' },
  { name: 'violations', display_name: 'المخالفات', icon: 'AlertTriangle' },
  { name: 'import', display_name: 'الاستيراد', icon: 'Upload' },
  { name: 'reports', display_name: 'التقارير', icon: 'FileText' },
  { name: 'users', display_name: 'المستخدمين', icon: 'UserCheck' },
  { name: 'system', display_name: 'النظام', icon: 'Cog' }
];