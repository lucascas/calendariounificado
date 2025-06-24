import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que requieren autenticación
const protectedRoutes = ["/settings"]

export function middleware(request: NextRequest) {
  // Solo verificar autenticación para rutas protegidas específicas
  const isProtectedRoute = protectedRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Verificar si hay un token en las cookies
  const authToken = request.cookies.get("auth_token")?.value

  // Si no hay token, redirigir a login
  if (!authToken) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: ["/settings", "/settings/:path*"],
}
