import { supabase } from '../lib/supabase';
import { User, LoginForm } from '../types';
import { PermissionService } from './permissionService';
import { rateLimiter } from '../utils/rateLimiter';

export class AuthService {
  private static currentUser: User | null = null;
  private static userPermissions: string[] = [];

  static async login(credentials: LoginForm): Promise<User> {
    try {
      // التحقق من Rate Limiting
      const rateLimitError = rateLimiter.check(credentials.username);
      if (rateLimitError) throw new Error(rateLimitError);

      // البحث عن المستخدم أولاً للحصول على البريد الإلكتروني
      const { data: userLookup, error: lookupError } = await supabase
        .from('users')
        .select('id, auth_id, username, email, role, full_name, is_active, created_at, updated_at')
        .eq('username', credentials.username)
        .eq('is_active', true)
        .single();

      if (lookupError) {
        if (lookupError.code === 'PGRST116') {
          // لا نكشف إن كان اسم المستخدم موجوداً أم لا
          throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      if (!userLookup) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }

      if (!userLookup.is_active) {
        throw new Error('حسابك غير نشط. يرجى الاتصال بالمشرف.');
      }

      // استخدام البريد الإلكتروني للمصادقة
      // إذا لم يكن هناك بريد إلكتروني، استخدم النمط المتوقع
      let loginIdentifier = userLookup.email;
      if (!loginIdentifier || loginIdentifier.trim() === '') {
        loginIdentifier = `${credentials.username}@system.local`;
      }

      // تسجيل الدخول باستخدام Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginIdentifier,
        password: credentials.password,
      });

      if (authError) {
        
        // تحليل نوع الخطأ لإعطاء رسالة أكثر دقة
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('البريد الإلكتروني غير مؤكد. يرجى الاتصال بالمشرف.');
        } else if (authError.message.includes('User not found')) {
          throw new Error('المستخدم غير موجود في نظام المصادقة');
        } else {
          throw new Error(`خطأ في المصادقة: ${authError.message}`);
        }
      }

      if (!authData.user) {
        throw new Error('لم يتم العثور على بيانات المستخدم بعد تسجيل الدخول');
      }

      // التحقق من تطابق auth_id مع مستخدم Supabase Auth
      if (userLookup.auth_id !== authData.user.id) {
        throw new Error('هذا الحساب غير مربوط بشكل صحيح بنظام المصادقة. يرجى الاتصال بالمشرف.');
      }

      // إنشاء كائن المستخدم من البيانات المحلية
      const user: User = {
        id: userLookup.id,
        username: userLookup.username,
        role: userLookup.role,
        full_name: userLookup.full_name,
        email: userLookup.email,
        is_active: userLookup.is_active,
        created_at: userLookup.created_at,
        updated_at: userLookup.updated_at
      };

      this.currentUser = user;
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('isAuthenticated', 'true');
      
      // تحميل الصلاحيات الدقيقة للمستخدم (مع معالجة الأخطاء)
      try {
        await this.loadUserPermissions(user.id);
      } catch (permError) {
        console.warn('⚠️ تحذير: لا يمكن تحميل الصلاحيات الدقيقة، سيتم الاعتماد على الدور العام:', permError);
        // لا نرمي خطأ هنا لأن تسجيل الدخول نجح، فقط الصلاحيات الدقيقة لم تُحمل
      }

