import { supabase } from '../lib/supabase';
import { School, SchoolForm } from '../types';
import { normalizeArabicText, escapeLikePattern } from '../utils/arabicUtils';

export class SchoolService {

  static async getFilteredSchools(
    filters: { search?: string; region?: string; status?: string } = {},
    page: number = 1,
    itemsPerPage: number = 20
  ): Promise<{ schools: School[]; totalCount: number }> {
    try {

      let query = supabase
  .from('schools')
  .select(`
    id,
    school_name,
    region,
    governorate,
    principal_name,
    status,
    guards:guards(count)
  `, { count: 'exact' });

      // البحث
      if (filters.search && filters.search.trim()) {
        const searchTerm = escapeLikePattern(normalizeArabicText(filters.search.trim()));
        query = query.or(
          `school_name.ilike.%${searchTerm}%,principal_name.ilike.%${searchTerm}%,governorate.ilike.%${searchTerm}%`
        );
      }

      // المنطقة
      if (filters.region && filters.region !== 'all') {
        query = query.eq('region', filters.region);
      }

      // الحالة
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;
      query = query.range(startIndex, endIndex);

      // ترتيب
      query = query.order('created_at', { ascending: false });

      // ✅ حل مشكلة TypeScript
      const { data, error, count } = await (query as any);

      if (error) {
        throw new Error(`خطأ في جلب المدارس المفلترة: ${error.message}`);
      }

      // 🔥 إضافة عدد الحراس
      const formatted = (data || []).map((s: any) => ({
        ...s,
        guards_count: s.guards?.[0]?.count || 0,
      }));

      return {
        schools: formatted,
        totalCount: count || 0
      };

    } catch (error) {
      console.error('خطأ في getFilteredSchools:', error);
      throw error;
    }
  }

  static async getAllSchools(): Promise<School[]> {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`خطأ في جلب بيانات المدارس: ${error.message}`);
    }

    return data || [];
  }

  static async getSchoolById(id: string): Promise<School | null> {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`خطأ في جلب بيانات المدرسة: ${error.message}`);
    }

    return data;
  }

  static async createSchool(schoolData: SchoolForm): Promise<School> {
    console.log('🔄 بدء إضافة مدرسة جديدة:', schoolData);

    const { data, error } = await supabase
      .from('schools')
      .insert([schoolData])
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في إضافة المدرسة:', error);
      throw new Error(`خطأ في إضافة المدرسة: ${error.message}`);
    }

    console.log('✅ تم إضافة المدرسة بنجاح:', data);
    return data;
  }

  static async updateSchool(id: string, schoolData: Partial<SchoolForm>): Promise<School> {
    console.log('🔄 بدء تحديث المدرسة:', { id, schoolData });

    const { data, error } = await supabase
      .from('schools')
      .update(schoolData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في تحديث المدرسة:', error);
      throw new Error(`خطأ في تحديث بيانات المدرسة: ${error.message}`);
    }

    console.log('✅ تم تحديث المدرسة بنجاح:', data);
    return data;
  }

  static async deleteSchool(id: string): Promise<void> {
    const { error: guardsError } = await supabase
      .from('guards')
      .update({ school_id: null })
      .eq('school_id', id);

    if (guardsError) {
      throw new Error(`خطأ في تحديث الحراس المرتبطين: ${guardsError.message}`);
    }

    const { error: operationsError } = await supabase
      .from('operations')
      .update({
        school_from_id: null,
        school_to_id: null
      })
      .or(`school_from_id.eq.${id},school_to_id.eq.${id}`);

    if (operationsError) {
      throw new Error(`خطأ في تحديث العمليات المرتبطة: ${operationsError.message}`);
    }

    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`خطأ في حذف المدرسة: ${error.message}`);
    }
  }

  static async getSchoolsByRegion(region: string): Promise<School[]> {
    const { data, error } = await supabase
      .from('schools')
      .select(`
        id,
        school_name,
        region,
        guards:guards(count)
      `)
      .eq('region', region)
      .order('school_name');

    if (error) {
      throw new Error(`خطأ في جلب مدارس المنطقة: ${error.message}`);
    }

    const formatted = (data || []).map((s: any) => ({
      ...s,
      guards_count: s.guards?.[0]?.count || 0,
    }));

    return formatted;
  }

  static async searchSchools(query: string): Promise<School[]> {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .or(`school_name.ilike.%${query}%,principal_name.ilike.%${query}%`)
      .order('school_name');

    if (error) {
      throw new Error(`خطأ في البحث: ${error.message}`);
    }

    return data || [];
  }
}