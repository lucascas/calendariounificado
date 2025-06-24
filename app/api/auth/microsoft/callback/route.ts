import { type NextRequest, NextResponse } from "next/server"
import { authConfig } from "@/lib/auth-config"
import { UserService } from "@/lib/db/services/user-service"
import { sign } from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  console.log("Microsoft callback iniciado")

  // Obtener parámetros
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Verificar errores
  if (error) {
    console.error("Error de Microsoft:", error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/error?source=microsoft&message=auth_error&details=${encodeURIComponent(errorDescription || error)}`,
        baseUrl,
      ),
    )
  }

  // Verificar estado CSRF
  const savedState = request.cookies.get("microsoft_auth_state")?.value
  if (!state || state !== savedState) {
    console.error("Estado CSRF inválido")
    return NextResponse.redirect(new URL("/error?source=microsoft&message=invalid_state", baseUrl))
  }

  if (!code) {
    console.error("No se recibió código de autorización")
    return NextResponse.redirect(new URL("/error?source=microsoft&message=no_code", baseUrl))
  }

  try {
    // Intercambiar código por tokens
    const redirectUri = `${baseUrl}/api/auth/microsoft/callback`

    const tokenResponse = await fetch(authConfig.microsoft.endpoints.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: authConfig.microsoft.clientId,
        client_secret: authConfig.microsoft.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error("Error al intercambiar código por tokens:", errorData)
      throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`)
    }

    const tokenData = await tokenResponse.json()
    console.log("Tokens obtenidos exitosamente")

    // Obtener información del usuario
    const userResponse = await fetch(authConfig.microsoft.endpoints.userInfo, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error("Error al obtener información del usuario")
      throw new Error("Failed to fetch user info")
    }

    const userData = await userResponse.json()
    const userEmail = userData.mail || userData.userPrincipalName
    console.log("Información del usuario obtenida:", userEmail)

    // Buscar o crear usuario en la base de datos
    let user = await UserService.getUserByEmail(userEmail)

    if (!user) {
      // Crear nuevo usuario
      console.log("Creando nuevo usuario con Microsoft")
      user = await UserService.createUserWithOAuth({
        email: userEmail,
        name: userData.displayName,
        provider: "microsoft",
        providerId: userData.id,
      })
    } else {
      // Actualizar último login
      user.lastLogin = new Date()
      await user.save()
    }

    // Crear/actualizar cuenta de calendario
    const calendarAccount = {
      id: uuidv4(),
      provider: "microsoft" as const,
      email: userEmail,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      lastRefreshed: Date.now(),
    }

    await UserService.addOrUpdateCalendarAccount(user._id.toString(), calendarAccount)

    // Crear JWT
    const jwtToken = sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn },
    )

    // Crear respuesta de redirección
    const redirectUrl = new URL("/?auth_success=true", baseUrl)
    const response = NextResponse.redirect(redirectUrl)

    // Establecer cookie de autenticación
    response.cookies.set("auth_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: "lax",
      path: "/",
    })

    // Limpiar cookie de estado
    response.cookies.delete("microsoft_auth_state")

    console.log("Autenticación de Microsoft completada exitosamente")
    return response
  } catch (error) {
    console.error("Error durante callback de Microsoft:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.redirect(
      new URL(`/error?source=microsoft&message=auth_error&details=${encodeURIComponent(errorMessage)}`, baseUrl),
    )
  }
}
