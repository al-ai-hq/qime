import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Authenticated users hitting auth pages or landing page: smart redirect
  // (except /set-password which requires an active session)
  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)

    const url = request.nextUrl.clone()

    if (memberships && memberships.length > 0) {
      url.pathname = `/${memberships[0].organization_id}`
    } else {
      const adminEmail = process.env.ADMIN_EMAIL
      const isAdminUser = adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()
      url.pathname = isAdminUser ? '/setup' : '/no-access'
    }

    return NextResponse.redirect(url)
  }

  // /setup route: only accessible by admin when no org exists
  if (pathname.startsWith('/setup') && user) {
    const adminEmail = process.env.ADMIN_EMAIL
    const isAdminUser = adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()

    if (!isAdminUser) {
      const url = request.nextUrl.clone()
      url.pathname = '/no-access'
      return NextResponse.redirect(url)
    }
  }

  // Protected routes: redirect to /login if not authenticated
  const isProtectedRoute = pathname.startsWith('/orgs')
    || pathname.startsWith('/setup')
    || pathname.startsWith('/no-access')
    || pathname.startsWith('/set-password')
    || pathname.match(/^\/[a-zA-Z0-9-]+\/(prompts|competitors|settings)/)
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
