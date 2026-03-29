/*
  # إعداد نظام الصلاحيات المحدث

  1. الجداول
    - التحقق من وجود جدول `permissions` وإنشاؤه إذا لم يكن موجوداً
    - التحقق من وجود جدول `user_permissions` وإنشاؤه إذا لم يكن موجوداً
  
  2. الأمان
    - تفعيل RLS على الجداول
    - إضافة سياسات الأمان المناسبة
  
  3. البيانات الأساسية
    - إدراج الصلاحيات الأساسية للنظام
    - ربط المشرف العام بجميع الصلاحيات
*/

-- التحقق من وجود جدول الصلاحيات وإنشاؤه إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'permissions'
  ) THEN
    CREATE TABLE permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      display_name text NOT NULL,
      description text DEFAULT '',
      module text NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- التحقق من وجود جدول ربط المستخدمين بالصلاحيات وإنشاؤه إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_permissions'
  ) THEN
    CREATE TABLE user_permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      granted_by uuid REFERENCES users(id),
      granted_at timestamptz DEFAULT now(),
      UNIQUE(user_id, permission_id)
    );
  END IF;
END $$;

-- تفعيل RLS إذا لم يكن مفعلاً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'permissions' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'user_permissions' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- إضافة سياسات الأمان إذا لم تكن موجودة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'permissions' AND policyname = 'permissions_select_policy'
  ) THEN
    CREATE POLICY "permissions_select_policy" ON permissions
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_permissions' AND policyname = 'user_permissions_select_policy'
  ) THEN
    CREATE POLICY "user_permissions_select_policy" ON user_permissions
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_permissions' AND policyname = 'user_permissions_insert_policy'
  ) THEN
    CREATE POLICY "user_permissions_insert_policy" ON user_permissions
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_permissions' AND policyname = 'user_permissions_delete_policy'
  ) THEN
    CREATE POLICY "user_permissions_delete_policy" ON user_permissions
      FOR DELETE TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- إضافة الفهارس إذا لم تكن موجودة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'user_permissions' AND indexname = 'idx_user_permissions_user_id'
  ) THEN
    CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'user_permissions' AND indexname = 'idx_user_permissions_permission_id'
  ) THEN
    CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'permissions' AND indexname = 'idx_permissions_module'
  ) THEN
    CREATE INDEX idx_permissions_module ON permissions(module);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'permissions' AND indexname = 'idx_permissions_name'
  ) THEN
    CREATE INDEX idx_permissions_name ON permissions(name);
  END IF;
END $$;

-- إدراج الصلاحيات الأساسية إذا لم تكن موجودة
INSERT INTO permissions (name, display_name, description, module) 
SELECT * FROM (VALUES
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
  ('system.logs', 'سجلات النظام', 'عرض سجلات النظام والأنشطة', 'system')
) AS new_permissions(name, display_name, description, module)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permissions.name = new_permissions.name
);

-- منح صلاحيات كاملة للمشرف العام الافتراضي إذا لم تكن ممنوحة
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u, permissions p
WHERE u.username = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_permissions up 
  WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- منح الصلاحيات للأدوار
DO $$
BEGIN
  -- التحقق من وجود الصلاحيات قبل منحها
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
    GRANT SELECT ON permissions TO anon, authenticated;
    GRANT SELECT, INSERT, DELETE ON user_permissions TO anon, authenticated;
  END IF;
END $$;