/*
  # إنشاء دالة get_current_user_profile

  1. الدوال الجديدة
    - `get_current_user_profile()` - جلب ملف تعريف المستخدم الحالي
    - `create_user_with_profile()` - إنشاء مستخدم مع ملف تعريف
  
  2. الأمان
    - منح صلاحيات تنفيذ الدوال للمستخدمين المصادق عليهم
    - تحديث سياسات RLS
  
  3. بيانات تجريبية
    - إنشاء مستخدم admin تجريبي
*/

-- إنشاء دالة جلب ملف تعريف المستخدم الحالي
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

-- منح صلاحيات تنفيذ الدالة للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO anon;

-- إنشاء دالة مساعدة لإنشاء مستخدم مع ملف تعريف
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  p_email text,
  p_password text,
  p_username text,
  p_full_name text,
  p_role text DEFAULT 'data_entry'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  profile_id uuid;
BEGIN
  -- إنشاء المستخدم في نظام المصادقة
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'username', p_username,
      'full_name', p_full_name,
      'role', p_role
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO user_id;

  -- إنشاء ملف التعريف في جدول users المخصص
  INSERT INTO public.users (
    id,
    username,
    password_hash,
    role,
    full_name,
    email,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_role,
    p_full_name,
    p_email,
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO profile_id;

  RETURN user_id;
END;
$$;

-- منح صلاحيات تنفيذ دالة إنشاء المستخدم
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(text, text, text, text, text) TO anon;

-- تحديث سياسات RLS لجدول users
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Allow admin to insert new users by username" ON public.users;
DROP POLICY IF EXISTS "Allow admins to create users" ON public.users;

-- سياسة للقراءة - المستخدمون يمكنهم قراءة بياناتهم الخاصة
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- سياسة للقراءة العامة (للدوال)
CREATE POLICY "Allow function access to users" ON public.users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- سياسة للإدراج - السماح بإنشاء مستخدمين جدد
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- سياسة للتحديث - المستخدمون يمكنهم تحديث بياناتهم
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- إنشاء مستخدم admin تجريبي إذا لم يكن موجوداً
DO $$
DECLARE
  admin_exists boolean;
  admin_user_id uuid;
BEGIN
  -- التحقق من وجود مستخدم admin
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE username = 'admin'
  ) INTO admin_exists;

  -- إنشاء مستخدم admin إذا لم يكن موجوداً
  IF NOT admin_exists THEN
    -- إنشاء المستخدم في نظام المصادقة أولاً
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","full_name":"Admin User","role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;

    -- إنشاء ملف التعريف في جدول users المخصص
    INSERT INTO public.users (
      id,
      username,
      password_hash,
      role,
      full_name,
      email,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'admin',
      crypt('admin123', gen_salt('bf')),
      'admin',
      'Admin User',
      'admin@example.com',
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'تم إنشاء مستخدم admin بنجاح - البريد: admin@example.com، كلمة المرور: admin123';
  ELSE
    RAISE NOTICE 'مستخدم admin موجود بالفعل';
  END IF;
END $$;

-- إنشاء دالة للتحقق من صحة تسجيل الدخول
CREATE OR REPLACE FUNCTION public.verify_user_login(
  p_username text,
  p_password text
)
RETURNS TABLE(
  user_id uuid,
  username text,
  role text,
  full_name text,
  email text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.role,
    u.full_name,
    u.email,
    u.is_active
  FROM
    public.users u
  WHERE
    u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = true;
END;
$$;

-- منح صلاحيات تنفيذ دالة التحقق
GRANT EXECUTE ON FUNCTION public.verify_user_login(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_login(text, text) TO anon;

-- تحديث دالة update_updated_at_column إذا لم تكن موجودة
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة trigger لتحديث updated_at تلقائياً
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();