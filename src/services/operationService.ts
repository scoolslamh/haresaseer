import { supabase } from '../lib/supabase';
import { Operation } from '../types';
import { AuthService } from './authService';
import { searchInArabicText } from '../utils/arabicUtils';

export interface OperationFilters {
  search?: string;
  operationType?: string;
  dateFrom?: string;
  dateTo?: string;
  guardId?: string;
}

export interface OperationStats {
  total: number;
  transfers: number;
  reassignments: number;
  additions: number;
  modifications: number;
  deletions: number;
  violations: number;
  today: number;
}

const OPERATION_SELECT = `
  id,
  operation_type,
  description,
  guard_id,
  school_from_id,
  school_to_id,
  performed_by,
  created_at,
  guard:guards(id, guard_name, civil_id, mobile, status),
  school_from:school_from_id(id, school_name, region, governorate, principal_name),
  school_to:school_to_id(id, school_name, region, governorate, principal_name),
  user:users(id, full_name)
`;

export class OperationService {
  private static applyOperationFilters(query: any, filters: OperationFilters = {}) {
    if (filters.operationType && filters.operationType !== 'all') {
      query = query.eq('operation_type', filters.operationType);
    }

    if (filters.guardId && filters.guardId !== 'all') {
      query = query.eq('guard_id', filters.guardId);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', `${filters.dateFrom}T00:00:00`);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
    }

    return query;
  }

  private static matchesSearch(operation: Operation, searchTerm: string): boolean {
    if (!searchTerm.trim()) return true;

    return (
      searchInArabicText(operation.description || '', searchTerm) ||
      searchInArabicText(operation.guard?.guard_name || '', searchTerm) ||
      searchInArabicText(operation.school_from?.school_name || '', searchTerm) ||
      searchInArabicText(operation.school_to?.school_name || '', searchTerm) ||
      searchInArabicText(operation.user?.full_name || '', searchTerm)
    );
  }

  private static calculateStats(operations: Operation[]): OperationStats {
    const today = new Date().toDateString();

    return {
      total: operations.length,
      transfers: operations.filter(op => op.operation_type === 'نقل').length,
      reassignments: operations.filter(op => op.operation_type === 'إعادة توجيه').length,
      additions: operations.filter(op => op.operation_type === 'إضافة حارس' || op.operation_type === 'إضافة مدرسة').length,
      modifications: operations.filter(op => op.operation_type === 'تعديل بيانات').length,
      deletions: operations.filter(op => op.operation_type === 'حذف حارس' || op.operation_type === 'حذف مدرسة' || op.operation_type === 'حذف مجموعة').length,
      violations: operations.filter(op => op.operation_type === 'إضافة مخالفة').length,
      today: operations.filter(op => new Date(op.created_at).toDateString() === today).length
    };
  }

  private static async countOperations(filters: OperationFilters = {}, extra?: (query: any) => any): Promise<number> {
    let query = supabase
      .from('operations')
      .select('id', { count: 'exact', head: true });

    query = this.applyOperationFilters(query, filters);

    if (extra) {
      query = extra(query);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`خطأ في حساب سجل العمليات: ${error.message}`);
    }

    return count || 0;
  }

  static async getOperationStats(filters: OperationFilters = {}): Promise<OperationStats> {
    if (filters.search?.trim()) {
      const operations = await this.getOperationsForSearch(filters);
      return this.calculateStats(operations);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      total,
      transfers,
      reassignments,
      guardAdditions,
      schoolAdditions,
      modifications,
      guardDeletions,
      schoolDeletions,
      bulkDeletions,
      violations,
      today
    ] = await Promise.all([
      this.countOperations(filters),
      this.countOperations(filters, q => q.eq('operation_type', 'نقل')),
      this.countOperations(filters, q => q.eq('operation_type', 'إعادة توجيه')),
      this.countOperations(filters, q => q.eq('operation_type', 'إضافة حارس')),
      this.countOperations(filters, q => q.eq('operation_type', 'إضافة مدرسة')),
      this.countOperations(filters, q => q.eq('operation_type', 'تعديل بيانات')),
      this.countOperations(filters, q => q.eq('operation_type', 'حذف حارس')),
      this.countOperations(filters, q => q.eq('operation_type', 'حذف مدرسة')),
      this.countOperations(filters, q => q.eq('operation_type', 'حذف مجموعة')),
      this.countOperations(filters, q => q.eq('operation_type', 'إضافة مخالفة')),
      this.countOperations(filters, q => q.gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString()))
    ]);

    return {
      total,
      transfers,
      reassignments,
      additions: guardAdditions + schoolAdditions,
      modifications,
      deletions: guardDeletions + schoolDeletions + bulkDeletions,
      violations,
      today
    };
  }

  private static async getOperationsForSearch(filters: OperationFilters = {}): Promise<Operation[]> {
    const pageSize = 1000;
    let page = 0;
    let allOperations: Operation[] = [];

    while (true) {
      let query = supabase
        .from('operations')
        .select(OPERATION_SELECT)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      query = this.applyOperationFilters(query, filters);

      const { data, error } = await query;

      if (error) {
        throw new Error(`خطأ في جلب سجل العمليات: ${error.message}`);
      }

      const operationsPage = (data || []) as Operation[];
      allOperations = [...allOperations, ...operationsPage];

      if (operationsPage.length < pageSize) {
        break;
      }

      page++;
    }

    return allOperations.filter(operation => this.matchesSearch(operation, filters.search || ''));
  }

  static async getFilteredOperations(
    filters: OperationFilters = {},
    page: number = 1,
    itemsPerPage: number = 20
  ): Promise<{ operations: Operation[]; totalCount: number; stats: OperationStats }> {
    if (filters.search?.trim()) {
      const filteredOperations = await this.getOperationsForSearch(filters);
      const startIndex = (page - 1) * itemsPerPage;

      return {
        operations: filteredOperations.slice(startIndex, startIndex + itemsPerPage),
        totalCount: filteredOperations.length,
        stats: this.calculateStats(filteredOperations)
      };
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage - 1;

    let query = supabase
      .from('operations')
      .select(OPERATION_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    query = this.applyOperationFilters(query, filters);

    const [{ data, error, count }, stats] = await Promise.all([
      query,
      this.getOperationStats(filters)
    ]);

    if (error) {
      throw new Error(`خطأ في جلب سجل العمليات: ${error.message}`);
    }

    return {
      operations: (data || []) as Operation[],
      totalCount: count || 0,
      stats
    };
  }

  static async getOperationsForExport(filters: OperationFilters = {}): Promise<Operation[]> {
    if (filters.search?.trim()) {
      return this.getOperationsForSearch(filters);
    }

    const pageSize = 1000;
    let page = 0;
    let allOperations: Operation[] = [];

    while (true) {
      let query = supabase
        .from('operations')
        .select(OPERATION_SELECT)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      query = this.applyOperationFilters(query, filters);

      const { data, error } = await query;

      if (error) {
        throw new Error(`خطأ في جلب سجل العمليات للتصدير: ${error.message}`);
      }

      const operationsPage = (data || []) as Operation[];
      allOperations = [...allOperations, ...operationsPage];

      if (operationsPage.length < pageSize) {
        break;
      }

      page++;
    }

    return allOperations;
  }

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
