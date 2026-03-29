/*
  # إصلاح إحصائيات المدارس

  1. إضافة دالة SQL لحساب المدارس التي لها بوابين
  2. تحسين الاستعلامات للحصول على إحصائيات دقيقة
*/

-- إنشاء دالة لحساب عدد المدارس التي لها بوابين
CREATE OR REPLACE FUNCTION get_schools_with_guards_count()
RETURNS TABLE(count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT s.id)::bigint
  FROM public.schools s
  INNER JOIN public.guards g ON s.id = g.school_id
  WHERE s.status = 'نشط';
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لحساب عدد المدارس بدون بوابين
CREATE OR REPLACE FUNCTION get_schools_without_guards_count()
RETURNS TABLE(count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(s.id)::bigint
  FROM public.schools s
  LEFT JOIN public.guards g ON s.id = g.school_id
  WHERE s.status = 'نشط' AND g.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة للحصول على إحصائيات شاملة للوحة القيادة
CREATE OR REPLACE FUNCTION get_dashboard_statistics()
RETURNS TABLE(
  total_schools bigint,
  total_guards bigint,
  schools_with_guards bigint,
  schools_without_guards bigint,
  male_guards bigint,
  female_guards bigint,
  insured_guards bigint,
  uninsured_guards bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.schools WHERE status = 'نشط')::bigint as total_schools,
    (SELECT COUNT(*) FROM public.guards)::bigint as total_guards,
    (SELECT COUNT(DISTINCT s.id) FROM public.schools s INNER JOIN public.guards g ON s.id = g.school_id WHERE s.status = 'نشط')::bigint as schools_with_guards,
    (SELECT COUNT(s.id) FROM public.schools s LEFT JOIN public.guards g ON s.id = g.school_id WHERE s.status = 'نشط' AND g.id IS NULL)::bigint as schools_without_guards,
    (SELECT COUNT(*) FROM public.guards WHERE gender = 'ذكر')::bigint as male_guards,
    (SELECT COUNT(*) FROM public.guards WHERE gender = 'أنثى')::bigint as female_guards,
    (SELECT COUNT(*) FROM public.guards WHERE insurance = 'نعم')::bigint as insured_guards,
    (SELECT COUNT(*) FROM public.guards WHERE insurance = 'لا')::bigint as uninsured_guards;
END;
$$ LANGUAGE plpgsql;