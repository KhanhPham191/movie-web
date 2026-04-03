import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // HSTS: ép trình duyệt luôn dùng HTTPS trong tương lai.
  // Gắn ở middleware để đảm bảo header luôn xuất hiện (kể cả khi proxy/CDN hoặc
  // Next `headers()` không được phản ánh trên deployment hiện tại).
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains",
  )
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
