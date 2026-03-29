/*
  # إصلاح سياسات المستخدمين - الخطوة 1

  1. حذف السياسات الموجودة
  2. إنشاء سياسات جديدة محسنة
  3. منح الصلاحيات المطلوبة
*/

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- إنشاء سياسات جديدة محسنة للمستخدمين
CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE TO authenticated
  USING (true);

-- منح الصلاحيات المطلوبة
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated;

-- التأكد من تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- إنشاء فهارس للأداء إذا لم تكن موجودة
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);