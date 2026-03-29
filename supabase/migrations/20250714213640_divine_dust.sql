/*
  # تحديث قيد نوع العملية

  1. تحديث القيد
    - حذف القيد القديم الذي يحتوي على أنواع العمليات القديمة
    - إنشاء قيد جديد يشمل جميع أنواع العمليات الجديدة

  2. أنواع العمليات المدعومة
    - نقل
    - إعادة توجيه  
    - إضافة بواب
    - إضافة مدرسة
    - تعديل بيانات
    - حذف بواب
    - حذف مدرسة
    - حذف مجموعة
    - إضافة مخالفة
*/

-- حذف القيد القديم
ALTER TABLE operations DROP CONSTRAINT IF EXISTS operations_operation_type_check;

-- إنشاء القيد الجديد مع جميع أنواع العمليات
ALTER TABLE operations ADD CONSTRAINT operations_operation_type_check 
CHECK (operation_type = ANY (ARRAY[
  'نقل'::text,
  'إعادة توجيه'::text, 
  'إضافة بواب'::text,
  'إضافة مدرسة'::text,
  'تعديل بيانات'::text,
  'حذف بواب'::text,
  'حذف مدرسة'::text,
  'حذف مجموعة'::text,
  'إضافة مخالفة'::text
]));