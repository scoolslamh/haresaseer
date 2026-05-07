-- إصلاح قيود جدول الحراس وتحديث القيم القديمة

-- 1. حذف القيود الموجودة
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_insurance_check;
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_appointment_category_check;

-- 2. تحديث القيم القديمة
UPDATE guards SET insurance = 'يصرف بدل' WHERE insurance = 'نعم';
UPDATE guards SET insurance = 'لا يصرف'  WHERE insurance = 'لا';

-- 3. إضافة القيود الصحيحة
ALTER TABLE guards ADD CONSTRAINT guards_insurance_check
  CHECK (insurance IN ('', 'يصرف بدل', 'لا يصرف'));

ALTER TABLE guards ADD CONSTRAINT guards_appointment_category_check
  CHECK (appointment_category IN ('', 'المستخدمين', 'بند الأجور', 'الرسميين'));
