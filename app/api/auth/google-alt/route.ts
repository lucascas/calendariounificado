import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Obtener la URL base de la solicitud actual
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    console.log("Iniciando autenticación alternativa de Google desde:", baseUrl)

    // Verificar que tenemos las credenciales necesarias
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID. Verifica las variables de entorno.")
      return NextResponse.redirect(
        new URL("/error?source=google&message=config_error&details=Missing+Google+Client+ID", baseUrl),
      )
    }

    // Crear la URL de autorización de Google
    const authUrl = new URL("https://accounts.google.com/o/oauth2/auth") // Usar la versión v1 del endpoint

    // Construir la URI de redirección basada en la URL actual
    const redirectUri = `${baseUrl}/api/auth/google/callback`

    // Añadir parámetros necesarios
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append(
      "scope",
      "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    )
    authUrl.searchParams.append("access_type", "offline")
    authUrl.searchParams.append("prompt", "consent")

    // Generar un estado aleatorio para seguridad
    const state = Math.random().toString(36).substring(2)
    authUrl.searchParams.append("state", state)

    // Guardar el estado en una cookie
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set("google_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutos
    })

    console.log("Redirigiendo a la URL alternativa de autenticación de Google:", authUrl.toString())
    return response
  } catch (error) {
    console.error("Error en la ruta alternativa de autenticación de Google:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.redirect(
      new URL(`/error?source=google&message=config_error&details=${encodeURIComponent(errorMessage)}`, request.url),
    )
  }
}
