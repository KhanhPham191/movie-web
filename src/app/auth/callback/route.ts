import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[Auth Callback] Error exchanging code:', error)
        // Redirect về trang đăng nhập nếu có lỗi
        return NextResponse.redirect(`${origin}/dang-nhap?error=auth_failed`)
      }
    } catch (error) {
      console.error('[Auth Callback] Error:', error)
      return NextResponse.redirect(`${origin}/dang-nhap?error=auth_failed`)
    }
  }

  // Redirect về trang chủ mà không có query params (dùng 307 để giữ method)
  return NextResponse.redirect(`${origin}/`, {
    status: 307,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}



