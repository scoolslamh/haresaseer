// أنواع البيانات الأساسية للنظام

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'supervisor' | 'data_entry';
  full_name: string;
  email: string;
  is_active: boolean;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  region: 'عسير' | 'جيزان' | 'الباحة' | 'نجران';
  governorate: string;
  school_name: string;
  principal_name: string;
  principal_mobile: string;
  status: 'نشط' | 'غير نشط';
  notes: string;
  created_at: string;
  updated_at: string;
  file_number?: string;
  guards_count?: number;
}

export type GuardStatus =
  | 'على رأس العمل'
  | 'إجازة أمومة/رعاية مولود'
  | 'إجازة مرضية'
  | 'إيقاف الراتب مؤقتاً'
  | 'مجاز استثنائياً'
  | 'مكفوف اليد'
  | 'مكلف داخلي';

export const GUARD_STATUS_OPTIONS: GuardStatus[] = [
  'على رأس العمل',
  'إجازة أمومة/رعاية مولود',
  'إجازة مرضية',
  'إيقاف الراتب مؤقتاً',
  'مجاز استثنائياً',
  'مكفوف اليد',
  'مكلف داخلي',
];

export type AppointmentCategory = '' | 'المستخدمين' | 'بند الأجور' | 'الرسميين';

export type InsuranceStatus = '' | 'يصرف بدل' | 'لا يصرف';

export interface Guard {
  id: string;
  school_id: string | null;
  guard_name: string;
  civil_id: string;
  gender: '' | 'ذكر' | 'أنثى';
  birth_date: string;
  insurance: InsuranceStatus;
  start_date: string;
  mobile: string;
  iban: string;
  job_title: string;
  rank: string;
  appointment_category: AppointmentCategory;
  status: GuardStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  school?: School;
}

export interface Violation {
  id: string;
  guard_id: string;
  violation_type: 'شكوى' | 'إنذار' | 'مخالفة';
  violation_date: string;
  description: string;
  created_by: string;
  created_at: string;
  guard?: Guard; // للربط مع الحارس
}

export interface Operation {
  id: string;
  operation_type: 'نقل' | 'إعادة توجيه' | 'إضافة حارس' | 'إضافة مدرسة' | 'تعديل بيانات' | 'حذف حارس' | 'حذف مدرسة' | 'حذف مجموعة' | 'إضافة مخالفة' | 'إضافة مستخدم' | 'حذف مستخدم';
  guard_id: string | null;
  school_from_id: string | null;
  school_to_id: string | null;
  description: string;
  performed_by: string;
  created_at: string;
  guard?: Guard;
  school_from?: School;
  school_to?: School;
  user?: User;
}

// أنواع النماذج
export interface LoginForm {
  username: string;
  password: string;
}

export interface GuardForm {
  school_id: string | null;
  guard_name: string;
  civil_id: string;
  gender: '' | 'ذكر' | 'أنثى';
  birth_date: string;
  insurance: InsuranceStatus;
  start_date: string;
  mobile: string;
  iban: string;
  job_title: string;
  rank: string;
  appointment_category: AppointmentCategory;
  status: GuardStatus;
  notes: string;
}

export interface SchoolForm {
  region: 'عسير' | 'جيزان' | 'الباحة' | 'نجران';
  governorate: string;
  school_name: string;
  principal_name: string;
  principal_mobile: string;
  status: 'نشط' | 'غير نشط';
  notes: string;
}

export interface ViolationForm {
  guard_id: string;
  violation_type: 'شكوى' | 'إنذار' | 'مخالفة';
  violation_date: string;
  description: string;
}

export interface UserForm {
  username: string;
  plain_password?: string;
  role: 'admin' | 'supervisor' | 'data_entry';
  full_name: string;
  email: string;
  is_active: boolean;
}

// أنواع الإحصائيات
export interface DashboardStats {
  totalSchools: number;
  totalGuards: number;
  maleGuards: number;
  femaleGuards: number;
  insuredGuards: number;
  uninsuredGuards: number;
  activeGuards: number;
  schoolsWithGuards: number;
  schoolsWithoutGuards: number;
  regionStats: Array<{
    region: string;
    count: number;
    percentage: number;
  }>;
  governorateStats: Array<{
    governorate: string;
    region: string;
    count: number;
    percentage: number;
  }>;
  statusStats: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

// أنواع الفلاتر
export interface GuardFilters {
  region?: string;
  governorate?: string;
  gender?: string;
  insurance?: string;
  status?: string;
  search?: string;
  unassignedOnly?: boolean;
  schoolId?: string;
}

// أنواع الاستيراد
export interface ImportData {
  file_number: string;
  region: string;
  governorate: string;
  school_name: string;
  principal_name?: string;
  principal_mobile?: string;
  guard_name: string;
  civil_id?: string;
  gender?: string;
  birth_date?: string;
  insurance?: string;
  start_date?: string;
  mobile?: string;
  iban?: string;
  notes?: string;
}

// ── أنواع المعاملات ────────────────────────────────────────────────────────
export type TaskPriority = 'عاجل' | 'عادي' | 'منخفض';
export type TaskStatus   = 'مفتوحة' | 'قيد المتابعة' | 'مغلقة';
export type TaskUpdateType = 'open' | 'update' | 'close';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  created_by: string;
  created_at: string;
  closed_by?: string | null;
  closed_at?: string | null;
  close_reason?: string | null;
  creator?: { id: string; full_name: string } | null;
  closer?:  { id: string; full_name: string } | null;
  updates_count?: number;
}

export interface TaskUpdate {
  id: string;
  task_id: string;
  content: string;
  update_type: TaskUpdateType;
  created_by: string;
  created_at: string;
  author?: { id: string; full_name: string } | null;
  task?:   { id: string; title: string }     | null;
}