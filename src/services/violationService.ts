import { supabase } from '../lib/supabase';
import { Violation, ViolationForm } from '../types';
import { AuthService } from './authService';
import { normalizeArabicText, escapeLikePattern } from '../utils/arabicUtils';

const VIOLATION_SELECT = `
  *,
  guard:guards(id, guard_name, status, civil_id, school:schools(school_name))
`;

export class ViolationService {
  static async getAllViolations(): Promise<Violation[]> {
    const { data, error } = await supabase
      .from('violations')
      .select(`*, guard:guards(*)`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`خطأ في جلب بيانات المخالفات: ${error.message}`);
    return data || [];
  }

  static async getFilteredViolations(
    filters: { search?: string; violationType?: string; guardId?: string; dateFrom?: string; dateTo?: string },
    page: number = 1,
    itemsPerPage: number = 20
  ): Promise<{ violations: Violation[]; totalCount: number }> {
    const startIndex = (page - 1) * itemsPerPage;

    let query = supabase
      .from('violations')
      .select(VIOLATION_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + itemsPerPage - 1);

    if (filters.violationType && filters.violationType !== 'all') {
      query = query.eq('violation_type', filters.violationType);
    }
    if (filters.guardId && filters.guardId !== 'all') {
      query = query.eq('guard_id', filters.guardId);
    }
    if (filters.dateFrom) query = query.gte('violation_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('violation_date', filters.dateTo);

    if (filters.search?.trim()) {
      const normalized = escapeLikePattern(normalizeArabicText(filters.search.trim()));
      const { data: matchingGuards } = await supabase
        .from('guards').select('id').ilike('guard_name', `%${normalized}%`);
      const guardIds = matchingGuards?.map(g => g.id) || [];
      const orFilter = guardIds.length > 0
        ? `description.ilike.%${normalized}%,guard_id.in.(${guardIds.join(',')})`
        : `description.ilike.%${normalized}%`;
      query = (query as any).or(orFilter);
    }

    const { data, error, count } = await (query as any);
    if (error) throw new Error(`خطأ في جلب المخالفات: ${error.message}`);
    return { violations: data || [], totalCount: count || 0 };
  }

  static async getViolationPageStats(): Promise<{
    total: number; complaints: number; warnings: number; violations: number; thisMonth: number;
  }> {
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const [{ count: total }, { count: complaints }, { count: warnings }, { count: violations }, { count: thisMonth }] =
      await Promise.all([
        supabase.from('violations').select('id', { count: 'exact', head: true }),
        supabase.from('violations').select('id', { count: 'exact', head: true }).eq('violation_type', 'شكوى'),
        supabase.from('violations').select('id', { count: 'exact', head: true }).eq('violation_type', 'إنذار'),
        supabase.from('violations').select('id', { count: 'exact', head: true }).eq('violation_type', 'مخالفة'),
        supabase.from('violations').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString()),
      ]);

    return {
      total: total || 0, complaints: complaints || 0, warnings: warnings || 0,
      violations: violations || 0, thisMonth: thisMonth || 0,
    };
  }

  static async getViolationsForExport(
    filters: { search?: string; violationType?: string; guardId?: string; dateFrom?: string; dateTo?: string }
  ): Promise<Violation[]> {
    const pageSize = 1000;
    let page = 0;
    let allViolations: Violation[] = [];

    let normalized = '';
    let guardIds: string[] = [];
    if (filters.search?.trim()) {
      normalized = escapeLikePattern(normalizeArabicText(filters.search.trim()));
      const { data: mg } = await supabase.from('guards').select('id').ilike('guard_name', `%${normalized}%`);
      guardIds = mg?.map(g => g.id) || [];
    }

    while (true) {
      let query = supabase
        .from('violations')
        .select(VIOLATION_SELECT)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters.violationType && filters.violationType !== 'all') query = query.eq('violation_type', filters.violationType);
      if (filters.guardId && filters.guardId !== 'all') query = query.eq('guard_id', filters.guardId);
      if (filters.dateFrom) query = query.gte('violation_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('violation_date', filters.dateTo);
      if (normalized) {
        const orFilter = guardIds.length > 0
          ? `description.ilike.%${normalized}%,guard_id.in.(${guardIds.join(',')})`
          : `description.ilike.%${normalized}%`;
        query = (query as any).or(orFilter);
      }

      const { data, error } = await (query as any);
      if (error) throw new Error(`خطأ في تصدير المخالفات: ${error.message}`);
      const batch = data || [];
      allViolations = [...allViolations, ...batch];
      if (batch.length < pageSize) break;
      page++;
    }

    return allViolations;
  }

  static async getViolationsByGuard(guardId: string): Promise<Violation[]> {
    const { data, error } = await supabase
      .from('violations')
      .select(`
        *,
        guard:guards(*)
      `)
      .eq('guard_id', guardId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`خطأ في جلب مخالفات الحارس: ${error.message}`);
    }

    return data || [];
  }

  static async createViolation(violationData: ViolationForm): Promise<Violation> {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('يجب تسجيل الدخول لإضافة مخالفة');
    }

    const { data, error } = await supabase
      .from('violations')
      .insert([{
        ...violationData,
        created_by: currentUser.id
      }])
      .select(`
        *,
        guard:guards(*)
      `)
      .single();

    if (error) {
      throw new Error(`خطأ في إضافة المخالفة: ${error.message}`);
    }

    return data;
  }

  static async updateViolation(id: string, violationData: Partial<ViolationForm>): Promise<Violation> {
    const { data, error } = await supabase
      .from('violations')
      .update(violationData)
      .eq('id', id)
      .select(`
        *,
        guard:guards(*)
      `)
      .single();

    if (error) {
      throw new Error(`خطأ في تحديث المخالفة: ${error.message}`);
    }

    return data;
  }

  static async deleteViolation(id: string): Promise<void> {
    const { error } = await supabase
      .from('violations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`خطأ في حذف المخالفة: ${error.message}`);
    }
  }

  static async getViolationStats(): Promise<{
    total: number;
    byType: Array<{ type: string; count: number }>;
    recent: Violation[];
  }> {
    // إجمالي المخالفات
    const { count: total } = await supabase
      .from('violations')
      .select('*', { count: 'exact', head: true });

    // المخالفات حسب النوع
    const { data: byTypeData } = await supabase
      .from('violations')
      .select('violation_type')
      .order('violation_type');

    const byType = byTypeData?.reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.type === curr.violation_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: curr.violation_type, count: 1 });
      }
      return acc;
    }, []) || [];

    // المخالفات الحديثة
    const { data: recent } = await supabase
      .from('violations')
      .select(`
        *,
        guard:guards(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      total: total || 0,
      byType,
      recent: recent || []
    };
  }
}