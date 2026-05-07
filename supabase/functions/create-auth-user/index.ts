import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, accept, origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

serve(async (req: Request) => {
  // معالجة طلبات CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: 'متغيرات البيئة مفقودة',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const {
      username,
      password,
      role,
      full_name,
      email,
      is_active,
    } = await req.json();

    // التحقق من البيانات المطلوبة
    if (!username || !password || !role || !full_name) {
      return new Response(
        JSON.stringify({
          error:
            'البيانات المطلوبة مفقودة: username, password, role, full_name',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // التحقق من وجود اسم المستخدم
    const {
      data: existingUser,
      error: checkError,
    } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({
          error: `خطأ في التحقق: ${checkError.message}`,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: 'اسم المستخدم موجود بالفعل',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const authEmail =
      email && email.trim()
        ? email.trim()
        : `${username}@system.local`;

    // إنشاء المستخدم في Auth
    const {
      data: authUserData,
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name,
        role,
        is_active: is_active !== false,
      },
    });

    if (authError) {
      return new Response(
        JSON.stringify({
          error: `خطأ في إنشاء مستخدم Auth: ${authError.message}`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const authUserId = authUserData.user.id;

    const baseUserData = {
      id: authUserId,
      username,
      password_hash: 'managed_by_auth',
      role,
      full_name,
      email: authEmail,
      is_active: is_active !== false,
    };

    let profileData: any = null;
    let profileError: any = null;

    // محاولة الإدخال مع auth_id
    const insertWithAuthId = await supabaseAdmin
      .from('users')
      .insert([
        {
          ...baseUserData,
          auth_id: authUserId,
        },
      ])
      .select(
        'id, username, role, full_name, email, is_active, created_at, updated_at'
      )
      .single();

    // إذا لم يوجد عمود auth_id
    if (
      insertWithAuthId.error &&
      insertWithAuthId.error.code === '42703'
    ) {
      const insertWithout = await supabaseAdmin
        .from('users')
        .insert([baseUserData])
        .select(
          'id, username, role, full_name, email, is_active, created_at, updated_at'
        )
        .single();

      profileData = insertWithout.data;
      profileError = insertWithout.error;
    } else {
      profileData = insertWithAuthId.data;
      profileError = insertWithAuthId.error;
    }

    // rollback عند الفشل
    if (profileError) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      } catch (_) {}

      return new Response(
        JSON.stringify({
          error: `خطأ في إنشاء الملف الشخصي: ${profileError.message}`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        ...profileData,
        auth_email: authEmail,
        message: 'تم إنشاء المستخدم بنجاح',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: `خطأ عام: ${err?.message || 'خطأ غير محدد'}`,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});