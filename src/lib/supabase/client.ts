import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug logging cho production - chỉ log trong browser
    if (typeof window !== 'undefined') {
    console.log('[Supabase Debug] ===================')
    console.log('[Supabase Debug] URL:', supabaseUrl ? '✅ Có' : '❌ Không có')
    console.log('[Supabase Debug] Key:', supabaseKey ? '✅ Có' : '❌ Không có')
    if (supabaseUrl) {
      console.log('[Supabase Debug] URL value:', supabaseUrl)
    }
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Supabase Debug] ❌ Environment variables chưa được set trên Vercel!')
      console.error('[Supabase Debug] Vui lòng:')
      console.error('[Supabase Debug] 1. Vào Vercel Dashboard → Settings → Environment Variables')
      console.error('[Supabase Debug] 2. Thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY')
      console.error('[Supabase Debug] 3. Chọn Production, Preview, Development')
      console.error('[Supabase Debug] 4. Redeploy project')
    } else {
      console.log('[Supabase Debug] ✅ Environment variables đã được cấu hình!')
    }
    console.log('[Supabase Debug] ===================')
  }

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
    
    // Trong browser, log warning nhưng vẫn cố gắng tạo client với giá trị rỗng
    // Để Supabase tự trả về lỗi thực tế
    console.warn('[Supabase] ⚠️ Environment variables chưa được cấu hình!')
    console.warn('[Supabase] Vui lòng tạo file .env.local với NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Luôn tạo client với giá trị có (dù có thể là placeholder)
  // Để Supabase tự xử lý và trả về lỗi thực tế nếu không hợp lệ
  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
  )
}

