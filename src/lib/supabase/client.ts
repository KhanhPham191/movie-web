import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


  // Chỉ check nếu hoàn toàn không có giá trị, không check placeholder
  // Để Supabase vẫn có thể hoạt động và trả về lỗi thực tế từ server
  if (!supabaseUrl || !supabaseKey) {
    // Chỉ trong quá trình build/prerender mới dùng dummy client
    if (typeof window === 'undefined') {
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
    }
    
    // Trong browser, vẫn cố gắng tạo client với giá trị rỗng
    // Để Supabase tự trả về lỗi thực tế
  }

  // Luôn tạo client với giá trị có (dù có thể là placeholder)
  // Để Supabase tự xử lý và trả về lỗi thực tế nếu không hợp lệ
  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
  )
}




