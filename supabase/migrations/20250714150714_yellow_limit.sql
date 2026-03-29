/*
  # إنشاء جدول حراس المدارس

  1. الجداول الجديدة
    - `guards`
      - `id` (uuid, primary key)
      - `name` (text, اسم الحارس)
      - `phone` (text, رقم الهاتف)
      - `school_name` (text, اسم المدرسة)
      - `shift` (text, الوردية - صباحية/مسائية)
      - `hire_date` (date, تاريخ التوظيف)
      - `salary` (numeric, الراتب)
      - `status` (text, الحالة - نشط/غير نشط)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جدول `guards`
    - إضافة سياسة للمستخدمين المصرح لهم
*/

CREATE TABLE IF NOT EXISTS guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  school_name text NOT NULL,
  shift text NOT NULL DEFAULT 'صباحية',
  hire_date date DEFAULT CURRENT_DATE,
  salary numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'نشط',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_guards_school_name ON guards(school_name);
CREATE INDEX IF NOT EXISTS idx_guards_status ON guards(status);
CREATE INDEX IF NOT EXISTS idx_guards_name ON guards(name);

-- تفعيل Row Level Security
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;

-- إضافة سياسة للقراءة والكتابة للمستخدمين المصرح لهم
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

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_guards_updated_at
    BEFORE UPDATE ON guards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();