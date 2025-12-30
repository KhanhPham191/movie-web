import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') // 'signup', 'recovery', 'email', etc.
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Nếu có error từ OAuth provider (Google) hoặc email verification
  if (errorParam) {
    return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent(errorParam || 'oauth_failed')}`)
  }

  const supabase = await createClient()

  // Xử lý email verification token (từ link xác minh email)
  if (token_hash && type) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'signup' | 'email' | 'recovery' | 'email_change',
      })

      if (error) {
        // Redirect về trang xác minh với lỗi
        return NextResponse.redirect(`${origin}/xac-minh?error=${encodeURIComponent(error.message || 'verification_failed')}`)
      }

      // Nếu xác minh thành công, redirect về trang chủ
      if (data?.user) {
        return NextResponse.redirect(`${origin}/?verified=true`, {
          status: 307,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
          },
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'verification_failed'
      return NextResponse.redirect(`${origin}/xac-minh?error=${encodeURIComponent(errorMessage)}`)
    }
  }

  // Xử lý OAuth code (Google, etc.)
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        // Redirect về trang đăng nhập nếu có lỗi
        return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent(error.message || 'auth_failed')}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'auth_failed'
      return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent(errorMessage)}`)
    }
  } else if (!token_hash) {
    // Nếu không có code và không có token_hash, có thể là direct access hoặc lỗi
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



