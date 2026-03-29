/*
  # إصلاح سياسة إدراج المستخدمين

  1. حذف السياسات الموجودة
  2. إنشاء سياسة جديدة تسمح بالإدراج للجلسات المؤقتة
  3. منح الصلاحيات المطلوبة
*/

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;

-- إنشاء سياسة جديدة تسمح بالإدراج للجلسات المصادق عليها (بما في ذلك المؤقتة)
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

-- التأكد من تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- منح الصلاحيات المطلوبة
GRANT INSERT ON users TO authenticated;
GRANT INSERT ON users TO anon;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT UPDATE ON users TO authenticated;
GRANT DELETE ON users TO authenticated;