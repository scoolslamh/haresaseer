import { supabase } from '../lib/supabase';
import { DashboardStats } from '../types';
import { School } from '../types';
import { normalizeArabicText } from '../utils/arabicUtils';

export class DashboardService {
  private static async getAllLinkedGuardSchoolIds(): Promise<Set<string>> {
    let page = 0;
    const pageSize = 1000;
    const schoolIds = new Set<string>();

    while (true) {
      const { data, error } = await supabase
        .from('guards')
        .select('school_id')
        .not('school_id', 'is', null)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        throw new Error(`خطأ في جلب روابط الحراس بالمدارس: ${error.message}`);
      }

      const pageData = data || [];
      pageData.forEach((guard) => {
        if (guard.school_id) {
          schoolIds.add(guard.school_id);
        }
      });

      if (pageData.length < pageSize) break;
      page++;
    }

    return schoolIds;
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('🔄 بدء جلب إحصائيات لوحة القيادة...');
      
      // جلب بيانات المدارس أولاً (مطلوب دائماً لحساب إحصائيات المناطق والمحافظات)
      console.log('🔄 جلب بيانات المدارس النشطة...');
      let allSchoolsData = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: pageData, error: schoolsError } = await supabase
          .from('schools')
          .select('*')
          .eq('status', 'نشط')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('school_name');

        if (schoolsError) {
          console.error('❌ خطأ في جلب المدارس:', schoolsError);
          throw new Error(`خطأ في جلب المدارس: ${schoolsError.message}`);
        }

        if (!pageData || pageData.length === 0) break;
        
        allSchoolsData = [...allSchoolsData, ...pageData];
        page++;
        
        console.log(`📄 تم تحميل الصفحة ${page}: ${pageData.length} مدرسة (الإجمالي: ${allSchoolsData.length})`);
        
        if (pageData.length < pageSize) break;
      }

      console.log(`✅ تم تحميل جميع المدارس النشطة: ${allSchoolsData.length} مدرسة`);

      // محاولة استخدام الدالة المحسنة أولاً
      const { data: dashboardStats, error: statsError } = await supabase
        .rpc('get_dashboard_statistics');

      let totalSchools = 0;
      let totalGuards = 0;
      let maleGuards = 0;
      let femaleGuards = 0;
      let insuredGuards = 0;
      let uninsuredGuards = 0;
      let schoolsWithGuardsCount = 0;
      let schoolsWithoutGuardsCount = 0;
      let activeGuardsCount = 0; // New variable for active guards
      
      // حساب العدد الإجمالي للمدارس من البيانات المجلبة الفعلية
      const actualTotalSchools = allSchoolsData?.length || 0;
      console.log(`🏫 العدد الفعلي للمدارس النشطة: ${actualTotalSchools}`);

      const linkedGuardSchoolIds = await this.getAllLinkedGuardSchoolIds();
      const actualSchoolsWithGuards = allSchoolsData.filter((school) =>
        linkedGuardSchoolIds.has(school.id)
      ).length;
      const actualSchoolsWithoutGuards = actualTotalSchools - actualSchoolsWithGuards;

      console.log('🔗 إحصائية ربط المدارس الفعلية:', {
        linkedSchoolIds: linkedGuardSchoolIds.size,
        actualSchoolsWithGuards,
        actualSchoolsWithoutGuards
      });

      if (statsError || !dashboardStats || dashboardStats.length === 0) {
        console.warn('⚠️ فشل في استخدام الدالة المحسنة، سيتم استخدام الطريقة التقليدية:', statsError);
        
        console.log('🔄 بدء الطريقة التقليدية لحساب الإحصائيات...');
        
        // الطريقة التقليدية كبديل
        const { count: totalSchoolsCount } = await supabase
          .from('schools')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'نشط');

        console.log(`🏫 إجمالي المدارس النشطة (الطريقة التقليدية): ${totalSchoolsCount} vs الفعلي: ${actualTotalSchools}`);
        
        const { count: totalGuardsCount } = await supabase
          .from('guards')
          .select('*', { count: 'exact', head: true });

        console.log(`👥 إجمالي الحراس: ${totalGuardsCount}`);
        
        // الحراس حسب الجنس
        const { data: genderData } = await supabase
          .from('guards')
          .select('gender');

        console.log(`👤 بيانات الجنس: ${genderData?.length} سجل`);
        
        // الحراس حسب التأمين
        const { data: insuranceData } = await supabase
          .from('guards')
          .select('insurance');

        console.log(`🛡️ بيانات التأمين: ${insuranceData?.length} سجل`);
        
        // حساب المدارس التي لها حراس بطريقة محسنة
        const { data: schoolsWithGuardsData } = await supabase
          .from('guards')
          .select('school_id')
          .not('school_id', 'is', null);

        console.log(`🔗 الحراس المرتبطين بمدارس: ${schoolsWithGuardsData?.length} سجل`);
        
        const uniqueSchoolsWithGuards = new Set(
          schoolsWithGuardsData?.map(g => g.school_id) || []
        );

        console.log(`🏫 المدارس الفريدة التي لها حراس: ${uniqueSchoolsWithGuards.size}`);
        
        // جلب عدد الحراس على رأس العمل
        const { count: activeGuards } = await supabase
          .from('guards')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'على رأس العمل');
        console.log('Active guards from fallback query:', activeGuards); // DEBUG

        // استخدام العدد الفعلي من البيانات المجلبة
        totalSchools = actualTotalSchools;
        totalGuards = totalGuardsCount || 0;
        maleGuards = genderData?.filter(g => g.gender === 'ذكر').length || 0;
        femaleGuards = genderData?.filter(g => g.gender === 'أنثى').length || 0;
        insuredGuards = insuranceData?.filter(g => g.insurance === 'نعم').length || 0;
        uninsuredGuards = insuranceData?.filter(g => g.insurance === 'لا').length || 0;
        schoolsWithGuardsCount = actualSchoolsWithGuards;
        schoolsWithoutGuardsCount = actualSchoolsWithoutGuards;
        activeGuardsCount = activeGuards || 0;
        
        console.log('📊 النتائج النهائية (الطريقة التقليدية):');
        console.log(`   إجمالي المدارس: ${totalSchools}`);
        console.log(`   المدارس التي لها حراس: ${schoolsWithGuardsCount}`);
        console.log(`   المدارس بدون حراس: ${schoolsWithoutGuardsCount}`);
      } else {
        // استخدام نتائج الدالة المحسنة
        console.log('✅ استخدام نتائج الدالة المحسنة');
        const stats = dashboardStats[0];
        // استخدام العدد الفعلي من البيانات المجلبة بدلاً من الدالة المحسنة
        totalSchools = actualTotalSchools;
        totalGuards = Number(stats.total_guards);
        maleGuards = Number(stats.male_guards);
        femaleGuards = Number(stats.female_guards);
        insuredGuards = Number(stats.insured_guards);
        uninsuredGuards = Number(stats.uninsured_guards);
        schoolsWithGuardsCount = actualSchoolsWithGuards;
        schoolsWithoutGuardsCount = actualSchoolsWithoutGuards;
        
        console.log('📊 النتائج النهائية (الدالة المحسنة):');
        console.log(`   إجمالي المدارس: ${totalSchools}`);
        console.log(`   المدارس التي لها حراس: ${schoolsWithGuardsCount}`);
        console.log(`   المدارس بدون حراس: ${schoolsWithoutGuardsCount}`);
        
        // جلب عدد الحراس على رأس العمل بشكل منفصل
        const { count: activeGuards } = await supabase
          .from('guards')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'على رأس العمل');
        console.log('Active guards from separate query (RPC success path):', activeGuards); // DEBUG
        activeGuardsCount = activeGuards || 0;

        console.log('✅ تم استخدام الدالة المحسنة بنجاح');
      }

      // حساب إحصائيات المناطق والمحافظات من البيانات الفعلية (دائماً)
      console.log('📊 الإحصائيات المحسوبة:', {
        totalSchools,
        totalGuards,
        schoolsWithGuards: schoolsWithGuardsCount,
        schoolsWithoutGuards: schoolsWithoutGuardsCount,
        maleGuards,
        femaleGuards,
        insuredGuards,
        uninsuredGuards
      });

      // تعريف جميع المناطق المطلوبة
      const allRegions = ['عسير', 'جيزان', 'الباحة', 'نجران'];
      
      // تهيئة عداد المناطق بصفر لجميع المناطق
      const regionCounts: { [key: string]: number } = allRegions.reduce((acc: any, region) => {
        acc[region] = 0;
        return acc;
      }, {});
      
      console.log('🔢 عداد المناطق المبدئي:', regionCounts);
      
      // حساب العدد الفعلي من البيانات مع تطبيع النصوص
      allSchoolsData?.forEach(school => {
        const normalizedRegion = normalizeArabicText(school.region);
        console.log(`🔍 معالجة مدرسة: ${school.school_name || 'غير محدد'} - المنطقة الأصلية: "${school.region}" - المنطقة المطبعة: "${normalizedRegion}"`);
        
        // البحث عن المنطقة المطابقة في القائمة المحددة
        const matchingRegion = allRegions.find(region => 
          normalizeArabicText(region) === normalizedRegion
        );
        
        if (matchingRegion) {
          regionCounts[matchingRegion]++;
          console.log(`✅ تم إضافة مدرسة للمنطقة: ${matchingRegion} - العدد الحالي: ${regionCounts[matchingRegion]}`);
        } else {
          console.warn(`⚠️ منطقة غير معروفة: "${school.region}" (مطبعة: "${normalizedRegion}")`);
        }
      });

      console.log('📊 العدد النهائي للمناطق:', regionCounts);

      const regionStats = allRegions.map(region => ({
        region,
        count: regionCounts[region],
        percentage: totalSchools > 0 ? Math.round((regionCounts[region] / totalSchools) * 100) : 0
      }));

      console.log('📈 إحصائيات المناطق النهائية:', regionStats);

      // المدارس حسب المحافظة
      // تعريف جميع المحافظات المطلوبة لكل منطقة
      const allGovernorates = [
        { governorate: 'أبها', region: 'عسير' },
        { governorate: 'خميس مشيط', region: 'عسير' },
        { governorate: 'النماص', region: 'عسير' },
        { governorate: 'بيشة', region: 'عسير' },
        { governorate: 'محايل عسير', region: 'عسير' },
        { governorate: 'سراة عبيدة', region: 'عسير' },
        { governorate: 'تثليث', region: 'عسير' },
        { governorate: 'ظهران الجنوب', region: 'عسير' },
        { governorate: 'طريب', region: 'عسير' },
        { governorate: 'البرك', region: 'عسير' },
        { governorate: 'بلقرن', region: 'عسير' },
        { governorate: 'أحد رفيدة', region: 'عسير' },
        { governorate: 'رجال ألمع', region: 'عسير' },
        { governorate: 'جيزان', region: 'جيزان' },
        { governorate: 'صبيا', region: 'جيزان' },
        { governorate: 'أبو عريش', region: 'جيزان' },
        { governorate: 'صامطة', region: 'جيزان' },
        { governorate: 'بيش', region: 'جيزان' },
        { governorate: 'ضمد', region: 'جيزان' },
        { governorate: 'العيدابي', region: 'جيزان' },
        { governorate: 'فرسان', region: 'جيزان' },
        { governorate: 'العارضة', region: 'جيزان' },
        { governorate: 'الدرب', region: 'جيزان' },
        { governorate: 'الريث', region: 'جيزان' },
        { governorate: 'الطوال', region: 'جيزان' },
        { governorate: 'هروب', region: 'جيزان' },
        { governorate: 'الباحة', region: 'الباحة' },
        { governorate: 'بلجرشي', region: 'الباحة' },
        { governorate: 'المندق', region: 'الباحة' },
        { governorate: 'العقيق', region: 'الباحة' },
        { governorate: 'قلوة', region: 'الباحة' },
        { governorate: 'المخواة', region: 'الباحة' },
        { governorate: 'غامد الزناد', region: 'الباحة' },
        { governorate: 'القرى', region: 'الباحة' },
        { governorate: 'الحجرة', region: 'الباحة' },
        { governorate: 'نجران', region: 'نجران' },
        { governorate: 'شرورة', region: 'نجران' },
        { governorate: 'حبونا', region: 'نجران' },
        { governorate: 'بدر الجنوب', region: 'نجران' },
        { governorate: 'يدمة', region: 'نجران' },
        { governorate: 'خباش', region: 'نجران' },
        { governorate: 'ثار', region: 'نجران' }
      ];

      // إنشاء خريطة للمحافظات الفعلية من قاعدة البيانات
      console.log('🔍 تحليل بيانات المحافظات من قاعدة البيانات...');
      const actualGovernorates = new Map<string, { count: number; region: string }>();
      
      // حساب العدد الفعلي لكل محافظة من البيانات
      allSchoolsData?.forEach(school => {
        const govKey = school.governorate.trim();
        if (actualGovernorates.has(govKey)) {
          actualGovernorates.get(govKey)!.count++;
        } else {
          actualGovernorates.set(govKey, { count: 1, region: school.region });
        }
      });
      
      console.log('📊 المحافظات الفعلية من قاعدة البيانات:', 
        Array.from(actualGovernorates.entries()).map(([gov, data]) => 
          `${gov} (${data.region}): ${data.count}`
        )
      );

      // إنشاء إحصائيات المحافظات بناءً على البيانات الفعلية
      const governorateStats = Array.from(actualGovernorates.entries())
        .map(([governorate, data]) => {
          const regionTotal = regionCounts[data.region] || 1;
          return {
            governorate,
            region: data.region,
            count: data.count,
            percentage: Math.round((data.count / regionTotal) * 100)
          };
        })
        .sort((a, b) => {
          // ترتيب حسب المنطقة أولاً، ثم حسب المحافظة
          if (a.region !== b.region) {
            return allRegions.indexOf(a.region) - allRegions.indexOf(b.region);
          }
          return a.governorate.localeCompare(b.governorate, 'ar');
        });

      // الحراس حسب الحالة
      // الحراس حسب الحالة - استخدام استعلامات محسنة
      const [
        { count: activeStatusCount },
        { count: absentStatusCount },
        { count: excludedStatusCount },
        { count: leaveStatusCount }
      ] = await Promise.all([
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('status', 'على رأس العمل'),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('status', 'منقطع'),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('status', 'مبعد عن المدارس'),
        supabase.from('guards').select('*', { count: 'exact', head: true }).eq('status', 'إجازة')
      ]);

      console.log('Status counts from database:', {
        'على رأس العمل': activeStatusCount,
        'منقطع': absentStatusCount,
        'مبعد عن المدارس': excludedStatusCount,
        'إجازة': leaveStatusCount
      });

      const statusStats = [
        {
          status: 'على رأس العمل',
          count: activeStatusCount || 0,
          percentage: Math.round(((activeStatusCount || 0) / (totalGuards || 1)) * 100)
        },
        {
          status: 'منقطع',
          count: absentStatusCount || 0,
          percentage: Math.round(((absentStatusCount || 0) / (totalGuards || 1)) * 100)
        },
        {
          status: 'مستبعد',
          count: excludedStatusCount || 0,
          percentage: Math.round(((excludedStatusCount || 0) / (totalGuards || 1)) * 100)
        },
        {
          status: 'إجازة',
          count: leaveStatusCount || 0,
          percentage: Math.round(((leaveStatusCount || 0) / (totalGuards || 1)) * 100)
        }
      ].filter(stat => stat.count > 0); // إظهار الحالات التي لها حراس فقط

      return {
        totalSchools,
        totalGuards,
        maleGuards,
        femaleGuards,
        insuredGuards,
        uninsuredGuards,
        activeGuards: activeGuardsCount,
        schoolsWithGuards: schoolsWithGuardsCount,
        schoolsWithoutGuards: schoolsWithoutGuardsCount,
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
      console.log('🔍 بدء تحليل المدارس بدون حراس...');
      
      // جلب جميع المدارس النشطة باستخدام التحميل التدريجي
      console.log('🔄 بدء جلب جميع المدارس النشطة بالطريقة التدريجية...');
      
      let allSchoolsData = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: pageData, error: schoolsError } = await supabase
          .from('schools')
          .select('*')
          .eq('status', 'نشط')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('school_name');

        if (schoolsError) {
          console.error('❌ خطأ في جلب المدارس:', schoolsError);
          throw new Error(`خطأ في جلب المدارس: ${schoolsError.message}`);
        }

        if (!pageData || pageData.length === 0) break;
        
        allSchoolsData = [...allSchoolsData, ...pageData];
        page++;
        
        console.log(`📄 تم تحميل الصفحة ${page}: ${pageData.length} مدرسة (الإجمالي: ${allSchoolsData.length})`);
        
        if (pageData.length < pageSize) break;
      }

      if (!allSchoolsData || allSchoolsData.length === 0) {
        console.warn('⚠️ لا توجد بيانات مدارس');
        return [];
      }

      console.log(`📊 تم جلب جميع المدارس النشطة: ${allSchoolsData.length} مدرسة`);
      
      // جلب جميع معرفات المدارس التي لها حراس باستخدام التحميل التدريجي
      console.log('🔄 بدء جلب جميع الحراس المرتبطين بمدارس...');
      
      let allGuardsData = [];
      page = 0;
      
      while (true) {
        const { data: pageData, error: guardsError } = await supabase
          .from('guards')
          .select('school_id')
          .not('school_id', 'is', null)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (guardsError) {
          console.error('❌ خطأ في جلب الحراس:', guardsError);
          throw new Error(`خطأ في جلب الحراس: ${guardsError.message}`);
        }

        if (!pageData || pageData.length === 0) break;
        
        allGuardsData = [...allGuardsData, ...pageData];
        page++;
        
        console.log(`📄 تم تحميل الصفحة ${page}: ${pageData.length} حارس (الإجمالي: ${allGuardsData.length})`);
        
        if (pageData.length < pageSize) break;
      }

      if (!allGuardsData || allGuardsData.length === 0) {
        console.warn('⚠️ لا توجد بيانات حراس مرتبطين بمدارس');
        console.log(`✅ جميع المدارس الـ ${allSchoolsData.length} بدون حراس`);
        return allSchoolsData;
      }
      
      console.log(`👥 تم جلب جميع الحراس المرتبطين بمدارس: ${allGuardsData.length} حارس`);
      
      const schoolsWithGuardsIds = new Set(
        allGuardsData?.map(g => g.school_id) || []
      );

      console.log(`🏫 عدد المدارس الفريدة التي لها حراس: ${schoolsWithGuardsIds.size}`);
      
      // تصفية المدارس التي ليس لها حراس
      const schoolsWithoutGuards = allSchoolsData.filter(school => 
        !schoolsWithGuardsIds.has(school.id)
      );

      console.log(`🚫 المدارس بدون حراس: ${schoolsWithoutGuards.length}`);
      console.log('📋 قائمة المدارس بدون حراس:', schoolsWithoutGuards.map(s => ({
        id: s.id,
        name: s.school_name,
        region: s.region,
        governorate: s.governorate
      })));
      
      // التحقق من صحة البيانات
      const totalActiveSchools = allSchoolsData.length;
      const schoolsWithGuards = schoolsWithGuardsIds.size;
      const calculatedWithoutGuards = totalActiveSchools - schoolsWithGuards;
      
      console.log('🧮 التحقق من الحسابات:');
      console.log(`   إجمالي المدارس النشطة: ${totalActiveSchools}`);
      console.log(`   المدارس التي لها حراس: ${schoolsWithGuards}`);
      console.log(`   المحسوب (بدون حراس): ${calculatedWithoutGuards}`);
      console.log(`   الفعلي (بدون حراس): ${schoolsWithoutGuards.length}`);
      
      if (calculatedWithoutGuards !== schoolsWithoutGuards.length) {
        console.error('❌ تناقض في الحسابات! يجب مراجعة البيانات');
      } else {
        console.log('✅ الحسابات متطابقة');
      }
      
      return schoolsWithoutGuards;
    } catch (error) {
      console.error('❌ خطأ عام في getSchoolsWithoutGuards:', error);
      throw new Error(`خطأ في جلب المدارس بدون حراس: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }
}
