/*
  # إعداد التكامل مع نظام Supabase Auth

  1. تحديث جدول المستخدمين
    - إضافة عمود `auth_id` للربط مع `auth.users`
    - تحديث القيود والفهارس
  
  2. الدوال المساعدة
    - دالة للحصول على دور المستخدم الحالي
    - دالة للحصول على معرف المستخدم الحالي
  
  3. Trigger للملفات الشخصية
    - إنشاء ملف تعريف تلقائي عند تسجيل مستخدم جديد
  
  4. تحديث سياسات RLS
    - استخدام نظام Supabase Auth في السياسات
*/

-- إضافة عمود auth_id إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- إضافة فهرس على auth_id إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'users' AND indexname = 'idx_users_auth_id'
  ) THEN
    CREATE INDEX idx_users_auth_id ON users(auth_id);
  END IF;
END $$;

-- دالة للحصول على دور المستخدم الحالي
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE auth_id = auth.uid();
  
  RETURN COALESCE(user_role, 'data_entry');
END;
$$;

-- دالة للحصول على معرف المستخدم الحالي في جدول users
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id
  FROM users
  WHERE auth_id = auth.uid();
  
  RETURN user_id;
END;
$$;

-- دالة للحصول على بيانات المستخدم الحالي
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(
  id uuid,
  username text,
  role text,
  full_name text,
  email text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.role,
    u.full_name,
    u.email,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.auth_id = auth.uid() AND u.is_active = true;
END;
$$;

-- دالة لإنشاء ملف تعريف تلقائي عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_metadata jsonb;
  username_val text;
  full_name_val text;
  role_val text;
BEGIN
  -- الحصول على البيانات من user metadata
  user_metadata := NEW.raw_user_meta_data;
  
  username_val := COALESCE(user_metadata->>'username', split_part(NEW.email, '@', 1));
  full_name_val := COALESCE(user_metadata->>'full_name', username_val);
  role_val := COALESCE(user_metadata->>'role', 'data_entry');
  
  -- إنشاء ملف تعريف في جدول users
  INSERT INTO public.users (
    auth_id,
    username,
    full_name,
    email,
    role,
    is_active
  ) VALUES (
    NEW.id,
    username_val,
    full_name_val,
    NEW.email,
    role_val,
    true
  );
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- تحديث سياسات RLS لاستخدام نظام Supabase Auth

-- سياسات جدول المستخدمين
DROP POLICY IF EXISTS "users_select_policy" ON users;
CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "users_insert_policy" ON users;
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "users_update_policy" ON users;
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO authenticated
  USING (
    auth_id = auth.uid() OR get_current_user_role() = 'admin'
  )
  WITH CHECK (
    auth_id = auth.uid() OR get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "users_delete_policy" ON users;
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'admin');

-- سياسات جدول البوابين
DROP POLICY IF EXISTS "guards_select_policy" ON guards;
CREATE POLICY "guards_select_policy" ON guards
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "guards_insert_policy" ON guards;
CREATE POLICY "guards_insert_policy" ON guards
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor', 'data_entry')
  );

DROP POLICY IF EXISTS "guards_update_policy" ON guards;
CREATE POLICY "guards_update_policy" ON guards
  FOR UPDATE TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'supervisor', 'data_entry')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor', 'data_entry')
  );

DROP POLICY IF EXISTS "guards_delete_policy" ON guards;
CREATE POLICY "guards_delete_policy" ON guards
  FOR DELETE TO authenticated
  USING (get_current_user_role() IN ('admin', 'supervisor'));

-- سياسات جدول المدارس
DROP POLICY IF EXISTS "schools_select_policy" ON schools;
CREATE POLICY "schools_select_policy" ON schools
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "schools_insert_policy" ON schools;
CREATE POLICY "schools_insert_policy" ON schools
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor')
  );

DROP POLICY IF EXISTS "schools_update_policy" ON schools;
CREATE POLICY "schools_update_policy" ON schools
  FOR UPDATE TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'supervisor')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor')
  );

DROP POLICY IF EXISTS "schools_delete_policy" ON schools;
CREATE POLICY "schools_delete_policy" ON schools
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'admin');

-- سياسات جدول العمليات
DROP POLICY IF EXISTS "operations_select_policy" ON operations;
CREATE POLICY "operations_select_policy" ON operations
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "operations_insert_policy" ON operations;
CREATE POLICY "operations_insert_policy" ON operations
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor')
  );

DROP POLICY IF EXISTS "operations_update_policy" ON operations;
CREATE POLICY "operations_update_policy" ON operations
  FOR UPDATE TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'supervisor')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor')
  );

DROP POLICY IF EXISTS "operations_delete_policy" ON operations;
CREATE POLICY "operations_delete_policy" ON operations
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'admin');

-- سياسات جدول المخالفات
DROP POLICY IF EXISTS "violations_select_policy" ON violations;
CREATE POLICY "violations_select_policy" ON violations
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "violations_insert_policy" ON violations;
CREATE POLICY "violations_insert_policy" ON violations
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor')
  );

DROP POLICY IF EXISTS "violations_update_policy" ON violations;
CREATE POLICY "violations_update_policy" ON violations
  FOR UPDATE TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'supervisor')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'supervisor')
  );

DROP POLICY IF EXISTS "violations_delete_policy" ON violations;
CREATE POLICY "violations_delete_policy" ON violations
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'admin');