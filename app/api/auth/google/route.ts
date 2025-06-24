import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth-config"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    console.log("Iniciando autenticación de Google desde:", baseUrl)

    if (!authConfig.google.clientId || !authConfig.google.clientSecret) {
      console.error("Faltan credenciales de Google")
      return NextResponse.redirect(
        new URL("/error?source=google&message=config_error&details=Missing+Google+credentials", baseUrl),
      )
    }

    // Crear URL de autorización usando el endpoint v2 actualizado
    const authUrl = new URL(authConfig.google.endpoints.auth)
    const redirectUri = `${baseUrl}/api/auth/google/callback`

    // Generar estado para seguridad CSRF
    const state = crypto.randomUUID()

    // Configurar parámetros
    authUrl.searchParams.set("client_id", authConfig.google.clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", authConfig.google.scopes.join(" "))
    authUrl.searchParams.set("access_type", "offline")
    authUrl.searchParams.set("prompt", "consent")
    authUrl.searchParams.set("state", state)

    console.log("Redirigiendo a:", authUrl.toString())

    // Crear respuesta con cookie de estado
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set("google_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 minutos
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Error en autenticación de Google:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.redirect(
      new URL(`/error?source=google&message=auth_error&details=${encodeURIComponent(errorMessage)}`, request.url),
    )
  }
}
