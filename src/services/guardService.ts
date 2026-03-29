import { supabase } from '../lib/supabase';
import { Guard, GuardForm, GuardFilters, School } from '../types';
import { normalizeArabicText, escapeLikePattern } from '../utils/arabicUtils';

type GuardRow = Omit<Guard, 'school'> & {
  school?: School | School[] | null;
};

export class GuardService {
  private static normalizeSchool(
  school: School | School[] | null | undefined
): School | undefined {
  if (!school) return undefined;

  if (Array.isArray(school)) {
    return school.length > 0 ? school[0] : undefined;
  }

  return school;
}

  private static mapGuardRow(row: GuardRow): Guard {
    return {
      ...row,
      school: this.normalizeSchool(row.school)
    };
  }

  private static mapGuardRows(rows: GuardRow[] | null | undefined): Guard[] {
    if (!rows) return [];
    return rows.map((row) => this.mapGuardRow(row));
  }

  static async getGuardsStats(): Promise<{
    total: number;
    male: number;
    female: number;
    insured: number;
    uninsured: number;
    active: number;
  }> {
    try {
      const [
        { count: total },
        { count: male },
        { count: female },
        { count: insured },
        { count: uninsured },
        { count: active }
      ] = await Promise.all([
        supabase.from('guards').select('*', { count: 'exact', head: true }),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('gender', 'ذكر'),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('gender', 'أنثى'),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('insurance', 'نعم'),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('insurance', 'لا'),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('status', 'على رأس العمل')
      ]);

      return {
        total: total || 0,
        male: male || 0,
        female: female || 0,
        insured: insured || 0,
        uninsured: uninsured || 0,
        active: active || 0
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الحراس:', error);
      return {
        total: 0,
        male: 0,
        female: 0,
        insured: 0,
        uninsured: 0,
        active: 0
      };
    }
  }

  static async getFilteredGuards(
    filters: GuardFilters,
    page: number = 1,
    itemsPerPage: number = 20
  ): Promise<{ guards: Guard[]; totalCount: number }> {
    try {
      console.log('🔍 تطبيق فلاتر الحراس:', filters);

      const hasSchoolFilters =
        (filters.region && filters.region !== 'all') ||
        (filters.governorate && filters.governorate !== 'all');

      const schoolRelation = 'school:schools(*)';

      let query = supabase
        .from('guards')
        .select(
          `
          id,
          school_id,
          guard_name,
          civil_id,
          gender,
          birth_date,
          insurance,
          start_date,
          mobile,
          iban,
          file,
          status,
          notes,
          created_at,
          updated_at,
          ${schoolRelation}
        `,
          { count: 'exact' }
        );
      // 🔥 فلتر المنطقة (المكان الصحيح)
      if (filters.region && filters.region !== 'all') {
       query = query.eq('school.region', filters.region);
     }
      if (filters.search) {
        const searchTerm = escapeLikePattern(normalizeArabicText(filters.search));
        query = query.or(
          `guard_name.ilike.%${searchTerm}%,civil_id.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%`
        );
      }

      if (filters.region && filters.region !== 'all') {
        query = query.eq('school.region', filters.region);
        console.log('🌍 تطبيق فلتر المنطقة:', filters.region);
      }

      if (filters.governorate && filters.governorate !== 'all') {
        query = query.eq('school.governorate', filters.governorate);
        console.log('🏛️ تطبيق فلتر المحافظة:', filters.governorate);
      }

      if (filters.schoolId) {
        query = query.eq('school_id', filters.schoolId);
      }

      if (filters.unassignedOnly) {
        query = query.is('school_id', null);
        console.log('👤 تطبيق فلتر الحراس غير المسندين');
      }

      if (filters.gender && filters.gender !== 'all') {
        query = query.eq('gender', filters.gender);
      }

      if (filters.insurance && filters.insurance !== 'all') {
        query = query.eq('insurance', filters.insurance);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;
      query = query.range(startIndex, endIndex);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ خطأ في جلب الحراس المفلترين:', error);
        throw new Error(`خطأ في جلب الحراس المفلترين: ${error.message}`);
      }

      const guards = this.mapGuardRows(data as GuardRow[]);

      console.log('✅ تم جلب الحراس بنجاح:', {
        count: guards.length,
        totalCount: count || 0,
        sampleGuard: guards[0]
          ? {
              name: guards[0].guard_name,
              hasSchool: !!guards[0].school,
              schoolName: guards[0].school?.school_name,
              region: guards[0].school?.region
            }
          : null
      });

      return {
        guards,
        totalCount: count || 0
      };
    } catch (error) {
      console.error('خطأ في getFilteredGuards:', error);
      throw error;
    }
  }

  static async getAllGuards(): Promise<Guard[]> {
    const { data, error } = await supabase
      .from('guards')
      .select(`
        id,
        school_id,
        guard_name,
        civil_id,
        gender,
        birth_date,
        insurance,
        start_date,
        mobile,
        iban,
        file,
        status,
        notes,
        created_at,
        updated_at,
        school:schools(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`خطأ في جلب بيانات الحراس: ${error.message}`);
    }

    return this.mapGuardRows(data as GuardRow[]);
  }

  static async getGuardById(id: string): Promise<Guard | null> {
    const { data, error } = await supabase
      .from('guards')
      .select(`
        id,
        school_id,
        guard_name,
        civil_id,
        gender,
        birth_date,
        insurance,
        start_date,
        mobile,
        iban,
        file,
        status,
        notes,
        created_at,
        updated_at,
        school:schools(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`خطأ في جلب بيانات الحارس: ${error.message}`);
    }

    return data ? this.mapGuardRow(data as GuardRow) : null;
  }

  static async createGuard(guardData: GuardForm): Promise<Guard> {
    console.log('🔄 بدء إضافة حارس جديد:', guardData);

    const processedData = {
      ...guardData,
      birth_date: guardData.birth_date === '' ? null : guardData.birth_date,
      start_date: guardData.start_date === '' ? null : guardData.start_date
    };

    const { data, error } = await supabase
      .from('guards')
      .insert([processedData])
      .select(`
        id,
        school_id,
        guard_name,
        civil_id,
        gender,
        birth_date,
        insurance,
        start_date,
        mobile,
        iban,
        file,
        status,
        notes,
        created_at,
        updated_at,
        school:schools(*)
      `)
      .single();

    if (error) {
      console.error('❌ خطأ في إضافة الحارس:', error);
      throw new Error(`خطأ في إضافة الحارس: ${error.message}`);
    }

    console.log('✅ تم إضافة الحارس بنجاح:', data);
    return this.mapGuardRow(data as GuardRow);
  }

  static async updateGuard(id: string, guardData: Partial<GuardForm>): Promise<Guard> {
    console.log('🔄 بدء تحديث الحارس:', { id, guardData });

    const processedData = {
      ...guardData,
      birth_date: guardData.birth_date === '' ? null : guardData.birth_date,
      start_date: guardData.start_date === '' ? null : guardData.start_date
    };

    const { data, error } = await supabase
      .from('guards')
      .update(processedData)
      .eq('id', id)
      .select(`
        id,
        school_id,
        guard_name,
        civil_id,
        gender,
        birth_date,
        insurance,
        start_date,
        mobile,
        iban,
        file,
        status,
        notes,
        created_at,
        updated_at,
        school:schools(*)
      `)
      .single();

    if (error) {
      console.error('❌ خطأ في تحديث الحارس:', error);
      throw new Error(`خطأ في تحديث بيانات الحارس: ${error.message}`);
    }

    console.log('✅ تم تحديث الحارس بنجاح:', data);
    return this.mapGuardRow(data as GuardRow);
  }

  static async deleteGuard(id: string): Promise<void> {
    const { error: operationsError } = await supabase
      .from('operations')
      .update({ guard_id: null })
      .eq('guard_id', id);

    if (operationsError) {
      throw new Error(`خطأ في تحديث العمليات المرتبطة: ${operationsError.message}`);
    }

    const { error } = await supabase.from('guards').delete().eq('id', id);

    if (error) {
      throw new Error(`خطأ في حذف الحارس: ${error.message}`);
    }
  }

  static async transferGuard(
    guardId: string,
    newSchoolId: string,
    description: string
  ): Promise<void> {
    const { error } = await supabase
      .from('guards')
      .update({
        school_id: newSchoolId,
        status: 'على رأس العمل'
      })
      .eq('id', guardId);

    if (error) {
      throw new Error(`خطأ في نقل الحارس: ${error.message}`);
    }
  }

  static async getUnassignedGuards(): Promise<Guard[]> {
    const { data, error } = await supabase
      .from('guards')
      .select(`
        id,
        school_id,
        guard_name,
        civil_id,
        gender,
        birth_date,
        insurance,
        start_date,
        mobile,
        iban,
        file,
        status,
        notes,
        created_at,
        updated_at,
        school:schools(*)
      `)
      .is('school_id', null)
      .order('guard_name');

    if (error) {
      throw new Error(`خطأ في جلب الحراس غير المرتبطين: ${error.message}`);
    }

    return this.mapGuardRows(data as GuardRow[]);
  }

  static async bulkCreateGuards(guards: GuardForm[]): Promise<Guard[]> {
    const processedGuards = guards.map((guard) => ({
      ...guard,
      birth_date: guard.birth_date === '' ? null : guard.birth_date,
      start_date: guard.start_date === '' ? null : guard.start_date
    }));

    const { data, error } = await supabase
      .from('guards')
      .insert(processedGuards)
      .select(`
        id,
        school_id,
        guard_name,
        civil_id,
        gender,
        birth_date,
        insurance,
        start_date,
        mobile,
        iban,
        file,
        status,
        notes,
        created_at,
        updated_at,
        school:schools(*)
      `);

    if (error) {
      throw new Error(`خطأ في استيراد الحراس: ${error.message}`);
    }

    return this.mapGuardRows(data as GuardRow[]);
  }
}