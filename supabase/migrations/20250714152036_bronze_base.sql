/*
  # إصلاح صلاحيات جدول الحراس

  1. إزالة السياسات الحالية
  2. إنشاء سياسات جديدة تسمح للمستخدمين المجهولين بالوصول
  3. التأكد من تفعيل RLS بشكل صحيح

  هذا التحديث يحل مشكلة "permission denied for schema public"
*/

-- إزالة السياسات الحالية إن وجدت
DROP POLICY IF EXISTS "السماح بقراءة جميع الحراس" ON guards;
DROP POLICY IF EXISTS "السماح بإضافة حراس جدد" ON guards;
DROP POLICY IF EXISTS "السماح بتحديث بيانات الحراس" ON guards;
DROP POLICY IF EXISTS "السماح بحذف الحراس" ON guards;

-- التأكد من تفعيل RLS
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات جديدة تسمح للجميع بالوصول
CREATE POLICY "allow_all_select" ON guards
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "allow_all_insert" ON guards
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow_all_update" ON guards
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_delete" ON guards
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- منح صلاحيات إضافية للمستخدمين المجهولين
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON guards TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;