import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Kiểm tra nếu chưa cấu hình Supabase
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your_supabase_project_url_here' ||
      !supabaseUrl.startsWith('http')) {
    // Log error để debug
    if (typeof window !== 'undefined') {
      console.error('[Supabase] ⚠️ Environment variables chưa được cấu hình đúng!')
      console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'undefined')
      console.error('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '***' : 'undefined')
      console.error('[Supabase] Vui lòng tạo file .env.local với các biến môi trường cần thiết')
      console.error('[Supabase] Hướng dẫn: https://supabase.com/dashboard > Project Settings > API')
    }
    // Throw error thay vì trả về dummy client để người dùng biết cần cấu hình
    throw new Error(
      'Supabase chưa được cấu hình. Vui lòng tạo file .env.local với NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Xem README.md để biết thêm chi tiết.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