      rateLimiter.recordSuccess(credentials.username);
      return user;

    } catch (error) {
      rateLimiter.recordFailure(credentials.username);
      this.currentUser = null;
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('isAuthenticated');

      throw error instanceof Error ? error : new Error('حدث خطأ غير متوقع أثناء تسجيل الدخول');
    }
  }

  static async logout(): Promise<void> {
    // مسح البيانات المحلية أولاً دائماً
    this.currentUser = null;
    this.userPermissions = [];
    sessionStorage.clear();

    try {
      // تسجيل الخروج من جميع الجلسات النشطة على السيرفر
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // الجلسة المحلية ممسوحة بالفعل — الخطأ لا يمنع اكتمال تسجيل الخروج
    }
  }

  // مسح جميع بيانات المصادقة (مفيدة عند إعادة تعيين JWT Secret)
  static clearAllAuthData(): void {
    this.currentUser = null;
    this.userPermissions = [];
    sessionStorage.clear();
    supabase.auth.signOut({ scope: 'global' }).catch(() => {});
  }

  // تسجيل خروج قسري (للاستخدام في حالات الطوارئ)
  static forceLogout(): void {
    this.currentUser = null;
    this.userPermissions = [];
    sessionStorage.clear();
    supabase.auth.signOut({ scope: 'global' }).catch(() => {});
    window.location.href = window.location.origin;
  }
  static getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const stored = sessionStorage.getItem('currentUser');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.username && parsed.role) {
          this.currentUser = parsed;

          const storedPermissions = sessionStorage.getItem('userPermissions');
          if (storedPermissions) {
            try {
              this.userPermissions = JSON.parse(storedPermissions);
            } catch {
              this.userPermissions = [];
            }
          }
          return this.currentUser;
        }
      } catch {
        // بيانات تالفة — تجاهل
      }
    }

    return null;
  }

  // تحميل الصلاحيات الدقيقة للمستخدم
  static async loadUserPermissions(userId: string): Promise<void> {
    try {
      const permissions = await PermissionService.getUserPermissions(userId);
      this.userPermissions = permissions.map(p => p.name);
      sessionStorage.setItem('userPermissions', JSON.stringify(this.userPermissions));
    } catch (error) {
      console.warn('⚠️ خطأ في تحميل الصلاحيات الدقيقة:', error);
      this.userPermissions = [];
      sessionStorage.removeItem('userPermissions');
      throw error;
    }
  }

  // التحقق من صلاحية دقيقة (الطريقة الجديدة)
  static hasSpecificPermission(permissionName: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return this.userPermissions.includes(permissionName);
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('خطأ في الحصول على الجلسة من Supabase:', error);
        this.currentUser = null;
        this.userPermissions = [];
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('userPermissions');
        return false;
      }

      if (session) {
        const { data: userLookup, error: lookupError } = await supabase
          .from('users')
          .select('id, auth_id, username, email, role, full_name, is_active, created_at, updated_at')
          .eq('auth_id', session.user.id)
          .single();

        if (lookupError || !userLookup) {
          console.error('خطأ في جلب بيانات المستخدم من قاعدة البيانات بعد الجلسة:', lookupError);
          return false;
        }

        const user: User = {
          id: userLookup.id,
          username: userLookup.username,
          role: userLookup.role,
          full_name: userLookup.full_name,
          email: userLookup.email,
          is_active: userLookup.is_active,
          created_at: userLookup.created_at,
          updated_at: userLookup.updated_at
        };
        this.currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.setItem('isAuthenticated', 'true');

        try {
          await this.loadUserPermissions(user.id);
        } catch (permError) {
          console.warn('⚠️ تحذير: لا يمكن تحميل الصلاحيات:', permError);
        }

        console.log(`🔐 isAuthenticated: true (Supabase session active)`);
        return true;
      } else {
        this.currentUser = null;
        this.userPermissions = [];
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('userPermissions');
        console.log(`🔐 isAuthenticated: false (No Supabase session)`);
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في التحقق من المصادقة:', error);
      return false;
    }
  }

  static hasPermission(requiredRole: string): boolean {
    // إذا كان المطلوب صلاحية دقيقة (تحتوي على نقطة)، استخدم الطريقة الجديدة
    if (requiredRole.includes('.')) {
      return this.hasSpecificPermission(requiredRole);
    }

    // الطريقة القديمة للأدوار العامة (للتوافق العكسي)
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy = { admin: 3, supervisor: 2, data_entry: 1 };
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    return userLevel >= requiredLevel;
  }

  static canEdit(): boolean {
    return this.hasSpecificPermission('guards.edit') ||
           this.hasSpecificPermission('schools.edit') ||
           this.hasSpecificPermission('violations.edit') ||
           this.hasSpecificPermission('users.edit');
  }

  static canDelete(): boolean {
    return this.hasSpecificPermission('guards.delete') ||
           this.hasSpecificPermission('schools.delete') ||
           this.hasSpecificPermission('violations.delete') ||
           this.hasSpecificPermission('users.delete');
  }

  static canManageUsers(): boolean {
    return this.hasSpecificPermission('users.view') ||
           this.hasSpecificPermission('users.create') ||
           this.hasSpecificPermission('users.edit') ||
           this.hasSpecificPermission('users.delete') ||
           this.hasSpecificPermission('users.manage_permissions');
  }

  static canExport(): boolean {
    return this.hasSpecificPermission('guards.export') ||
           this.hasSpecificPermission('operations.export') ||
           this.hasSpecificPermission('reports.export');
  }

  static canImport(): boolean {
    return this.hasSpecificPermission('import.data');
  }

  static canManageOperations(): boolean {
    return this.hasSpecificPermission('operations.view') ||
           this.hasSpecificPermission('operations.transfer') ||
           this.hasSpecificPermission('operations.reassign') ||
           this.hasSpecificPermission('operations.bulk_delete');
  }

  static async refreshUserData(): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) return;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', currentUser.username)
        .single();

      if (userError || !userData) {
        console.warn('⚠️ لا يمكن تحديث بيانات المستخدم:', userError);
        return;
      }

      const user: User = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        full_name: userData.full_name,
        email: userData.email,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      this.currentUser = user;
      sessionStorage.setItem('currentUser', JSON.stringify(user));

      // إعادة تحميل الصلاحيات
      try {
        await this.loadUserPermissions(user.id);
      } catch (permError) {
        console.warn('⚠️ تحذير: لا يمكن إعادة تحميل الصلاحيات:', permError);
      }

      console.log('🔄 تم تحديث بيانات المستخدم بنجاح');
    } catch (error) {
      console.error('❌ خطأ أثناء تحديث بيانات المستخدم:', error);
    }
  }
}