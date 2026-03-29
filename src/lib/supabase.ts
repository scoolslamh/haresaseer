import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// التحقق من وجود متغيرات البيئة
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('متغيرات البيئة مفقودة:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// التحقق من صحة الـ URL
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Supabase URL غير صحيح:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

// إنشاء العميل مع إعدادات محسنة
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'bolt-app'
    }
  }
});

// دالة للتحقق من الاتصال
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('خطأ في اختبار الاتصال مع Supabase:', error);
      return false;
    }
    
    console.log('✅ الاتصال مع Supabase يعمل بشكل صحيح');
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال مع Supabase:', error);
    return false;
  }
};

// دالة للحصول على معلومات الجلسة الحالية
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('خطأ في الحصول على الجلسة:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('خطأ في getCurrentSession:', error);
    return null;
  }
};

