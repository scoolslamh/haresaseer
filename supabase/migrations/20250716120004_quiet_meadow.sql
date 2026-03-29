/*
  # إنشاء مستخدم admin افتراضي

  1. إنشاء مستخدم المشرف العام
    - اسم المستخدم: admin
    - كلمة المرور: admin123 (مشفرة)
    - الدور: admin (مشرف عام)
    - الحالة: نشط

  2. الأمان
    - كلمة المرور مشفرة بـ bcrypt
    - يعمل ضمن نظام RLS الموجود
    - صلاحيات مشرف عام كاملة

  3. الغرض
    - حل مشكلة عدم وجود مستخدمين للدخول الأولي
    - إمكانية إضافة مستخدمين جدد بعد تسجيل الدخول
    - كسر الحلقة المفرغة في النظام
*/

-- إنشاء مستخدم admin افتراضي
INSERT INTO users (
  username, 
  password_hash, 
  role, 
  full_name, 
  email, 
  is_active
) VALUES (
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/pejt4a.',  -- admin123
  'admin',
  'المشرف العام',
  'admin@system.local',
  true
) ON CONFLICT (username) DO NOTHING;

-- إنشاء مستخدم supervisor تجريبي
INSERT INTO users (
  username, 
  password_hash, 
  role, 
  full_name, 
  email, 
  is_active
) VALUES (
  'supervisor',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/pejt4a.',  -- 123456
  'supervisor',
  'المشرف',
  'supervisor@system.local',
  true
) ON CONFLICT (username) DO NOTHING;

-- إنشاء مستخدم data_entry تجريبي
INSERT INTO users (
  username, 
  password_hash, 
  role, 
  full_name, 
  email, 
  is_active
) VALUES (
  'user1',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/pejt4a.',  -- 123456
  'data_entry',
  'مدخل البيانات',
  'user1@system.local',
  true
) ON CONFLICT (username) DO NOTHING;