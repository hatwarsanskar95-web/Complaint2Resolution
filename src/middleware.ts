import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  // Bypass auth middleware checks for dedicated callback, verification success, and reset password pages
  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/verification-success') ||
    pathname.startsWith('/reset-password')
  ) {
    return supabaseResponse
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://udixuacseoloktbzuyrs.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = (user?.user_metadata?.role || 'citizen').toLowerCase()

  // 1. Protect Admin routes (must be dept_admin or super_admin)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (role !== 'dept_admin' && role !== 'super_admin') {
      if (role === 'officer') return NextResponse.redirect(new URL('/officer/dashboard', request.url))
      return NextResponse.redirect(new URL('/citizen/dashboard', request.url))
    }
  }

  // 2. Protect Officer routes (must be officer, dept_admin, or super_admin)
  if (pathname.startsWith('/officer') && pathname !== '/officer/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/officer/login', request.url))
    }
    if (role === 'citizen') {
      return NextResponse.redirect(new URL('/citizen/dashboard', request.url))
    }
  }

  // 3. Protect Citizen routes
  if (pathname.startsWith('/citizen')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 4. Redirect already authenticated users from matching auth pages to their dashboards
  if (user) {
    if ((pathname === '/login' || pathname === '/signup') && role === 'citizen') {
      return NextResponse.redirect(new URL('/citizen/dashboard', request.url))
    }
    if (pathname === '/officer/login' && role === 'officer') {
      return NextResponse.redirect(new URL('/officer/dashboard', request.url))
    }
    if (pathname === '/admin/login' && (role === 'super_admin' || role === 'dept_admin')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
