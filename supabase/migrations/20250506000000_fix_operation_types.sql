/*
  # تحديث قيد أنواع العمليات

  يتوافق القيد الجديد مع الأنواع المستخدمة فعلياً في الكود:
  - إضافة حارس (كان: إضافة بواب)
  - حذف حارس (كان: حذف بواب)
  - إضافة مستخدم (جديد)
  - حذف مستخدم (جديد)
*/

ALTER TABLE operations DROP CONSTRAINT IF EXISTS operations_operation_type_check;

ALTER TABLE operations ADD CONSTRAINT operations_operation_type_check
CHECK (operation_type = ANY (ARRAY[
  'نقل'::text,
  'إعادة توجيه'::text,
  'إضافة حارس'::text,
  'إضافة مدرسة'::text,
  'تعديل بيانات'::text,
  'حذف حارس'::text,
  'حذف مدرسة'::text,
  'حذف مجموعة'::text,
  'إضافة مخالفة'::text,
  'إضافة مستخدم'::text,
  'حذف مستخدم'::text
]));
