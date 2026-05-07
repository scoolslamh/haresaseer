import { supabase } from '../lib/supabase';
import { Permission, PermissionModule } from '../types/permissions';

export class PermissionService {
  // جلب جميع الصلاحيات
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module, display_name');

      if (error) {
        // إذا كان الجدول غير موجود، استخدم الصلاحيات الاحتياطية
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.error('خطأ في جلب الصلاحيات من قاعدة البيانات:', error.message);
          console.warn('جدول الصلاحيات غير موجود، سيتم استخدام الصلاحيات الاحتياطية');
          return this.getFallbackPermissions();
        }
        throw new Error(`خطأ في جلب الصلاحيات: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في getAllPermissions:', error);
      return this.getFallbackPermissions();
    }
  }

  // جلب الصلاحيات مجمعة حسب الوحدات
  static async getPermissionsByModule(): Promise<PermissionModule[]> {
    const permissions = await this.getAllPermissions();

    const modules: { [key: string]: PermissionModule } = {};

    permissions.forEach(permission => {
      if (!modules[permission.module]) {
        modules[permission.module] = {
          name: permission.module,
          display_name: this.getModuleDisplayName(permission.module),
          permissions: []
        };
      }
      modules[permission.module].permissions.push(permission);
    });

    return Object.values(modules);
  }

  // جلب صلاحيات مستخدم معين
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      // الخطوة 1: جلب IDs الصلاحيات من user_permissions
      const { data: upData, error: upError } = await supabase
        .from('user_permissions')
        .select('permission_id')
        .eq('user_id', userId);

      if (upError) {
        if (upError.code === '42P01' || upError.code === 'PGRST116') {
          const { data: user } = await supabase
            .from('users').select('role').eq('id', userId).single();
          if (user?.role === 'admin') return this.getFallbackPermissions();
          return [];
        }
        throw new Error(`خطأ في جلب صلاحيات المستخدم: ${upError.message}`);
      }

      if (!upData || upData.length === 0) return [];

      const permissionIds = upData.map(row => row.permission_id).filter(Boolean);
      if (permissionIds.length === 0) return [];

      // الخطوة 2: جلب تفاصيل الصلاحيات مباشرة من permissions
      const { data: permsData, error: permsError } = await supabase
        .from('permissions')
        .select('id, name, display_name, description, module, created_at')
        .in('id', permissionIds);

      if (permsError) {
        throw new Error(`خطأ في جلب تفاصيل الصلاحيات: ${permsError.message}`);
      }

      return (permsData as Permission[]) || [];
    } catch (error) {
      console.error('خطأ في getUserPermissions:', error);
      try {
        const { data: user } = await supabase
          .from('users').select('role').eq('id', userId).single();
        if (user?.role === 'admin') return this.getFallbackPermissions();
      } catch { }
      return [];
    }
  }

  // منح صلاحية لمستخدم
  static async grantPermission(userId: string, permissionId: string, grantedBy: string): Promise<void> {
    const { error } = await supabase
      .from('user_permissions')
      .insert([{
        user_id: userId,
        permission_id: permissionId,
        granted_by: grantedBy
      }]);

    if (error) {
      throw new Error(`خطأ في منح الصلاحية: ${error.message}`);
    }
  }

  // إلغاء صلاحية من مستخدم
  static async revokePermission(userId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('permission_id', permissionId);

    if (error) {
      throw new Error(`خطأ في إلغاء الصلاحية: ${error.message}`);
    }
  }

  // منح مجموعة صلاحيات
  static async grantMultiplePermissions(
    userId: string,
    permissionIds: string[],
    grantedBy: string
  ): Promise<void> {
    // حذف الصلاحيات الحالية أولاً
    await this.revokeAllUserPermissions(userId);

    // إضافة الصلاحيات الجديدة
    const userPermissions = permissionIds.map(permissionId => ({
      user_id: userId,
      permission_id: permissionId,
      granted_by: grantedBy
    }));

    const { error } = await supabase
      .from('user_permissions')
      .insert(userPermissions);

    if (error) {
      throw new Error(`خطأ في منح الصلاحيات: ${error.message}`);
    }
  }

  // إلغاء جميع صلاحيات المستخدم
  static async revokeAllUserPermissions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`خطأ في إلغاء الصلاحيات: ${error.message}`);
    }
  }

  async revokeAllPermissions(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('User permissions table does not exist. Cannot revoke permissions.');
          return false;
        }
        console.error('Failed to revoke all permissions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error revoking all permissions:', error);
      return false;
    }
  }

  // Fallback permissions when database tables don't exist
  static getFallbackPermissions(): Permission[] {
    return [
      { id: 'ea2a5fcc-4a8b-4865-a02e-920c323090ff', name: 'guards.view', display_name: 'عرض الحراس', description: 'عرض قائمة الحراس والبحث فيها', module: 'guards', created_at: new Date().toISOString() },
      { id: '5b7a3005-9864-4312-800f-6cb0f4cd8e27', name: 'guards.create', display_name: 'إضافة حارس', description: 'إضافة حراس جدد للنظام', module: 'guards', created_at: new Date().toISOString() },
      { id: 'db957a81-f3a7-4b6f-9e64-6b27648d7a7d', name: 'guards.edit', display_name: 'تعديل الحراس', description: 'تعديل بيانات الحراس الموجودين', module: 'guards', created_at: new Date().toISOString() },
      { id: 'c61e6827-2755-4f09-9ccf-ead9dc509668', name: 'guards.delete', display_name: 'حذف الحراس', description: 'حذف الحراس من النظام', module: 'guards', created_at: new Date().toISOString() },
      { id: '750a21db-6197-4913-8fd0-b3c3e536c838', name: 'guards.export', display_name: 'تصدير الحراس', description: 'تصدير بيانات الحراس إلى Excel/PDF', module: 'guards', created_at: new Date().toISOString() },
      { id: 'a8794c2f-3237-43ae-ae4f-7b37914cb083', name: 'schools.view', display_name: 'عرض المدارس', description: 'عرض قائمة المدارس والبحث فيها', module: 'schools', created_at: new Date().toISOString() },
      { id: '877a0800-c3c9-4ec5-98e8-f08ea8d9c9a', name: 'schools.create', display_name: 'إضافة مدرسة', description: 'إضافة مدارس جديدة للنظام', module: 'schools', created_at: new Date().toISOString() },
      { id: '0448526d-bf58-4031-865c-575f904ec290', name: 'schools.edit', display_name: 'تعديل المدارس', description: 'تعديل بيانات المدارس الموجودة', module: 'schools', created_at: new Date().toISOString() },
      { id: '891d9ffa-bb38-44e9-a8be-2b45fec2fa76', name: 'schools.delete', display_name: 'حذف المدارس', description: 'حذف المدارس من النظام', module: 'schools', created_at: new Date().toISOString() },
      { id: 'f3e5971b-a809-4a37-913f-e27f01a7475b', name: 'operations.view', display_name: 'عرض العمليات', description: 'عرض سجل العمليات والأنشطة', module: 'operations', created_at: new Date().toISOString() },
      { id: '360d05f5-d858-4df0-beb2-0e4c4100fddf', name: 'operations.transfer', display_name: 'نقل الحراس', description: 'تنفيذ عمليات نقل الحراس بين المدارس', module: 'operations', created_at: new Date().toISOString() },
      { id: '9f07a8b5-0330-464f-8852-e07829063a9', name: 'operations.reassign', display_name: 'إعادة توجيه', description: 'إعادة توجيه الحراس غير المسندين إلى مدارس', module: 'operations', created_at: new Date().toISOString() },
      { id: '59ca0e17-0d3c-40c5-b082-a2df938d31e6', name: 'operations.bulk_delete', display_name: 'حذف جماعي', description: 'حذف مجموعة من الحراس أو المدارس دفعة واحدة', module: 'operations', created_at: new Date().toISOString() },
      { id: 'b1afb433-0a62-413c-8c4a-b74404c44315', name: 'operations.export', display_name: 'تصدير العمليات', description: 'تصدير سجل العمليات إلى Excel/PDF', module: 'operations', created_at: new Date().toISOString() },
      { id: 'ebc5a8bf-0c2d-4d43-8406-b39c48be572a', name: 'reports.dashboard', display_name: 'لوحة القيادة', description: 'عرض الإحصائيات والتقارير الرئيسية', module: 'reports', created_at: new Date().toISOString() },
      { id: '5e8e2cc0-cf6e-4f20-a0c8-73a93ccbbe50', name: 'reports.inquiry', display_name: 'الاستعلامات', description: 'البحث المتقدم والاستعلام عن البيانات', module: 'reports', created_at: new Date().toISOString() },
      { id: '4c68e33f-f1d2-48d7-9ee1-89529d009144', name: 'users.view', display_name: 'عرض المستخدمين', description: 'عرض قائمة المستخدمين في النظام', module: 'users', created_at: new Date().toISOString() },
      { id: 'ef897a6c-8546-46fa-84ae-0190e691279b', name: 'users.create', display_name: 'إضافة مستخدم', description: 'إضافة مستخدمين جدد للنظام', module: 'users', created_at: new Date().toISOString() },
      { id: 'c7d2beb2-f2d0-4d88-bc64-7d6afa884c7f', name: 'users.edit', display_name: 'تعديل المستخدمين', description: 'تعديل بيانات المستخدمين الموجودين', module: 'users', created_at: new Date().toISOString() },
      { id: 'df2faac1-70f5-4848-a93c-5af9725e9471', name: 'users.delete', display_name: 'حذف المستخدمين', description: 'حذف المستخدمين من النظام', module: 'users', created_at: new Date().toISOString() },
      { id: '9e3a8c13-5bad-40d6-8ee7-058132527f6', name: 'users.manage_permissions', display_name: 'إدارة الصلاحيات', description: 'منح وإلغاء صلاحيات المستخدمين', module: 'users', created_at: new Date().toISOString() },
      { id: '28a78a01-ff4d-497a-be1d-7bda9a32e23e', name: 'violations.view', display_name: 'عرض المخالفات', description: 'عرض قائمة المخالفات والبحث فيها', module: 'violations', created_at: new Date().toISOString() },
      { id: 'f1ce11df-91c2-49c3-a34b-780d0d591a29d', name: 'violations.create', display_name: 'إضافة مخالفة', description: 'إضافة مخالفات جديدة للحراس', module: 'violations', created_at: new Date().toISOString() },
      { id: '263f3c46-b2d7-41f5-b493-c91846185d4b', name: 'violations.edit', display_name: 'تعديل المخالفات', description: 'تعديل بيانات المخالفات الموجودة', module: 'violations', created_at: new Date().toISOString() },
      { id: 'b752bf50-3c00-455a-9550-3251ef7b8241', name: 'violations.delete', display_name: 'حذف المخالفات', description: 'حذف المخالفات من النظام', module: 'violations', created_at: new Date().toISOString() },
      { id: 'f05bf66a-ec91-4393-9344-423271abe5b4', name: 'import.data', display_name: 'استيراد البيانات', description: 'استيراد بيانات الحراس والمدارس من ملفات', module: 'import', created_at: new Date().toISOString() },
      { id: '3d1c2cdf-c465-409b-8049-e2d5f3a1d782', name: 'system.settings', display_name: 'إعدادات النظام', description: 'الوصول لإعدادات النظام العامة', module: 'system', created_at: new Date().toISOString() },
      { id: 'c1b2ab2a-82a0-46b3-bec5-14d455e97a68', name: 'system.logs', display_name: 'عرض سجلات النظام', description: 'عرض سجلات النظام والأنشطة', module: 'system', created_at: new Date().toISOString() }
    ];
  }

  // التحقق من صلاحية معينة
  static async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // جلب معرف الصلاحية أولاً
      const { data: permission, error: permError } = await supabase
        .from('permissions')
        .select('id')
        .eq('name', permissionName)
        .single();

      if (permError || !permission) {
        return false;
      }

      // التحقق من وجود الصلاحية للمستخدم
      const { data, error } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .eq('permission_id', permission.id)
        .limit(1);

      if (error) {
        console.warn('خطأ في التحقق من الصلاحية:', error.message);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحية:', error);
      return false;
    }
  }

  // جلب المستخدمين مع صلاحياتهم
  static async getUsersWithPermissions(): Promise<any[]> {
    try {
      // جلب جميع المستخدمين النشطين
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, role, full_name, email, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (usersError) {
        throw new Error(`خطأ في جلب المستخدمين: ${usersError.message}`);
      }

      if (!users || users.length === 0) {
        return [];
      }

      // جلب صلاحيات المستخدمين مع JOIN مدمج
      try {
        const userIds = users.map(user => user.id);
        const { data: userPermRows, error: permissionsError } = await supabase
          .from('user_permissions')
          .select(`
            user_id,
            permission_id,
            permissions(id, name, display_name, description, module, created_at)
          `)
          .in('user_id', userIds);

        if (permissionsError) {
          if (permissionsError.code === '42P01' || permissionsError.code === 'PGRST116') {
            return users.map(user => ({
              ...user,
              permissions: user.role === 'admin' ? this.getFallbackPermissions() : []
            }));
          }
          return users.map(user => ({ ...user, permissions: [] }));
        }

        if (!userPermRows || userPermRows.length === 0) {
          return users.map(user => ({
            ...user,
            permissions: user.role === 'admin' ? this.getFallbackPermissions() : []
          }));
        }

        // بناء خريطة المعرفات → تفاصيل الصلاحية
        const permissionsMap = new Map<string, Permission>();
        const unresolvedIds = new Set<string>();

        for (const row of userPermRows) {
          const perm = row.permissions as unknown as Permission | null;
          if (perm && perm.id) {
            permissionsMap.set(perm.id, perm);
          } else {
            unresolvedIds.add(row.permission_id);
          }
        }

        // حل المعرفات الناقصة عبر القائمة الاحتياطية أو استعلام مباشر
        if (unresolvedIds.size > 0) {
          const fallback = this.getFallbackPermissions();
          const fallbackMap = new Map(fallback.map(p => [p.id, p]));
          const stillUnresolved: string[] = [];

          for (const id of unresolvedIds) {
            const found = fallbackMap.get(id);
            if (found) {
              permissionsMap.set(id, found);
            } else {
              stillUnresolved.push(id);
            }
          }

          if (stillUnresolved.length > 0) {
            try {
              const { data: directPerms } = await supabase
                .from('permissions').select('*').in('id', stillUnresolved);
              if (directPerms) {
                for (const p of directPerms as Permission[]) {
                  permissionsMap.set(p.id, p);
                }
              }
            } catch { }
          }
        }

        // دمج الصلاحيات مع كل مستخدم
        return users.map(user => {
          if (user.role === 'admin') {
            return { ...user, permissions: this.getFallbackPermissions() };
          }
          const userPerms = userPermRows
            .filter(row => row.user_id === user.id)
            .map(row => permissionsMap.get(row.permission_id))
            .filter(Boolean) as Permission[];
          return { ...user, permissions: userPerms };
        });
      } catch (permissionsError) {
        return users.map(user => ({
          ...user,
          permissions: user.role === 'admin' ? this.getFallbackPermissions() : []
        }));
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين مع الصلاحيات:', error);
      return [];
    }
  }

  // الحصول على اسم الوحدة المعروض
  private static getModuleDisplayName(module: string): string {
    const moduleNames: { [key: string]: string } = {
      'guards': 'الحراس',
      'schools': 'المدارس',
      'operations': 'العمليات',
      'violations': 'المخالفات',
      'import': 'الاستيراد',
      'reports': 'التقارير',
      'users': 'المستخدمين',
      'system': 'النظام'
    };
    return moduleNames[module] || module;
  }

  // جلب صلاحية حسب الاسم
  static async getPermissionByName(name: string): Promise<Permission | null> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  // جلب صلاحيات متعددة حسب الأسماء
  static async getMultiplePermissionsByNames(names: string[]): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .in('name', names)
        .order('module, display_name');

      if (error) {
        if (error.code === '42P01') {
          return this.getFallbackPermissions().filter(p => names.includes(p.name));
        }
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.warn('Failed to fetch permissions by names:', error.message);
      return this.getFallbackPermissions().filter(p => names.includes(p.name));
    }
  }
}
