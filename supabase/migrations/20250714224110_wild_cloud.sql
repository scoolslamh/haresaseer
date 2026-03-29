/*
  # إضافة حقل الملف للبوابين

  1. تعديل الجدول
    - إضافة عمود `file` إلى جدول `guards`
    - الحقل اختياري (nullable)
    - نوع البيانات: text

  2. الفهارس
    - إضافة فهرس للبحث السريع في الملفات
*/

-- إضافة عمود الملف إلى جدول البوابين
ALTER TABLE guards ADD COLUMN IF NOT EXISTS file text;

-- إضافة فهرس للبحث في الملفات
CREATE INDEX IF NOT EXISTS idx_guards_file ON guards(file);

-- إضافة تعليق على العمود
COMMENT ON COLUMN guards.file IS 'رقم أو اسم الملف الخاص بالبواب (اختياري)';