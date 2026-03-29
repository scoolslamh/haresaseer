import { supabase } from '../lib/supabase';
import { Operation } from '../types';
import { AuthService } from './authService';

export class OperationService {
  static async getAllOperations(): Promise<Operation[]> {
    console.log('🔄 بدء جلب جميع العمليات من قاعدة البيانات...');
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        guard:guards(*),
        school_from:school_from_id(id, school_name),
        school_to:school_to_id(id, school_name),
        user:users(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ خطأ في جلب العمليات من قاعدة البيانات:', error);
      throw new Error(`خطأ في جلب سجل العمليات: ${error.message}`);
    }

    console.log(`✅ تم جلب ${data?.length || 0} عملية من قاعدة البيانات`);
    return data || [];
  }

  static async logOperation(
    operationType: Operation['operation_type'],
    description: string,
    guardId?: string,
    schoolFromId?: string,
    schoolToId?: string
  ): Promise<Operation> {
    console.log('🔄 بدء تسجيل عملية جديدة:', {
      operationType,
      description,
      guardId,
      schoolFromId,
      schoolToId
    });

    const ALLOWED_OPERATION_TYPES: Operation['operation_type'][] = [
      'نقل', 'إعادة توجيه', 'إضافة حارس', 'إضافة مدرسة', 'تعديل بيانات',
      'حذف حارس', 'حذف مدرسة', 'حذف مجموعة', 'إضافة مخالفة', 'إضافة مستخدم', 'حذف مستخدم'
    ];

    if (!ALLOWED_OPERATION_TYPES.includes(operationType)) {
      throw new Error('نوع العملية غير مسموح به');
    }

    if (!description || description.trim().length === 0 || description.length > 500) {
      throw new Error('وصف العملية غير صالح');
    }

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      console.error('❌ لا يوجد مستخدم مسجل دخول لتسجيل العملية');
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    console.log('✅ المستخدم الحالي:', {
      id: currentUser.id,
      username: currentUser.username,
      full_name: currentUser.full_name
    });

    const operationData = {
      operation_type: operationType,
      description,
      guard_id: guardId || null,
      school_from_id: schoolFromId || null,
      school_to_id: schoolToId || null,
      performed_by: currentUser.id
    };

    console.log('📝 بيانات العملية المراد إدخالها:', operationData);

    const { data, error } = await supabase
      .from('operations')
      .insert([operationData])
      .select(`
        *,
        guard:guards(*),
        school_from:school_from_id(id, school_name),
        school_to:school_to_id(id, school_name),
        user:users(id, full_name)
      `)
      .single();

    if (error) {
      console.error('❌ خطأ في إدخال العملية إلى قاعدة البيانات:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw new Error(`خطأ في تسجيل العملية: ${error.message}`);
    }

    console.log('✅ تم تسجيل العملية بنجاح:', data);
    return data;
  }

  static async getOperationsByGuard(guardId: string): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        guard:guards(*),
        school_from:school_from_id(id, school_name),
        school_to:school_to_id(id, school_name),
        user:users(id, full_name)
      `)
      .eq('guard_id', guardId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`خطأ في جلب عمليات الحارس: ${error.message}`);
    }

    return data || [];
  }

  static async getRecentOperations(limit: number = 10): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        guard:guards(*),
        school_from:school_from_id(id, school_name),
        school_to:school_to_id(id, school_name),
        user:users(id, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`خطأ في جلب العمليات الحديثة: ${error.message}`);
    }

    return data || [];
  }
}