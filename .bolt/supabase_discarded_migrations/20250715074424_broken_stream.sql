/*
  # نظام إدارة الصلاحيات المفصلة

  1. الجداول الجديدة
    - `permissions` - الصلاحيات المتاحة في النظام
    - `user_permissions` - ربط المستخدمين بالصلاحيات

  2. البيانات الأساسية
    - إدراج جميع الصلاحيات المطلوبة
    - تجميع الصلاحيات حسب الوحدات

  3. الأمان
    - تفعيل RLS على الجداول الجديدة
    - سياسات أمان مناسبة
*/

-- جدول الصلاحيات
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text DEFAULT '',
  module text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- جدول ربط المستخدمين بالصلاحيات
CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- تفعيل RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "permissions_select_policy" ON permissions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "user_permissions_select_policy" ON user_permissions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "user_permissions_insert_policy" ON user_permissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "user_permissions_delete_policy" ON user_permissions
  FOR DELETE TO anon, authenticated
  USING (true);

-- فهارس للأداء
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX idx_permissions_module ON permissions(module);

-- إدراج الصلاحيات الأساسية
INSERT INTO permissions (name, display_name, description, module) VALUES
-- صلاحيات البوابين
('guards.view', 'عرض البوابين', 'عرض قائمة البوابين والبحث فيها', 'guards'),
('guards.create', 'إضافة بواب', 'إضافة بوابين جدد للنظام', 'guards'),
('guards.edit', 'تعديل البوابين', 'تعديل بيانات البوابين الموجودين', 'guards'),
('guards.delete', 'حذف البوابين', 'حذف البوابين من النظام', 'guards'),
('guards.export', 'تصدير البوابين', 'تصدير بيانات البوابين إلى Excel/PDF', 'guards'),

-- صلاحيات المدارس
('schools.view', 'عرض المدارس', 'عرض قائمة المدارس والبحث فيها', 'schools'),
('schools.create', 'إضافة مدرسة', 'إضافة مدارس جديدة للنظام', 'schools'),
('schools.edit', 'تعديل المدارس', 'تعديل بيانات المدارس الموجودة', 'schools'),
('schools.delete', 'حذف المدارس', 'حذف المدارس من النظام', 'schools'),

-- صلاحيات العمليات
('operations.view', 'عرض العمليات', 'عرض سجل العمليات والأنشطة', 'operations'),
('operations.transfer', 'نقل البوابين', 'تنفيذ عمليات نقل البوابين بين المدارس', 'operations'),
('operations.reassign', 'إعادة توجيه البوابين', 'إعادة توجيه البوابين غير المرتبطين', 'operations'),
('operations.bulk_delete', 'الحذف الجماعي', 'حذف مجموعة من البوابين أو المدارس', 'operations'),
('operations.export', 'تصدير العمليات', 'تصدير سجل العمليات', 'operations'),

-- صلاحيات المخالفات
('violations.view', 'عرض المخالفات', 'عرض قائمة المخالفات والشكاوى', 'violations'),
('violations.create', 'إضافة مخالفة', 'إضافة مخالفات وشكاوى جديدة', 'violations'),
('violations.edit', 'تعديل المخالفات', 'تعديل المخالفات الموجودة', 'violations'),
('violations.delete', 'حذف المخالفات', 'حذف المخالفات من النظام', 'violations'),

-- صلاحيات الاستيراد
('import.data', 'استيراد البيانات', 'استيراد البوابين والمدارس من ملفات Excel/CSV', 'import'),

-- صلاحيات التقارير
('reports.dashboard', 'لوحة القيادة', 'عرض الإحصائيات والتقارير الرئيسية', 'reports'),
('reports.inquiry', 'الاستعلامات', 'البحث المتقدم والاستعلام عن البيانات', 'reports'),

-- صلاحيات إدارة المستخدمين
('users.view', 'عرض المستخدمين', 'عرض قائمة المستخدمين في النظام', 'users'),
('users.create', 'إضافة مستخدم', 'إضافة مستخدمين جدد للنظام', 'users'),
('users.edit', 'تعديل المستخدمين', 'تعديل بيانات المستخدمين', 'users'),
('users.delete', 'حذف المستخدمين', 'حذف المستخدمين من النظام', 'users'),
('users.manage_permissions', 'إدارة الصلاحيات', 'منح وإلغاء صلاحيات المستخدمين', 'users'),

-- صلاحيات النظام
('system.settings', 'إعدادات النظام', 'الوصول لإعدادات النظام العامة', 'system'),
('system.logs', 'سجلات النظام', 'عرض سجلات النظام والأنشطة', 'system');

-- منح صلاحيات كاملة للمشرف العام الافتراضي
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u, permissions p
WHERE u.username = 'admin';

-- منح الصلاحيات للأدوار
GRANT SELECT ON permissions TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON user_permissions TO anon, authenticated;