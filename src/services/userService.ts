import { supabase } from '../lib/supabase';
import { User, UserForm } from '../types';
import { PermissionService } from './permissionService';
import { PERMISSION_GROUPS } from '../types/permissions';
import { normalizeArabicText } from '../utils/arabicUtils';
import bcrypt from 'bcryptjs';

export class UserService {
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, full_name, email, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        throw new Error(`خطأ في جلب بيانات المستخدمين: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في getAllUsers:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, full_name, email, is_active, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('خطأ في جلب المستخدم:', error);
        throw new Error(`خطأ في جلب بيانات المستخدم: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('خطأ في getUserById:', error);
      throw error;
    }
  }

  static async createUser(userData: UserForm): Promise<User> {
    try {
      if (!userData.plain_password || userData.plain_password.trim().length < 8) {
        throw new Error('كلمة المرور مطلوبة ويجب أن تكون 8 أحرف على الأقل');
      }

      // الحصول على URL Supabase الصحيح
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('متغير البيئة VITE_SUPABASE_URL غير موجود');
      }

      // التحقق من وجود جلسة نشطة ورمز الوصول
      const session = (await supabase.auth.getSession()).data.session;
      if (!session || !session.access_token) {
        throw new Error('لا توجد جلسة مستخدم نشطة. يرجى تسجيل الدخول مرة أخرى.');
      }

      // إرسال كلمة المرور عبر HTTPS إلى Edge Function التي تتولى التشفير
      const response = await fetch(`${supabaseUrl}/functions/v1/create-auth-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          username: userData.username.trim(),
          password: userData.plain_password.trim(),
          role: userData.role,
          full_name: userData.full_name.trim(),
          email: userData.email?.trim() || null,
          is_active: userData.is_active !== false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ خطأ من Edge Function:', result.error);
        throw new Error(result.error || 'خطأ غير معروف عند إنشاء المستخدم');
      }

      console.log('✅ تم إنشاء المستخدم بنجاح:', result);
      
      return result;

    } catch (error) {
      console.error('❌ خطأ عام في createUser:', error);
      throw error;
    }
  }

  static async updateUser(id: string, userData: Partial<UserForm>): Promise<User> {
    try {
      if (!id) {
        throw new Error('معرف المستخدم مطلوب');
      }

      // التحقق من وجود المستخدم
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error('المستخدم غير موجود');
      }

      const updateData: any = {
        role: userData.role,
        full_name: userData.full_name?.trim(),
        email: userData.email?.trim() || '',
        is_active: userData.is_active
      };

      // تحديث كلمة المرور إذا تم توفيرها
      if (userData.plain_password && userData.plain_password.trim()) {
        if (userData.plain_password.trim().length < 8) {
          throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        }
        updateData.password_hash = await bcrypt.hash(userData.plain_password.trim(), 12);
      }

      console.log('تحديث المستخدم:', id, { ...updateData, password_hash: updateData.password_hash ? '[مشفرة]' : undefined });

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, username, role, full_name, email, is_active, created_at, updated_at')
        .single();

      if (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        throw new Error(`خطأ في تحديث بيانات المستخدم: ${error.message}`);
      }

      if (!data) {
        throw new Error('لم يتم إرجاع بيانات المستخدم بعد التحديث');
      }

      console.log('تم تحديث المستخدم بنجاح:', data);
      return data;

    } catch (error) {
      console.error('خطأ في updateUser:', error);
      throw error;
    }
  }

  static async updateProfile(id: string, profileData: {
    full_name: string;
    email: string;
    current_password?: string;
    new_password?: string;
  }): Promise<User> {
    try {
      const updateData: any = {
        full_name: profileData.full_name.trim(),
        email: profileData.email.trim()
      };

      // تحديث كلمة المرور إذا تم توفيرها
      if (profileData.new_password && profileData.current_password) {
        if (profileData.new_password.trim().length < 8) {
          throw new Error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
        }
        // التحقق من كلمة المرور الحالية
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('password_hash')
          .eq('id', id)
          .single();

        if (userError) {
          throw new Error('خطأ في التحقق من كلمة المرور الحالية');
        }

        const isValidPassword = await bcrypt.compare(profileData.current_password, userData.password_hash);
        if (!isValidPassword) {
          throw new Error('كلمة المرور الحالية غير صحيحة');
        }

        updateData.password_hash = await bcrypt.hash(profileData.new_password, 12);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, username, role, full_name, email, is_active, created_at, updated_at')
        .single();

      if (error) {
        throw new Error(`خطأ في تحديث الملف الشخصي: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('خطأ في updateProfile:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('معرف المستخدم مطلوب');
      }

      // تعطيل المستخدم بدلاً من حذفه نهائياً
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('خطأ في حذف المستخدم:', error);
        throw new Error(`خطأ في حذف المستخدم: ${error.message}`);
      }

      console.log('تم تعطيل المستخدم بنجاح:', id);
    } catch (error) {
      console.error('خطأ في deleteUser:', error);
      throw error;
    }
  }

  static async checkUsernameExists(username: string, excludeId?: string): Promise<boolean> {
    try {
      if (!username) {
        return false;
      }

      let query = supabase
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .limit(1);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('خطأ في التحقق من اسم المستخدم:', error);
        throw new Error(`خطأ في التحقق من اسم المستخدم: ${error.message}`);
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('خطأ في checkUsernameExists:', error);
      throw error;
    }
  }

  // دالة مساعدة للتحقق من الاتصال
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('خطأ في اختبار الاتصال:', error);
      return false;
    }
  }
}