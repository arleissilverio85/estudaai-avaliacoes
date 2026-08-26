import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database, Profile } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  ) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isTeacherRoute = pathname.startsWith('/teacher')
  const isStudentRoute = pathname.startsWith('/student')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!user && (isTeacherRoute || isStudentRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    const profile = data as Profile | null
    const role = profile?.role || (user.user_metadata?.role as 'teacher' | 'student') || 'student'

    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      return NextResponse.redirect(url)
    }

    if (isTeacherRoute && role !== 'teacher') {
      const url = request.nextUrl.clone()
      url.pathname = '/student/dashboard'
      return NextResponse.redirect(url)
    }

    if (isStudentRoute && role !== 'student') {
      const url = request.nextUrl.clone()
      url.pathname = '/teacher/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
