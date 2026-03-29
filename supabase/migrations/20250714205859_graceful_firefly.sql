/*
  # إصلاح سياسات RLS الكاملة

  1. إنشاء سياسات RLS صحيحة لجميع الجداول
  2. منح الصلاحيات المطلوبة للأدوار
  3. تمكين الوصول للدور anon و authenticated
*/

-- إزالة السياسات الموجودة وإعادة إنشاؤها
DROP POLICY IF EXISTS "Enable read access for all users" ON guards;
DROP POLICY IF EXISTS "Enable insert for all users" ON guards;
DROP POLICY IF EXISTS "Enable update for all users" ON guards;
DROP POLICY IF EXISTS "Enable delete for all users" ON guards;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON guards;

DROP POLICY IF EXISTS "Enable read access for all users" ON schools;
DROP POLICY IF EXISTS "Enable insert for all users" ON schools;
DROP POLICY IF EXISTS "Enable update for all users" ON schools;
DROP POLICY IF EXISTS "Enable delete for all users" ON schools;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON schools;

DROP POLICY IF EXISTS "Enable read access for all users" ON operations;
DROP POLICY IF EXISTS "Enable insert for all users" ON operations;
DROP POLICY IF EXISTS "Enable update for all users" ON operations;
DROP POLICY IF EXISTS "Enable delete for all users" ON operations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON operations;

DROP POLICY IF EXISTS "Enable read access for all users" ON violations;
DROP POLICY IF EXISTS "Enable insert for all users" ON violations;
DROP POLICY IF EXISTS "Enable update for all users" ON violations;
DROP POLICY IF EXISTS "Enable delete for all users" ON violations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON violations;

-- تمكين RLS على جميع الجداول
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات شاملة لجدول guards
CREATE POLICY "guards_select_policy" ON guards
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "guards_insert_policy" ON guards
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "guards_update_policy" ON guards
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "guards_delete_policy" ON guards
  FOR DELETE TO anon, authenticated
  USING (true);

-- إنشاء سياسات شاملة لجدول schools
CREATE POLICY "schools_select_policy" ON schools
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "schools_insert_policy" ON schools
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "schools_update_policy" ON schools
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "schools_delete_policy" ON schools
  FOR DELETE TO anon, authenticated
  USING (true);

-- إنشاء سياسات شاملة لجدول operations
CREATE POLICY "operations_select_policy" ON operations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "operations_insert_policy" ON operations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "operations_update_policy" ON operations
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "operations_delete_policy" ON operations
  FOR DELETE TO anon, authenticated
  USING (true);

-- إنشاء سياسات شاملة لجدول violations
CREATE POLICY "violations_select_policy" ON violations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "violations_insert_policy" ON violations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "violations_update_policy" ON violations
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "violations_delete_policy" ON violations
  FOR DELETE TO anon, authenticated
  USING (true);

-- إنشاء سياسات لجدول users
DROP POLICY IF EXISTS "Users can read active accounts" ON users;

CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- منح الصلاحيات المباشرة للأدوار
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- منح صلاحيات خاصة للجداول
GRANT SELECT, INSERT, UPDATE, DELETE ON guards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schools TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON operations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON violations TO anon, authenticated;
GRANT SELECT, UPDATE ON users TO anon, authenticated;

-- منح صلاحيات التسلسل
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;