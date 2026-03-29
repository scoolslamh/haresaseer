/*
  # إنشاء جدول حراس المدارس المحدث

  1. جداول جديدة
    - `guards`
      - `id` (uuid, primary key)
      - `region` (المنطقة - نص)
      - `governorate` (المحافظة - نص)
      - `city` (المدينة - نص)
      - `school_name` (اسم المدرسة - نص، مطلوب)
      - `principal_name` (المدير/ة - نص)
      - `principal_mobile` (جوال المدير - نص)
      - `guard_name` (اسم البواب - نص، مطلوب)
      - `civil_id` (السجل المدني - نص)
      - `gender` (الجنس - نص)
      - `birth_date` (تاريخ الميلاد - تاريخ)
      - `insurance` (التأمينات - نص)
      - `start_date` (تاريخ المباشرة - تاريخ)
      - `mobile` (رقم الجوال - نص)
      - `iban` (الآيبان - نص)
      - `notes` (ملاحظات - نص)
      - `created_at` (تاريخ الإنشاء)
      - `updated_at` (تاريخ التحديث)

  2. الأمان
    - تفعيل RLS على جدول `guards`
    - إضافة سياسات للمستخدمين المصادق عليهم
*/

-- حذف الجدول القديم إذا كان موجوداً
DROP TABLE IF EXISTS guards;

-- إنشاء الجدول الجديد
CREATE TABLE guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text DEFAULT '',
  governorate text DEFAULT '',
  city text DEFAULT '',
  school_name text NOT NULL,
  principal_name text DEFAULT '',
  principal_mobile text DEFAULT '',
  guard_name text NOT NULL,
  civil_id text DEFAULT '',
  gender text DEFAULT '',
  birth_date date,
  insurance text DEFAULT '',
  start_date date DEFAULT CURRENT_DATE,
  mobile text DEFAULT '',
  iban text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات الأمنية
CREATE POLICY "المستخدمون يمكنهم قراءة جميع الحراس"
  ON guards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "المستخدمون يمكنهم إضافة حراس جدد"
  ON guards
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "المستخدمون يمكنهم تحديث الحراس"
  ON guards
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "المستخدمون يمكنهم حذف الحراس"
  ON guards
  FOR DELETE
  TO authenticated
  USING (true);

-- إنشاء فهارس للبحث السريع
CREATE INDEX idx_guards_guard_name ON guards(guard_name);
CREATE INDEX idx_guards_school_name ON guards(school_name);
CREATE INDEX idx_guards_region ON guards(region);
CREATE INDEX idx_guards_city ON guards(city);
CREATE INDEX idx_guards_civil_id ON guards(civil_id);

-- إنشاء دالة تحديث التاريخ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_guards_updated_at
    BEFORE UPDATE ON guards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();