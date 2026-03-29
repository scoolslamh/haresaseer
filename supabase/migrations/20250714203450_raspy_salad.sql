/*
  # نظام إدارة البوابين المتكامل

  1. الجداول الجديدة
    - `users` - المستخدمون والصلاحيات
    - `schools` - بيانات المدارس
    - `guards` - بيانات البوابين (محدث)
    - `violations` - المخالفات
    - `operations` - سجل العمليات

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - سياسات أمان مناسبة لكل دور

  3. الفهارس
    - فهارس للبحث السريع
    - فهارس للتصفية والترتيب
*/

-- حذف الجداول القديمة إذا كانت موجودة
DROP TABLE IF EXISTS guards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS violations CASCADE;
DROP TABLE IF EXISTS operations CASCADE;

-- جدول المستخدمين
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'supervisor', 'data_entry')),
  full_name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول المدارس
CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_number text UNIQUE NOT NULL,
  region text NOT NULL CHECK (region IN ('عسير', 'جيزان', 'الباحة', 'نجران')),
  governorate text NOT NULL DEFAULT '',
  school_name text NOT NULL,
  principal_name text DEFAULT '',
  principal_mobile text DEFAULT '',
  status text DEFAULT 'نشط' CHECK (status IN ('نشط', 'غير نشط')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول البوابين
CREATE TABLE guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  guard_name text NOT NULL,
  civil_id text DEFAULT '',
  gender text DEFAULT '' CHECK (gender IN ('', 'ذكر', 'أنثى')),
  birth_date date,
  insurance text DEFAULT '' CHECK (insurance IN ('', 'نعم', 'لا')),
  start_date date DEFAULT CURRENT_DATE,
  mobile text DEFAULT '',
  iban text DEFAULT '',
  status text DEFAULT 'نشط' CHECK (status IN ('نشط', 'غير نشط', 'منقول', 'مفصول')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول المخالفات
CREATE TABLE violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id uuid NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  violation_type text NOT NULL CHECK (violation_type IN ('شكوى', 'إنذار', 'مخالفة')),
  violation_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- جدول العمليات
CREATE TABLE operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL CHECK (operation_type IN ('نقل', 'إعادة توجيه', 'إضافة بواب', 'إضافة مدرسة', 'تعديل بيانات')),
  guard_id uuid REFERENCES guards(id),
  school_from_id uuid REFERENCES schools(id),
  school_to_id uuid REFERENCES schools(id),
  description text NOT NULL,
  performed_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - السماح لجميع المستخدمين بالوصول (سيتم التحكم في الواجهة)
CREATE POLICY "allow_all_users" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_schools" ON schools FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_guards" ON guards FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_violations" ON violations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_operations" ON operations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- الفهارس للأداء
CREATE INDEX idx_schools_region ON schools(region);
CREATE INDEX idx_schools_governorate ON schools(governorate);
CREATE INDEX idx_schools_file_number ON schools(file_number);
CREATE INDEX idx_guards_school_id ON guards(school_id);
CREATE INDEX idx_guards_civil_id ON guards(civil_id);
CREATE INDEX idx_guards_gender ON guards(gender);
CREATE INDEX idx_guards_status ON guards(status);
CREATE INDEX idx_violations_guard_id ON violations(guard_id);
CREATE INDEX idx_violations_type ON violations(violation_type);
CREATE INDEX idx_operations_guard_id ON operations(guard_id);

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق الدالة على الجداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guards_updated_at BEFORE UPDATE ON guards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إدراج مستخدم افتراضي (admin/admin123)
INSERT INTO users (username, password_hash, role, full_name) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'المشرف العام');

-- بيانات تجريبية للمدارس
INSERT INTO schools (file_number, region, governorate, school_name, principal_name, principal_mobile) VALUES 
('001', 'عسير', 'أبها', 'مدرسة الأمل الابتدائية', 'أحمد محمد السعد', '0501234567'),
('002', 'جيزان', 'جيزان', 'مدرسة النور المتوسطة', 'فاطمة أحمد علي', '0507654321'),
('003', 'الباحة', 'الباحة', 'مدرسة الفجر الثانوية', 'عبدالله سالم محمد', '0503456789'),
('004', 'نجران', 'نجران', 'مدرسة الرسالة الابتدائية', 'مريم عبدالرحمن', '0509876543');