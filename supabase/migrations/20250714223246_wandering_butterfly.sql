/*
  # حذف عمود رقم الملف من جدول المدارس

  1. التغييرات
    - حذف القيد الفريد لعمود file_number
    - حذف الفهرس المرتبط بعمود file_number  
    - حذف عمود file_number من جدول schools

  2. الأمان
    - استخدام IF EXISTS لتجنب الأخطاء
    - حذف القيود والفهارس قبل حذف العمود
*/

-- حذف القيد الفريد
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'schools_file_number_key' 
    AND table_name = 'schools'
  ) THEN
    ALTER TABLE schools DROP CONSTRAINT schools_file_number_key;
  END IF;
END $$;

-- حذف الفهرس الفريد
DROP INDEX IF EXISTS schools_file_number_key;

-- حذف الفهرس العادي
DROP INDEX IF EXISTS idx_schools_file_number;

-- حذف العمود
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schools' 
    AND column_name = 'file_number'
  ) THEN
    ALTER TABLE schools DROP COLUMN file_number;
  END IF;
END $$;