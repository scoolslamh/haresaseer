/*
  # إضافة سياسة INSERT للمستخدمين

  1. الأمان
    - إضافة سياسة INSERT للمستخدمين المصادق عليهم
    - السماح بإنشاء مستخدمين جدد

  2. الصلاحيات
    - منح صلاحيات INSERT على جدول users
*/

-- إضافة سياسة INSERT للمستخدمين
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- منح صلاحيات INSERT على جدول users
GRANT INSERT ON users TO authenticated;

-- تحديث schema cache
NOTIFY pgrst, 'reload schema';