import { supabase } from '../lib/supabase';
import { DashboardStats } from '../types';
import { School } from '../types';
import { normalizeArabicText } from '../utils/arabicUtils';

// أعمدة المدارس المطلوبة فقط لحسابات لوحة القيادة
const SCHOOL_STATS_COLUMNS = 'id, region, governorate, school_name';

// أعمدة المدارس الكاملة لعرض قائمة المدارس
const SCHOOL_FULL_COLUMNS = 'id, region, governorate, school_name, principal_name, principal_mobile, status, notes, created_at, updated_at';

async function fetchAllPages<T>(
  queryBuilder: (range: [number, number]) => Promise<{ data: T[] | null; error: any }>,
  pageSize = 1000
): Promise<T[]> {
  const results: T[] = [];
  let page = 0;

  while (true) {
    const start = page * pageSize;
    const { data, error } = await queryBuilder([start, start + pageSize - 1]);
    if (error) throw error;
    const items = data || [];
    results.push(...items);
    if (items.length < pageSize) break;
    page++;
  }

  return results;
}

export class DashboardService {
  private static async getAllLinkedGuardSchoolIds(): Promise<Set<string>> {
    const guards = await fetchAllPages<{ school_id: string }>(([start, end]) =>
      supabase
        .from('guards')
        .select('school_id')
        .not('school_id', 'is', null)
        .range(start, end)
    );

    const ids = new Set<string>();
    for (const g of guards) {
      if (g.school_id) ids.add(g.school_id);
    }
    return ids;
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // جلب المدارس النشطة (الأعمدة المطلوبة فقط)
      const allSchoolsData = await fetchAllPages<{ id: string; region: string; governorate: string; school_name: string }>(
        ([start, end]) =>
          supabase
            .from('schools')
            .select(SCHOOL_STATS_COLUMNS)
            .eq('status', 'نشط')
            .order('school_name')
            .range(start, end)
      );

      const actualTotalSchools = allSchoolsData.length;

      // جلب معرفات المدارس التي لها حراس + إحصائيات الحراس بالتوازي
      const [
        linkedGuardSchoolIds,
        { data: dashboardStats, error: statsError },
        { count: activeGuardsCount }
      ] = await Promise.all([
        this.getAllLinkedGuardSchoolIds(),
        supabase.rpc('get_dashboard_statistics'),
        supabase.from('guards').select('id', { count: 'exact', head: true }).eq('status', 'على رأس العمل')
      ]);

      const actualSchoolsWithGuards = allSchoolsData.filter(s => linkedGuardSchoolIds.has(s.id)).length;
      const actualSchoolsWithoutGuards = actualTotalSchools - actualSchoolsWithGuards;

      let totalGuards = 0, maleGuards = 0, femaleGuards = 0;
      let insuredGuards = 0, uninsuredGuards = 0;

      if (statsError || !dashboardStats?.length) {
        // fallback: استعلامات منفصلة بالتوازي
        const [
          { count: tg },
          { data: genderData },
          { data: insuranceData }
        ] = await Promise.all([
          supabase.from('guards').select('id', { count: 'exact', head: true }),
          supabase.from('guards').select('gender'),
          supabase.from('guards').select('insurance')
        ]);

        totalGuards    = tg || 0;
        maleGuards     = genderData?.filter(g => g.gender    === 'ذكر').length  || 0;
        femaleGuards   = genderData?.filter(g => g.gender    === 'أنثى').length || 0;
        insuredGuards  = insuranceData?.filter(g => g.insurance === 'نعم').length || 0;
        uninsuredGuards = insuranceData?.filter(g => g.insurance === 'لا').length || 0;
      } else {
        const s = dashboardStats[0];
        totalGuards     = Number(s.total_guards);
        maleGuards      = Number(s.male_guards);
        femaleGuards    = Number(s.female_guards);
        insuredGuards   = Number(s.insured_guards);
        uninsuredGuards = Number(s.uninsured_guards);
      }

      // إحصائيات المناطق
      const allRegions = ['عسير', 'جيزان', 'الباحة', 'نجران'];
      const regionCounts: Record<string, number> = Object.fromEntries(allRegions.map(r => [r, 0]));

      for (const school of allSchoolsData) {
        const norm = normalizeArabicText(school.region);
        const match = allRegions.find(r => normalizeArabicText(r) === norm);
        if (match) regionCounts[match]++;
      }

      const regionStats = allRegions.map(region => ({
        region,
        count: regionCounts[region],
        percentage: actualTotalSchools > 0
          ? Math.round((regionCounts[region] / actualTotalSchools) * 100)
          : 0
      }));

      // إحصائيات المحافظات
      const governorateMap = new Map<string, { count: number; region: string }>();
      for (const school of allSchoolsData) {
        const key = school.governorate.trim();
        const entry = governorateMap.get(key);
        if (entry) entry.count++;
        else governorateMap.set(key, { count: 1, region: school.region });
      }

      const governorateStats = Array.from(governorateMap.entries())
        .map(([governorate, { count, region }]) => ({
          governorate,
          region,
          count,
          percentage: Math.round((count / (regionCounts[region] || 1)) * 100)
        }))
        .sort((a, b) =>
          allRegions.indexOf(a.region) - allRegions.indexOf(b.region) ||
          a.governorate.localeCompare(b.governorate, 'ar')
        );

      // إحصائيات الحالات بالتوازي
      const statusValues = [
        'على رأس العمل',
        'إجازة أمومة/رعاية مولود',
        'إجازة مرضية',
        'إيقاف الراتب مؤقتاً',
        'مجاز استثنائياً',
        'مكفوف اليد',
        'مكلف داخلي',
      ] as const;

      const statusCounts = await Promise.all(
        statusValues.map(s =>
          supabase.from('guards').select('id', { count: 'exact', head: true }).eq('status', s)
        )
      );

      const statusStats = statusValues.map((status, i) => ({
        status,
        count: statusCounts[i].count || 0
      }))
        .map(s => ({
          ...s,
          percentage: Math.round((s.count / (totalGuards || 1)) * 100)
        }))
        .filter(s => s.count > 0);

      return {
        totalSchools: actualTotalSchools,
        totalGuards,
        maleGuards,
        femaleGuards,
        insuredGuards,
        uninsuredGuards,
        activeGuards: activeGuardsCount || 0,
        schoolsWithGuards: actualSchoolsWithGuards,
        schoolsWithoutGuards: actualSchoolsWithoutGuards,
        regionStats,
        governorateStats,
        statusStats
      };
    } catch (error) {
      throw new Error(`خطأ في جلب إحصائيات لوحة القيادة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  static async getSchoolsWithoutGuards(): Promise<School[]> {
    try {
      const [allSchoolsData, linkedIds] = await Promise.all([
        fetchAllPages<School>(([start, end]) =>
          supabase
            .from('schools')
            .select(SCHOOL_FULL_COLUMNS)
            .eq('status', 'نشط')
            .order('school_name')
            .range(start, end)
        ),
        this.getAllLinkedGuardSchoolIds()
      ]);

      return allSchoolsData.filter(school => !linkedIds.has(school.id));
    } catch (error) {
      throw new Error(`خطأ في جلب المدارس بدون حراس: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }
}
