import type { CalendarAccount } from "./types"

// URLs para refrescar tokens
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"

/**
 * Refresca un token de acceso de Google
 */
export async function refreshGoogleToken(account: CalendarAccount): Promise<CalendarAccount | null> {
  try {
    console.log(`Intentando refrescar token para cuenta de Google: ${account.email}`)

    // Si es una cuenta simulada, simplemente extender la expiración
    if (account.simulated) {
      console.log("Cuenta simulada, extendiendo expiración")
      const updatedAccount = {
        ...account,
        expiresAt: Date.now() + 3600 * 1000 * 24 * 7, // 7 días
        lastRefreshed: Date.now(),
      }

      return updatedAccount
    }

    // Verificar que tengamos un refresh token
    if (!account.refreshToken) {
      console.error("No hay refresh token disponible para esta cuenta")
      return null
    }

    // Obtener las credenciales de las variables de entorno
    const clientId = process.env.GOOGLE_CLIENT_ID || ""
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ""

    // Verificar que tengamos las credenciales necesarias
    if (!clientId || !clientSecret) {
      console.error("Faltan credenciales de Google (CLIENT_ID o CLIENT_SECRET)")
      return null
    }

    console.log(`Usando refresh token: ${account.refreshToken.substring(0, 10)}...`)
    console.log(`Client ID: ${clientId ? clientId.substring(0, 5) + "..." : "No configurado"}`)
    console.log(`Client Secret: ${clientSecret ? "Configurado" : "No configurado"}`)

    // Realizar la solicitud para refrescar el token
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      }),
    })

    console.log(`Respuesta de Google: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData = {}

      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        console.error("No se pudo parsear la respuesta de error:", errorText)
      }

      console.error("Error al refrescar token de Google:", errorData)

      // Si el error es que el refresh token es inválido, devolver null para forzar una reconexión
      if (
        response.status === 400 &&
        (errorData.error === "invalid_grant" ||
          errorData.error === "invalid_request" ||
          errorText.includes("invalid_grant") ||
          errorText.includes("invalid_request"))
      ) {
        console.error("Refresh token inválido o expirado, se requiere reconexión")
        return null
      }

      throw new Error(`Error al refrescar token: ${errorText}`)
    }

    const data = await response.json()
    console.log("Token refrescado exitosamente, expira en:", data.expires_in, "segundos")

    // Actualizar la cuenta con el nuevo token
    const updatedAccount: CalendarAccount = {
      ...account,
      accessToken: data.access_token,
      // Si Google devuelve un nuevo refresh token, actualizarlo
      refreshToken: data.refresh_token || account.refreshToken,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      lastRefreshed: Date.now(),
    }

    console.log(`Token refrescado exitosamente para ${account.email}`)
    return updatedAccount
  } catch (error) {
    console.error("Error al refrescar token de Google:", error)
    return null
  }
}

/**
 * Refresca un token de acceso de Microsoft
 */
export async function refreshMicrosoftToken(account: CalendarAccount): Promise<CalendarAccount | null> {
  try {
    console.log(`Intentando refrescar token para cuenta de Microsoft: ${account.email}`)

    // Si es una cuenta simulada, simplemente extender la expiración
    if (account.simulated) {
      console.log("Cuenta simulada, extendiendo expiración")
      const updatedAccount = {
        ...account,
        expiresAt: Date.now() + 3600 * 1000 * 24 * 7, // 7 días
        lastRefreshed: Date.now(),
      }

      return updatedAccount
    }

    // Verificar que tengamos un refresh token
    if (!account.refreshToken) {
      console.error("No hay refresh token disponible para esta cuenta")
      return null
    }

    // Obtener las credenciales de las variables de entorno
    const clientId = process.env.MICROSOFT_CLIENT_ID || ""
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || ""

    // Verificar que tengamos las credenciales necesarias
    if (!clientId || !clientSecret) {
      console.error("Faltan credenciales de Microsoft (CLIENT_ID o CLIENT_SECRET)")
      return null
    }

    console.log(`Usando refresh token: ${account.refreshToken.substring(0, 10)}...`)
    console.log(`Client ID: ${clientId ? "Configurado" : "No configurado"}`)
    console.log(`Client Secret: ${clientSecret ? "Configurado" : "No configurado"}`)

    // Realizar la solicitud para refrescar el token
    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/microsoft/callback`,
      }),
    })

    console.log(`Respuesta de Microsoft: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData = {}

      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        console.error("No se pudo parsear la respuesta de error:", errorText)
      }

      console.error("Error al refrescar token de Microsoft:", errorData)

      // Si el error es que el refresh token es inválido, devolver null para forzar una reconexión
      if (
        response.status === 400 &&
        (errorData.error === "invalid_grant" ||
          errorData.error === "invalid_request" ||
          errorText.includes("invalid_grant") ||
          errorText.includes("invalid_request"))
      ) {
        console.error("Refresh token inválido o expirado, se requiere reconexión")
        return null
      }

      throw new Error(`Error al refrescar token: ${errorText}`)
    }

    const data = await response.json()
    console.log("Token refrescado exitosamente, expira en:", data.expires_in, "segundos")

    // Actualizar la cuenta con el nuevo token
    const updatedAccount: CalendarAccount = {
      ...account,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || account.refreshToken, // Microsoft puede devolver un nuevo refresh token
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      lastRefreshed: Date.now(),
    }

    console.log(`Token refrescado exitosamente para ${account.email}`)
    return updatedAccount
  } catch (error) {
    console.error("Error al refrescar token de Microsoft:", error)
    return null
  }
}

/**
 * Verifica y refresca un token si es necesario
 */
export async function ensureValidToken(account: CalendarAccount): Promise<CalendarAccount | null> {
  try {
    // Si es una cuenta simulada, simplemente extender la expiración
    if (account.simulated) {
      console.log(`Cuenta simulada ${account.email}, extendiendo expiración`)
      const updatedAccount = {
        ...account,
        expiresAt: Date.now() + 3600 * 1000 * 24 * 7, // 7 días
        lastRefreshed: Date.now(),
      }
      return updatedAccount
    }

    // Si el token no ha expirado y no está próximo a expirar, devolver la cuenta sin cambios
    if (account.expiresAt && account.expiresAt > Date.now() + 5 * 60 * 1000) {
      // 5 minutos de margen
      return account
    }

    console.log(`Token expirado o próximo a expirar para ${account.email}, refrescando...`)

    // Verificar que tengamos un refresh token
    if (!account.refreshToken) {
      console.error(`No hay refresh token disponible para la cuenta ${account.email}`)
      return null
    }

    // Refrescar según el proveedor
    if (account.provider === "google") {
      return await refreshGoogleToken(account)
    } else if (account.provider === "microsoft") {
      return await refreshMicrosoftToken(account)
    }

    return null
  } catch (error) {
    console.error("Error al asegurar token válido:", error)
    return null
  }
}
