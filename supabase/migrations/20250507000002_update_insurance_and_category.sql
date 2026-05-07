/*
  # تحديث حقل التأمين وفئة التعيين

  1. تغيير قيم حقل insurance: نعم/لا → يصرف بدل/لا يصرف
  2. إضافة خيار "الرسميين" لحقل appointment_category
*/

-- ترحيل القيم القديمة أولاً
UPDATE guards SET insurance = 'يصرف بدل' WHERE insurance = 'نعم';
UPDATE guards SET insurance = 'لا يصرف'  WHERE insurance = 'لا';

-- حذف القيد القديم وإضافة الجديد
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_insurance_check;
ALTER TABLE guards ADD CONSTRAINT guards_insurance_check
  CHECK (insurance IN ('', 'يصرف بدل', 'لا يصرف'));

-- تحديث قيد فئة التعيين لإضافة الرسميين
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_appointment_category_check;
ALTER TABLE guards ADD CONSTRAINT guards_appointment_category_check
  CHECK (appointment_category IN ('', 'المستخدمين', 'بند الأجور', 'الرسميين'));
