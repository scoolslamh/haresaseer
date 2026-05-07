/*
  # تحديث حقول جدول الحراس

  1. إعادة تسمية حقل file → job_title (المسمى الوظيفي)
  2. إضافة حقل rank (المرتبة/الدرجة)
  3. إضافة حقل appointment_category (فئة التعيين)
  4. تحديث قيم الحالة (status)
*/

-- ترحيل القيم القديمة قبل تغيير القيد
UPDATE guards SET status = 'إيقاف الراتب مؤقتاً' WHERE status = 'منقطع';
UPDATE guards SET status = 'مكفوف اليد'           WHERE status = 'مبعد عن المدارس';
UPDATE guards SET status = 'إجازة مرضية'          WHERE status = 'إجازة';

-- حذف القيد القديم على status
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_status_check;

-- إضافة القيد الجديد على status
ALTER TABLE guards ADD CONSTRAINT guards_status_check
  CHECK (status IN (
    'على رأس العمل',
    'إجازة أمومة/رعاية مولود',
    'إجازة مرضية',
    'إيقاف الراتب مؤقتاً',
    'مجاز استثنائياً',
    'مكفوف اليد',
    'مكلف داخلي'
  ));

-- إعادة تسمية عمود file إلى job_title
ALTER TABLE guards RENAME COLUMN file TO job_title;

-- إضافة عمود المرتبة/الدرجة
ALTER TABLE guards ADD COLUMN IF NOT EXISTS rank text DEFAULT '';

-- إضافة عمود فئة التعيين
ALTER TABLE guards ADD COLUMN IF NOT EXISTS appointment_category text DEFAULT ''
  CHECK (appointment_category IN ('', 'المستخدمين', 'بند الأجور'));
