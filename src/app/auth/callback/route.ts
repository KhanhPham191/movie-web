import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Nếu có error từ OAuth provider (Google)
  if (errorParam) {
    return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent(errorParam || 'oauth_failed')}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        // Redirect về trang đăng nhập nếu có lỗi
        return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent(error.message || 'auth_failed')}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'auth_failed'
      return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent(errorMessage)}`)
    }
  } else {
    // Nếu không có code, có thể là direct access hoặc lỗi
    return NextResponse.redirect(`${origin}/dang-nhap?error=no_code`)
  }

  // Redirect về trang chủ mà không có query params (dùng 307 để giữ method)
  return NextResponse.redirect(`${origin}/`, {
    status: 307,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}



