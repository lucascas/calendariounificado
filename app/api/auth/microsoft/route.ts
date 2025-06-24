import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth-config"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    console.log("Iniciando autenticación de Microsoft desde:", baseUrl)

    if (!authConfig.microsoft.clientId || !authConfig.microsoft.clientSecret) {
      console.error("Faltan credenciales de Microsoft")
      return NextResponse.redirect(
        new URL("/error?source=microsoft&message=config_error&details=Missing+Microsoft+credentials", baseUrl),
      )
    }

    // Crear URL de autorización
    const authUrl = new URL(authConfig.microsoft.endpoints.auth)
    const redirectUri = `${baseUrl}/api/auth/microsoft/callback`

    // Agregar más logging para diagnosticar problemas de configuración
    console.log("Configuración de Microsoft:")
    console.log("- Client ID configurado:", !!authConfig.microsoft.clientId)
    console.log("- Client Secret configurado:", !!authConfig.microsoft.clientSecret)
    console.log("- Redirect URI:", redirectUri)
    console.log("- Scopes solicitados:", authConfig.microsoft.scopes.join(" "))

    // Generar estado para seguridad CSRF
    const state = crypto.randomUUID()

    // Configurar parámetros
    authUrl.searchParams.set("client_id", authConfig.microsoft.clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", authConfig.microsoft.scopes.join(" "))
    authUrl.searchParams.set("response_mode", "query")
    authUrl.searchParams.set("prompt", "consent")
    authUrl.searchParams.set("state", state)

    console.log("Redirigiendo a:", authUrl.toString())

    // Crear respuesta con cookie de estado
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set("microsoft_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 minutos
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Error en autenticación de Microsoft:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.redirect(
      new URL(`/error?source=microsoft&message=auth_error&details=${encodeURIComponent(errorMessage)}`, request.url),
    )
  }
}
