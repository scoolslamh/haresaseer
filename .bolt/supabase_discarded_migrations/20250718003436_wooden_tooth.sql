/*
  # إعداد نظام Supabase Auth الأصلي

  1. إعداد الجداول
    - ربط جدول users مع auth.users
    - إضافة trigger لإنشاء ملف تعريف تلقائي
    
  2. الأمان
    - تمكين RLS على جدول users
    - إضافة سياسات الأمان
    
  3. الدوال المساعدة
    - دالة للحصول على دور المستخدم الحالي
*/

-- إضافة عمود auth_id لربط المستخدمين مع auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- إنشاء فهرس على auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

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

-- دالة للحصول على بيانات المستخدم الحالي
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(
  id uuid,
  auth_id uuid,
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
    u.auth_id,
    u.username,
    u.role,
    u.full_name,
    u.email,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.auth_id = auth.uid();
END;
$$;

-- دالة لإنشاء ملف تعريف مستخدم جديد تلقائيًا
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (auth_id, username, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'data_entry'),
    true
  );
  RETURN NEW;
END;
$$;

-- إنشاء trigger لإنشاء ملف تعريف تلقائي عند تسجيل مستخدم جديد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- تحديث سياسات RLS لجدول users
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- سياسة للقراءة: المستخدمون يمكنهم قراءة بياناتهم الخاصة
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- سياسة للتحديث: المستخدمون يمكنهم تحديث بياناتهم الخاصة
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- سياسة للمشرفين: يمكنهم قراءة جميع المستخدمين
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- سياسة للمشرفين: يمكنهم إدارة المستخدمين
CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- تحديث سياسات RLS للجداول الأخرى لاستخدام get_current_user_role()
-- Guards
DROP POLICY IF EXISTS "guards_select_policy" ON guards;
DROP POLICY IF EXISTS "guards_insert_policy" ON guards;
DROP POLICY IF EXISTS "guards_update_policy" ON guards;
DROP POLICY IF EXISTS "guards_delete_policy" ON guards;

CREATE POLICY "guards_select_policy"
  ON guards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "guards_insert_policy"
  ON guards
  FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "guards_update_policy"
  ON guards
  FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'supervisor'))
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "guards_delete_policy"
  ON guards
  FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- Schools
DROP POLICY IF EXISTS "schools_select_policy" ON schools;
DROP POLICY IF EXISTS "schools_insert_policy" ON schools;
DROP POLICY IF EXISTS "schools_update_policy" ON schools;
DROP POLICY IF EXISTS "schools_delete_policy" ON schools;

CREATE POLICY "schools_select_policy"
  ON schools
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "schools_insert_policy"
  ON schools
  FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "schools_update_policy"
  ON schools
  FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'supervisor'))
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "schools_delete_policy"
  ON schools
  FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- Operations
DROP POLICY IF EXISTS "operations_select_policy" ON operations;
DROP POLICY IF EXISTS "operations_insert_policy" ON operations;
DROP POLICY IF EXISTS "operations_update_policy" ON operations;
DROP POLICY IF EXISTS "operations_delete_policy" ON operations;

CREATE POLICY "operations_select_policy"
  ON operations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "operations_insert_policy"
  ON operations
  FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "operations_update_policy"
  ON operations
  FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'supervisor'))
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "operations_delete_policy"
  ON operations
  FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- Violations
DROP POLICY IF EXISTS "violations_select_policy" ON violations;
DROP POLICY IF EXISTS "violations_insert_policy" ON violations;
DROP POLICY IF EXISTS "violations_update_policy" ON violations;
DROP POLICY IF EXISTS "violations_delete_policy" ON violations;

CREATE POLICY "violations_select_policy"
  ON violations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "violations_insert_policy"
  ON violations
  FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "violations_update_policy"
  ON violations
  FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'supervisor'))
  WITH CHECK (get_current_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "violations_delete_policy"
  ON violations
  FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');