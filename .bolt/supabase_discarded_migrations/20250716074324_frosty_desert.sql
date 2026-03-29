/*
  # إصلاح سياسات RLS لجدول المستخدمين

  1. المشكلة
    - سياسة INSERT مفقودة أو مقيدة جداً لجدول users
    - المستخدمون لا يستطيعون إضافة مستخدمين جدد

  2. الحل
    - إضافة سياسة INSERT مناسبة
    - السماح للمستخدمين المصرح لهم بإضافة مستخدمين جدد
    - تحديث السياسات الموجودة
*/

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- سياسة SELECT: السماح لجميع المستخدمين المصادق عليهم بعرض المستخدمين النشطين
CREATE POLICY "users_select_policy" ON users
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- سياسة INSERT: السماح للمستخدمين المصادق عليهم بإضافة مستخدمين جدد
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- سياسة UPDATE: السماح للمستخدمين المصادق عليهم بتحديث المستخدمين
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- سياسة DELETE: السماح للمستخدمين المصادق عليهم بحذف المستخدمين (تعطيل فقط)
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE 
  TO authenticated
  USING (true);

-- التأكد من أن RLS مفعل
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- منح الصلاحيات المطلوبة
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated;

-- إنشاء فهرس للأداء إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);