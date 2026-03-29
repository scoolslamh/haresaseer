/*
  # إصلاح صلاحيات جدول المستخدمين

  1. الأمان
    - تمكين RLS على جدول `users`
    - إضافة سياسة للسماح بقراءة المستخدمين النشطين
    - منح صلاحيات SELECT للدور anon

  2. الملاحظات
    - يسمح للمستخدمين المجهولين بقراءة بيانات المستخدمين للمصادقة
    - محدود فقط للمستخدمين النشطين (is_active = true)
*/

-- تمكين RLS على جدول المستخدمين
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "allow_all_users" ON users;
DROP POLICY IF EXISTS "Users can read active accounts" ON users;

-- إنشاء سياسة للسماح بقراءة المستخدمين النشطين
CREATE POLICY "Users can read active accounts"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- منح صلاحيات إضافية للدور anon
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON users TO anon;

-- التأكد من وجود الفهارس المطلوبة
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);