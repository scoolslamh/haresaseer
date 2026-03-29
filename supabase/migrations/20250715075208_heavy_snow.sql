/*
  # إعادة إنشاء نظام الصلاحيات مع العلاقات الصحيحة

  1. الجداول الجديدة
    - `permissions` - الصلاحيات المتاحة في النظام
    - `user_permissions` - ربط المستخدمين بالصلاحيات

  2. العلاقات
    - إضافة foreign key constraints صريحة
    - تحديث schema cache لـ PostgREST

  3. الأمان
    - تفعيل RLS على الجداول الجديدة
    - سياسات أمان مناسبة
*/

-- حذف الجداول إذا كانت موجودة (لإعادة الإنشاء)
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- إنشاء جدول الصلاحيات
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text DEFAULT '',
  module text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- إنشاء جدول ربط المستخدمين بالصلاحيات
CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  granted_by uuid,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- إضافة foreign key constraints صريحة
ALTER TABLE user_permissions 
ADD CONSTRAINT fk_user_permissions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_permissions 
ADD CONSTRAINT fk_user_permissions_permission_id 
FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

ALTER TABLE user_permissions 
ADD CONSTRAINT fk_user_permissions_granted_by 
FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;

-- تفعيل RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للصلاحيات
CREATE POLICY "permissions_select_policy" ON permissions
  FOR SELECT TO anon, authenticated
  USING (true);

-- سياسات الأمان لربط المستخدمين بالصلاحيات
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
CREATE INDEX idx_permissions_name ON permissions(name);

-- منح الصلاحيات للأدوار
GRANT SELECT ON permissions TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON user_permissions TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

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
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- البحث عن المستخدم admin
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin' LIMIT 1;
    
    -- إذا وُجد المستخدم، منحه جميع الصلاحيات
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO user_permissions (user_id, permission_id)
        SELECT admin_user_id, p.id
        FROM permissions p
        ON CONFLICT (user_id, permission_id) DO NOTHING;
    END IF;
END $$;

-- تحديث schema cache
NOTIFY pgrst, 'reload schema';