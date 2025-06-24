import { connectToDatabase } from "../mongodb"
import { User } from "../models/user"
import type { CalendarAccount } from "../models/calendar-account"
import { verify } from "jsonwebtoken"

// Clave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || "calendario_unificado_secret_key"

// Obtener el ID de usuario del token
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string }
    return decoded.id
  } catch (error) {
    console.error("Error al verificar token:", error)
    return null
  }
}

export const TokenService = {
  // Obtener todas las cuentas de calendario de un usuario
  async getCalendarAccounts(authToken: string): Promise<CalendarAccount[]> {
    try {
      await connectToDatabase()

      // Obtener el ID de usuario del token
      const userId = await getUserIdFromToken(authToken)
      if (!userId) {
        console.error("Token inválido o expirado")
        return []
      }

      // Buscar el usuario
      const user = await User.findById(userId)
      if (!user) {
        console.error("Usuario no encontrado")
        return []
      }

      return user.calendarAccounts || []
    } catch (error) {
      console.error("Error al obtener cuentas de calendario:", error)
      return []
    }
  },

  // Actualizar el token de acceso de una cuenta
  async updateAccessToken(
    authToken: string,
    accountId: string,
    accessToken: string,
    expiresAt: number,
  ): Promise<boolean> {
    try {
      await connectToDatabase()

      // Obtener el ID de usuario del token
      const userId = await getUserIdFromToken(authToken)
      if (!userId) {
        console.error("Token inválido o expirado")
        return false
      }

      // Buscar el usuario
      const user = await User.findById(userId)
      if (!user) {
        console.error("Usuario no encontrado")
        return false
      }

      // Buscar la cuenta de calendario
      const accountIndex = user.calendarAccounts.findIndex((account: any) => account.id === accountId)

      if (accountIndex === -1) {
        console.error("Cuenta de calendario no encontrada")
        return false
      }

      // Actualizar el token de acceso y la fecha de expiración
      user.calendarAccounts[accountIndex].accessToken = accessToken
      user.calendarAccounts[accountIndex].expiresAt = expiresAt
      user.calendarAccounts[accountIndex].lastRefreshed = Date.now()

      // Guardar los cambios
      await user.save()
      return true
    } catch (error) {
      console.error("Error al actualizar token de acceso:", error)
      return false
    }
  },

  // Actualizar una cuenta de calendario completa
  async updateCalendarAccount(authToken: string, account: CalendarAccount): Promise<boolean> {
    try {
      await connectToDatabase()

      // Obtener el ID de usuario del token
      const userId = await getUserIdFromToken(authToken)
      if (!userId) {
        console.error("Token inválido o expirado")
        return false
      }

      // Buscar el usuario
      const user = await User.findById(userId)
      if (!user) {
        console.error("Usuario no encontrado")
        return false
      }

      // Buscar la cuenta de calendario
      const accountIndex = user.calendarAccounts.findIndex((acc: any) => acc.id === account.id)

      if (accountIndex === -1) {
        // Si la cuenta no existe, añadirla
        user.calendarAccounts.push(account)
      } else {
        // Si la cuenta existe, actualizarla
        user.calendarAccounts[accountIndex] = account
      }

      // Guardar los cambios
      await user.save()
      return true
    } catch (error) {
      console.error("Error al actualizar cuenta de calendario:", error)
      return false
    }
  },

  // Verificar si un token está por expirar
  async checkExpiringTokens(authToken: string): Promise<CalendarAccount[]> {
    try {
      await connectToDatabase()

      // Obtener el ID de usuario del token
      const userId = await getUserIdFromToken(authToken)
      if (!userId) {
        console.error("Token inválido o expirado")
        return []
      }

      // Buscar el usuario
      const user = await User.findById(userId)
      if (!user) {
        console.error("Usuario no encontrado")
        return []
      }

      // Obtener la hora actual
      const now = Date.now()

      // Filtrar las cuentas con tokens que expiran en menos de 10 minutos
      const expiringAccounts = user.calendarAccounts.filter((account: any) => {
        return !account.simulated && account.expiresAt && account.expiresAt < now + 10 * 60 * 1000 // 10 minutos
      })

      return expiringAccounts
    } catch (error) {
      console.error("Error al verificar tokens por expirar:", error)
      return []
    }
  },
}
