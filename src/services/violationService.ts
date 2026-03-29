import { supabase } from '../lib/supabase';
import { Violation, ViolationForm } from '../types';
import { AuthService } from './authService';

export class ViolationService {
  static async getAllViolations(): Promise<Violation[]> {
    const { data, error } = await supabase
      .from('violations')
      .select(`
        *,
        guard:guards(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`خطأ في جلب بيانات المخالفات: ${error.message}`);
    }

    return data || [];
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