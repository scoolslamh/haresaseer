
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// إعدادات CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req: Request) => {
  // التعامل مع طلبات OPTIONS (preflight requests)
  if (req.method === 'OPTIONS') {
    console.log('🔄 معالجة طلب OPTIONS (preflight)');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    console.log('🚀 بدء معالجة طلب إنشاء مستخدم');
    
    // التحقق من وجود متغيرات البيئة
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('🔍 فحص متغيرات البيئة:', {
      supabaseUrl: supabaseUrl ? 'موجود' : 'مفقود',
      serviceRoleKey: serviceRoleKey ? `موجود (${serviceRoleKey.substring(0, 20)}...)` : 'مفقود'
    });

    if (!supabaseUrl || !serviceRoleKey) {
      const error = 'متغيرات البيئة مفقودة: SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY';
      console.error('❌', error);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // قراءة بيانات الطلب
    const requestBody = await req.json();
    console.log('📝 بيانات الطلب:', { 
      ...requestBody, 
      password: requestBody.password ? '[مخفية]' : 'غير موجودة' 
    });

    const { username, password, role, full_name, email, is_active } = requestBody;

    // التحقق من البيانات المطلوبة
    if (!username || !password || !role || !full_name) {
      const error = 'البيانات المطلوبة مفقودة: username, password, role, full_name';
      console.error('❌', error);
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // إنشاء عميل Supabase مع Service Role Key
    console.log('🔧 إنشاء عميل Supabase Admin');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // التحقق من عدم وجود اسم المستخدم مسبقاً
    console.log('🔍 التحقق من وجود اسم المستخدم:', username);
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ خطأ في التحقق من اسم المستخدم:', checkError);
      return new Response(JSON.stringify({ error: `خطأ في التحقق من اسم المستخدم: ${checkError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (existingUser) {
      const error = 'اسم المستخدم موجود بالفعل';
      console.error('❌', error);
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ اسم المستخدم متاح');

    // إنشاء بريد إلكتروني للمصادقة
    // إذا لم يتم توفير بريد إلكتروني، استخدم نمط ثابت
    const authEmail = email && email.trim() ? email.trim() : `${username}@system.local`;
    console.log('📧 البريد الإلكتروني للمصادقة:', authEmail);

    // إنشاء المستخدم في Supabase Auth
    console.log('🔐 إنشاء مستخدم في Supabase Auth');
    
    const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true, // تأكيد البريد الإلكتروني تلقائياً
      user_metadata: {
        username: username,
        full_name: full_name,
        role: role,
        is_active: is_active !== false
      }
    });

    if (authError) {
      console.error('❌ خطأ في إنشاء مستخدم Auth:', authError);
      return new Response(JSON.stringify({ error: `خطأ في إنشاء مستخدم Auth: ${authError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ تم إنشاء مستخدم Auth بنجاح:', authUserData.user.id);

    const authUserId = authUserData.user.id;

    // إنشاء ملف المستخدم في جدول users
    console.log('📊 إنشاء ملف المستخدم في جدول users');
    const userData = {
      id: authUserId, // استخدام نفس ID من Supabase Auth
      username: username,
      password_hash: 'managed_by_auth', // كلمة المرور تُدار بواسطة Supabase Auth
      role: role,
      full_name: full_name,
      email: authEmail, // استخدام نفس البريد الإلكتروني المستخدم في Auth
      is_active: is_active !== false
    };

    console.log('📝 بيانات المستخدم للإدخال:', { 
      ...userData, 
      password_hash: '[محمي]',
      id: `${authUserId.substring(0, 8)}...` 
    });

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select('id, username, role, full_name, email, is_active, created_at, updated_at')
      .single();

    if (profileError) {
      console.error('❌ خطأ في إنشاء ملف المستخدم:', profileError);
      console.error('❌ تفاصيل الخطأ:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      });
      
      // إذا فشل إنشاء الملف الشخصي، احذف المستخدم من Auth
      console.log('🗑️ حذف مستخدم Auth بسبب فشل إنشاء الملف الشخصي');
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        console.log('✅ تم حذف مستخدم Auth');
      } catch (deleteError) {
        console.error('❌ خطأ في حذف مستخدم Auth:', deleteError);
      }
      
      return new Response(JSON.stringify({ 
        error: `خطأ في إنشاء ملف المستخدم: ${profileError.message}`,
        details: profileError
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ تم إنشاء المستخدم بنجاح:', profileData.id);

    // التحقق من التطابق بين Auth و public.users
    console.log('🔍 التحقق من التطابق بين Auth و public.users');
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role, full_name, is_active')
      .eq('id', authUserId)
      .single();

    if (verifyError || !verifyUser) {
      console.error('❌ فشل التحقق من المستخدم بعد الإنشاء:', verifyError);
    } else {
      console.log('✅ تم التحقق من المستخدم بنجاح:', {
        id: verifyUser.id,
        username: verifyUser.username,
        email: verifyUser.email,
        role: verifyUser.role,
        is_active: verifyUser.is_active
      });
    }

    // إرجاع بيانات المستخدم الجديد
    return new Response(JSON.stringify({
      ...profileData,
      auth_email: authEmail,
      message: 'تم إنشاء المستخدم بنجاح'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('❌ خطأ عام في الدالة:', err);
    console.error('❌ تفاصيل الخطأ:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    return new Response(JSON.stringify({ 
      error: `خطأ عام: ${err.message}`,
      details: err.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});