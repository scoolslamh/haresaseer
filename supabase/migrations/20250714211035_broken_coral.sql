/*
  # إصلاح قيد حالة البوابين

  1. تحديث القيد
    - حذف القيد القديم للحالة
    - إنشاء قيد جديد يدعم القيم المحدثة
    
  2. تحديث البيانات الموجودة
    - تحويل القيم القديمة إلى القيم الجديدة
*/

-- حذف القيد القديم
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_status_check;

-- تحديث البيانات الموجودة لتتوافق مع القيم الجديدة
UPDATE guards 
SET status = CASE 
  WHEN status = 'نشط' THEN 'على رأس العمل'
  WHEN status = 'غير نشط' THEN 'منقطع'
  WHEN status = 'منقول' THEN 'إجازة'
  WHEN status = 'مفصول' THEN 'مبعد عن المدارس'
  ELSE status
END;

-- إنشاء القيد الجديد مع القيم المحدثة
ALTER TABLE guards 
ADD CONSTRAINT guards_status_check 
CHECK (status = ANY (ARRAY['على رأس العمل'::text, 'منقطع'::text, 'مبعد عن المدارس'::text, 'إجازة'::text]));