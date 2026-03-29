/*
  # جعل رقم الملف اختيارياً في جدول المدارس

  1. تعديل العمود
    - تغيير عمود `file_number` في جدول `schools` ليصبح اختيارياً (nullable)
    - إزالة قيد NOT NULL من العمود

  2. الأمان
    - استخدام ALTER TABLE لتعديل العمود بأمان
    - التأكد من عدم وجود تضارب مع البيانات الموجودة
*/

-- جعل عمود file_number اختيارياً في جدول المدارس
ALTER TABLE schools 
ALTER COLUMN file_number DROP NOT NULL;

-- إضافة قيمة افتراضية فارغة للسجلات الموجودة التي قد تحتوي على null
UPDATE schools 
SET file_number = '' 
WHERE file_number IS NULL;