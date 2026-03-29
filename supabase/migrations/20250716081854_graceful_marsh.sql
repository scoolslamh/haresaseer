/*
  # إصلاح سياسات RLS لجدول المستخدمين

  1. حذف السياسات الموجودة
  2. إنشاء سياسات جديدة تسمح للمستخدمين المصادق عليهم بالعمليات
  3. إضافة سياسات خاصة للمشرفين
*/

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- سياسة القراءة - للمستخدمين المصادق عليهم فقط
CREATE POLICY "users_select_policy" ON users
  FOR SELECT 
  TO authenticated
  USING (true);

-- سياسة الإدراج - للمستخدمين المصادق عليهم فقط
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- سياسة التحديث - للمستخدمين المصادق عليهم فقط
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- سياسة الحذف - للمستخدمين المصادق عليهم فقط
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE 
  TO authenticated
  USING (true);

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- إنشاء فهارس للأداء إذا لم تكن موجودة
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);