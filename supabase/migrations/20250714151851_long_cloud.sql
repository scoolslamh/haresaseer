/*
  # إصلاح سياسات الأمان لجدول الحراس

  1. تحديث السياسات الموجودة
    - تغيير السياسات من `authenticated` إلى `anon` و `authenticated`
    - السماح للمستخدمين غير المسجلين بالوصول للبيانات

  2. السياسات المحدثة
    - قراءة البيانات: متاحة للجميع
    - إضافة البيانات: متاحة للجميع  
    - تحديث البيانات: متاحة للجميع
    - حذف البيانات: متاحة للجميع

  3. ملاحظات مهمة
    - هذا التحديث يسمح بالوصول العام للبيانات
    - مناسب لتطبيقات إدارية داخلية
*/

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "المستخدمون يمكنهم قراءة جميع الحر" ON guards;
DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة حراس جدد" ON guards;
DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث الحراس" ON guards;
DROP POLICY IF EXISTS "المستخدمون يمكنهم حذف الحراس" ON guards;

-- إنشاء سياسات جديدة تسمح بالوصول العام
CREATE POLICY "السماح بقراءة جميع الحراس"
  ON guards
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "السماح بإضافة حراس جدد"
  ON guards
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "السماح بتحديث بيانات الحراس"
  ON guards
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "السماح بحذف الحراس"
  ON guards
  FOR DELETE
  TO anon, authenticated
  USING (true);