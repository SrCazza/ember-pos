import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirigir a login si no hay sesión
  if (!user && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single()

    // Usuario inactivo → forzar logout
    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const role = profile?.role

    // Redirigir desde /login según rol
    if (pathname.startsWith("/login") && role) {
      const redirectMap: Record<string, string> = {
        waiter: "/tables",
        kitchen: "/display",
        admin: "/dashboard",
      }
      return NextResponse.redirect(new URL(redirectMap[role] ?? "/login", request.url))
    }

    // Proteger rutas por rol
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/menu") ||
        pathname.startsWith("/reports") || pathname.startsWith("/users")) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }

    if (pathname.startsWith("/display")) {
      if (role !== "kitchen" && role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }

    if (pathname.startsWith("/tables") || pathname.startsWith("/order") || pathname.startsWith("/active")) {
      if (role !== "waiter" && role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
