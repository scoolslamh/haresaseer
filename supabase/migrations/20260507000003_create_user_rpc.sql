-- دالة إنشاء مستخدم بدون Edge Function
-- تعمل مباشرة في قاعدة البيانات مع صلاحيات كاملة

CREATE OR REPLACE FUNCTION public.create_user_with_auth(
  p_username  text,
  p_password  text,
  p_role      text,
  p_full_name text,
  p_email     text    DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id     uuid := gen_random_uuid();
  v_email       text;
  v_instance_id uuid;
  v_result      json;
BEGIN
  -- التحقق من أن المستدعي مدير
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح: يجب أن تكون مديراً لإنشاء مستخدمين';
  END IF;

  -- التحقق من عدم تكرار اسم المستخدم
  IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username) THEN
    RAISE EXCEPTION 'اسم المستخدم موجود بالفعل: %', p_username;
  END IF;

  -- توليد البريد الإلكتروني
  v_email := COALESCE(NULLIF(TRIM(p_email), ''), p_username || '@system.local');

  -- التحقق من عدم تكرار البريد الإلكتروني في auth
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'البريد الإلكتروني مستخدم بالفعل: %', v_email;
  END IF;

  -- الحصول على instance_id من مستخدم موجود
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;

  -- إدراج المستخدم في جدول auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    COALESCE(v_instance_id, '00000000-0000-0000-0000-000000000000'),
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'username',   p_username,
      'full_name',  p_full_name,
      'role',       p_role,
      'is_active',  p_is_active
    ),
    false,
    now(),
    now()
  );

  -- إدراج المستخدم في جدول public.users
  INSERT INTO public.users (
    id, auth_id, username, password_hash,
    role, full_name, email, is_active
  ) VALUES (
    v_user_id, v_user_id, p_username, 'managed_by_auth',
    p_role, p_full_name, v_email, p_is_active
  );

  -- إرجاع بيانات المستخدم الجديد
  SELECT json_build_object(
    'id',         u.id,
    'username',   u.username,
    'role',       u.role,
    'full_name',  u.full_name,
    'email',      u.email,
    'is_active',  u.is_active,
    'created_at', u.created_at,
    'updated_at', u.updated_at,
    'message',    'تم إنشاء المستخدم بنجاح'
  ) INTO v_result
  FROM public.users u
  WHERE u.id = v_user_id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- في حال فشل إدراج public.users، احذف مستخدم auth
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE;
END;
$$;

-- منح صلاحية التنفيذ للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION public.create_user_with_auth TO authenticated;
