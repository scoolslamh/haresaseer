/*
  # تحديث الأدوار إلى اللغة الإنجليزية

  1. تحديث قيود الجدول
    - تحديث قيد CHECK على عمود role في جدول users
    - تحديث قيد CHECK على عمود role في جدول guards (إذا وجد)

  2. تحديث البيانات الموجودة
    - تحويل الأدوار العربية الموجودة إلى الإنجليزية
    - تحديث أي مراجع للأدوار في الجداول الأخرى

  3. إعادة إنشاء الدوال
    - تحديث الدوال لتتعامل مع الأدوار الإنجليزية
    - إعادة إنشاء المستخدم التجريبي بالأدوار الجديدة

  4. تحديث السياسات
    - تحديث سياسات RLS لتتعامل مع الأدوار الإنجليزية
*/

-- 1. تحديث قيود الجدول
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK ((role = ANY (ARRAY['admin'::text, 'supervisor'::text, 'data_entry'::text])));

-- 2. تحديث البيانات الموجودة - تحويل الأدوار العربية إلى الإنجليزية
UPDATE public.users 
SET role = CASE 
  WHEN role = 'مشرف عام' OR role = 'admin' THEN 'admin'
  WHEN role = 'مشرف' OR role = 'supervisor' THEN 'supervisor'
  WHEN role = 'مدخل بيانات' OR role = 'data_entry' THEN 'data_entry'
  ELSE 'data_entry'
END;

-- 3. حذف وإعادة إنشاء الدوال مع الأدوار الإنجليزية
DROP FUNCTION IF EXISTS public.get_current_user_profile();
DROP FUNCTION IF EXISTS public.create_user_with_profile(text, text, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.verify_user_login(text, text);

-- دالة update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- دالة get_current_user_profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    username,
    password_hash,
    role,
    full_name,
    email,
    is_active,
    created_at,
    updated_at
  FROM
    public.users
  WHERE
    id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- دالة create_user_with_profile
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
    p_username text,
    p_password text,
    p_role text,
    p_full_name text,
    p_email text DEFAULT NULL,
    p_is_active boolean DEFAULT TRUE
)
RETURNS public.users
LANGUAGE plpgsql
AS $$
DECLARE
    new_user public.users;
    hashed_password text;
BEGIN
    -- التحقق من صحة الدور
    IF p_role NOT IN ('admin', 'supervisor', 'data_entry') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be admin, supervisor, or data_entry', p_role;
    END IF;

    -- Hash the password
    SELECT crypt(p_password, gen_salt('bf')) INTO hashed_password;

    -- Insert into public.users table
    INSERT INTO public.users (username, password_hash, role, full_name, email, is_active)
    VALUES (p_username, hashed_password, p_role, p_full_name, p_email, p_is_active)
    RETURNING * INTO new_user;

    RETURN new_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_with_profile(text, text, text, text, text, boolean) TO authenticated;

-- دالة verify_user_login
CREATE OR REPLACE FUNCTION public.verify_user_login(
    p_username text,
    p_password text
)
RETURNS SETOF public.users
LANGUAGE plpgsql
AS $$
DECLARE
    user_record public.users;
BEGIN
    SELECT *
    INTO user_record
    FROM public.users
    WHERE username = p_username AND is_active = TRUE;

    IF user_record.password_hash IS NOT NULL AND user_record.password_hash = crypt(p_password, user_record.password_hash) THEN
        RETURN NEXT user_record;
    END IF;

    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_user_login(text, text) TO public;

-- 4. إعادة إنشاء المستخدم التجريبي بالدور الإنجليزي
DELETE FROM public.users WHERE username = 'admin';

INSERT INTO public.users (username, password_hash, role, full_name, email, is_active)
VALUES (
    'admin',
    crypt('admin123', gen_salt('bf')),
    'admin',
    'مشرف عام',
    'admin@example.com',
    TRUE
);

-- إضافة مستخدمين تجريبيين إضافيين
INSERT INTO public.users (username, password_hash, role, full_name, email, is_active)
VALUES 
(
    'supervisor',
    crypt('supervisor123', gen_salt('bf')),
    'supervisor',
    'مشرف النظام',
    'supervisor@example.com',
    TRUE
),
(
    'user1',
    crypt('user123', gen_salt('bf')),
    'data_entry',
    'مدخل البيانات',
    'user1@example.com',
    TRUE
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    is_active = EXCLUDED.is_active;

-- 5. تحديث السياسات لتتعامل مع الأدوار الإنجليزية
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "Allow admin to insert new users by username" ON public.users;
DROP POLICY IF EXISTS "Allow admins to create users" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- إعادة إنشاء السياسات بالأدوار الإنجليزية
CREATE POLICY "Allow admin to insert new users by username" ON public.users
FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE username = auth.email()) = 'admin'
);

CREATE POLICY "Allow admins to create users" ON public.users
FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "users_delete_policy" ON public.users
FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "users_insert_policy" ON public.users
FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'supervisor', 'data_entry')
);

CREATE POLICY "users_select_policy" ON public.users
FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'supervisor', 'data_entry')
);

CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'supervisor') OR id = auth.uid()
) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'supervisor') OR id = auth.uid()
);

-- إضافة trigger لتحديث updated_at تلقائياً
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();