-- إضافة عمود auth_id لربط جدول users بـ Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id uuid;

-- للمستخدمين الموجودين الذين أُنشئوا عبر Edge Function (id = auth_id)
UPDATE users SET auth_id = id WHERE auth_id IS NULL;

-- منح صلاحية الإدراج للـ Edge Function عبر service role
GRANT INSERT ON users TO service_role;
GRANT UPDATE ON users TO service_role;
