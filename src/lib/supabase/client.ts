import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Kiểm tra nếu chưa cấu hình Supabase
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your_supabase_project_url_here' ||
      !supabaseUrl.startsWith('http')) {
    // Trả về một dummy client để tránh lỗi
    // Trong production, bạn nên cấu hình đầy đủ Supabase
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

