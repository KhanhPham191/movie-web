import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Danh sách các path không cần check IP (public APIs, auth callbacks, etc.)
const BYPASS_PATHS = [
  '/api/',
  '/auth/callback',
  '/blocked',
  '/_next',
]

// Kiểm tra xem path có cần bypass không
function shouldBypassGeoCheck(pathname: string): boolean {
  return BYPASS_PATHS.some(path => pathname.startsWith(path))
}

// Lấy country code từ IP
async function getCountryCode(request: NextRequest): Promise<string | null> {
  // Ưu tiên 1: Sử dụng Vercel geolocation header (miễn phí và chính xác)
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  if (vercelCountry) {
    return vercelCountry.toUpperCase()
  }

  // Ưu tiên 2: Sử dụng Cloudflare header (nếu dùng Cloudflare)
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry) {
    return cfCountry.toUpperCase()
  }

  // Fallback: Sử dụng API miễn phí (chỉ khi không có header từ hosting)
  // Lưu ý: API này có rate limit, nên chỉ dùng khi cần thiết
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown'
    
    // Bỏ qua nếu là localhost hoặc private IP
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      // Trong môi trường dev, cho phép truy cập
      if (process.env.NODE_ENV === 'development') {
        return 'VN' // Mặc định cho phép trong dev
      }
      return null
    }

    // Sử dụng ip-api.com (miễn phí, 45 requests/minute)
    // Sử dụng AbortController để timeout sau 2 giây
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    try {
      const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,countryCode`, {
        headers: {
          'User-Agent': 'Next.js-Middleware',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success' && data.countryCode) {
          return data.countryCode.toUpperCase()
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      // Nếu timeout hoặc lỗi network, throw để catch bên ngoài xử lý
      throw fetchError
    }
    
    if (response.ok) {
      const data = await response.json()
      if (data.status === 'success' && data.countryCode) {
        return data.countryCode.toUpperCase()
      }
    }
  } catch (error) {
    console.error('Error fetching country code:', error)
    // Nếu lỗi, cho phép truy cập trong dev, chặn trong production
    if (process.env.NODE_ENV === 'development') {
      return 'VN'
    }
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bỏ qua geo check cho các path đặc biệt
  if (shouldBypassGeoCheck(pathname)) {
    // Tiếp tục với Supabase middleware nếu cần
    return await handleSupabaseAuth(request)
  }

  // Kiểm tra IP blocking (chỉ khi ENABLE_GEO_BLOCKING = true)
  const enableGeoBlocking = process.env.ENABLE_GEO_BLOCKING === 'true'
  
  if (enableGeoBlocking) {
    // Lấy danh sách quốc gia được phép (mặc định là VN)
    const allowedCountries = (process.env.ALLOWED_COUNTRIES || 'VN')
      .split(',')
      .map(c => c.trim().toUpperCase())

    const countryCode = await getCountryCode(request)

    // Nếu không xác định được country code và không phải dev, chặn
    if (!countryCode) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.redirect(new URL('/blocked', request.url))
      }
    } else if (!allowedCountries.includes(countryCode)) {
      // Chặn nếu không phải quốc gia được phép
      return NextResponse.redirect(new URL('/blocked', request.url))
    }
  }

  // Tiếp tục với Supabase middleware
  return await handleSupabaseAuth(request)
}

// Tách logic Supabase auth ra function riêng
async function handleSupabaseAuth(request: NextRequest) {
  // Chỉ chạy Supabase middleware nếu có đầy đủ env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Nếu chưa cấu hình Supabase, bỏ qua middleware
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your_supabase_project_url_here' ||
      !supabaseUrl.startsWith('http')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml (sitemap file)
     * - robots.txt (robots file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}



















