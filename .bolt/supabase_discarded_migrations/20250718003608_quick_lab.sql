/*
  # إنشاء مستخدمين تجريبيين

  1. مستخدمين تجريبيين
    - admin@example.com (مشرف عام)
    - supervisor@example.com (مشرف)
    - user@example.com (مدخل بيانات)
    
  2. ملاحظة
    - يجب إنشاء هؤلاء المستخدمين يدويًا في Supabase Auth
    - أو استخدام Edge Function لإنشائهم
*/

-- دالة لإنشاء مستخدم تجريبي (تتطلب service_role)
CREATE OR REPLACE FUNCTION create_demo_user(
  user_email text,
  user_password text,
  user_username text,
  user_full_name text,
  user_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- ملاحظة: هذه الدالة تتطلب صلاحيات service_role
  -- ويجب استدعاؤها من Edge Function أو من بيئة آمنة
  
  -- إنشاء المستخدم في auth.users (يتطلب service_role)
  -- هذا مثال فقط - يجب استخدام auth.admin.createUser من Edge Function
  
  RETURN json_build_object(
    'success', false,
    'message', 'يجب إنشاء المستخدمين من خلال Edge Function أو Supabase Dashboard'
  );
END;
$$;

-- تعليمات لإنشاء المستخدمين التجريبيين:
-- 1. انتقل إلى Supabase Dashboard -> Authentication -> Users
-- 2. انقر على "Add user" وأنشئ المستخدمين التاليين:

-- المستخدم الأول: المشرف العام
-- Email: admin@example.com
-- Password: admin123
-- User Metadata: {"username": "admin", "full_name": "المشرف العام", "role": "admin"}

-- المستخدم الثاني: المشرف
-- Email: supervisor@example.com  
-- Password: supervisor123
-- User Metadata: {"username": "supervisor", "full_name": "المشرف", "role": "supervisor"}

-- المستخدم الثالث: مدخل البيانات
-- Email: user@example.com
-- Password: user123
-- User Metadata: {"username": "user", "full_name": "مدخل البيانات", "role": "data_entry"}