import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const type = requestUrl.searchParams.get('type')

  let targetRedirect = '/citizen/dashboard'
  if (next) {
    targetRedirect = next
  } else if (type === 'recovery') {
    targetRedirect = '/reset-password'
  } else if (type === 'signup' || type === 'email' || type === 'email_change') {
    targetRedirect = '/verification-success'
  }

  if (code) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://udixuacseoloktbzuyrs.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

    let supabaseResponse = NextResponse.redirect(new URL(targetRedirect, request.url))

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.redirect(new URL(targetRedirect, request.url))
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return supabaseResponse
    }
  }

  if (targetRedirect === '/reset-password' || next === '/reset-password') {
    return NextResponse.redirect(new URL('/reset-password?error=invalid_link', request.url))
  }

  return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
}
