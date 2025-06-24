import type { CalendarAccount } from "./types"
import { calendarStorage } from "./calendar-storage"

// URLs para refrescar tokens
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"

// Tiempo antes de la expiración para renovar el token (30 minutos)
const REFRESH_THRESHOLD_MS = 30 * 60 * 1000

/**
 * Servicio centralizado para gestionar tokens
 */
export const TokenService = {
  /**
   * Verifica todos los tokens y renueva los que están próximos a expirar
   */
  async checkAndRefreshAllTokens(): Promise<{
    refreshed: CalendarAccount[]
    failed: CalendarAccount[]
  }> {
    const accounts = calendarStorage.getAccounts()
    const now = Date.now()

    const refreshed: CalendarAccount[] = []
    const failed: CalendarAccount[] = []

    for (const account of accounts) {
      // Ignorar cuentas simuladas
      if (account.simulated) continue

      // Verificar si el token está próximo a expirar
      if (account.expiresAt && account.expiresAt - now < REFRESH_THRESHOLD_MS) {
        try {
          const refreshedAccount = await this.refreshToken(account)
          if (refreshedAccount) {
            refreshed.push(refreshedAccount)
            // Actualizar en el almacenamiento
            calendarStorage.addOrUpdateAccount(refreshedAccount)
          } else {
            failed.push(account)
          }
        } catch (error) {
          console.error(`Error al refrescar token para ${account.email}:`, error)
          failed.push(account)
        }
      }
    }

    return { refreshed, failed }
  },

  /**
   * Refresca un token específico
   */
  async refreshToken(account: CalendarAccount): Promise<CalendarAccount | null> {
    if (account.simulated) {
      // Para cuentas simuladas, simplemente extender la expiración
      return {
        ...account,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
      }
    }

    if (!account.refreshToken) {
      console.error(`No hay refresh token para la cuenta ${account.email}`)
      return null
    }

    try {
      if (account.provider === "google") {
        return await this.refreshGoogleToken(account)
      } else if (account.provider === "microsoft") {
        return await this.refreshMicrosoftToken(account)
      }

      return null
    } catch (error) {
      console.error(`Error al refrescar token para ${account.email}:`, error)
      return null
    }
  },

  /**
   * Refresca un token de Google
   */
  async refreshGoogleToken(account: CalendarAccount): Promise<CalendarAccount | null> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("Faltan credenciales de Google")
      return null
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.refreshToken!,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error al refrescar token de Google: ${errorText}`)
      return null
    }

    const data = await response.json()

    return {
      ...account,
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      lastRefreshed: Date.now(),
    }
  },

  /**
   * Refresca un token de Microsoft
   */
  async refreshMicrosoftToken(account: CalendarAccount): Promise<CalendarAccount | null> {
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("Faltan credenciales de Microsoft")
      return null
    }

    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.refreshToken!,
        grant_type: "refresh_token",
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/microsoft/callback`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error al refrescar token de Microsoft: ${errorText}`)
      return null
    }

    const data = await response.json()

    return {
      ...account,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || account.refreshToken, // Microsoft puede devolver un nuevo refresh token
      expiresAt: Date.now() + data.expires_in * 1000,
      lastRefreshed: Date.now(),
    }
  },

  /**
   * Verifica si un token es válido
   */
  isTokenValid(account: CalendarAccount): boolean {
    if (account.simulated) return true

    const now = Date.now()
    return !!account.expiresAt && account.expiresAt > now
  },

  /**
   * Verifica si un token está próximo a expirar
   */
  isTokenExpiringSoon(account: CalendarAccount): boolean {
    if (account.simulated) return false

    const now = Date.now()
    return !!account.expiresAt && account.expiresAt - now < REFRESH_THRESHOLD_MS
  },
}
