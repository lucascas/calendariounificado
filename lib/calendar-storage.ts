import type { CalendarAccount } from "./types"

// Clave para almacenar las cuentas en localStorage
const CALENDAR_ACCOUNTS_KEY = "calendar_accounts"

export const calendarStorage = {
  // Guardar todas las cuentas
  saveAccounts: (accounts: CalendarAccount[]) => {
    try {
      localStorage.setItem(CALENDAR_ACCOUNTS_KEY, JSON.stringify(accounts))
      return true
    } catch (error) {
      console.error("Error al guardar cuentas de calendario:", error)
      return false
    }
  },

  // Obtener todas las cuentas
  getAccounts: (): CalendarAccount[] => {
    try {
      const data = localStorage.getItem(CALENDAR_ACCOUNTS_KEY)
      if (!data) return []
      return JSON.parse(data)
    } catch (error) {
      console.error("Error al obtener cuentas de calendario:", error)
      return []
    }
  },

  // Añadir o actualizar una cuenta
  addOrUpdateAccount: (account: CalendarAccount) => {
    try {
      const accounts = calendarStorage.getAccounts()
      const existingIndex = accounts.findIndex(
        (a) => a.id === account.id || (a.provider === account.provider && a.email === account.email),
      )

      if (existingIndex >= 0) {
        accounts[existingIndex] = account
      } else {
        accounts.push(account)
      }

      return calendarStorage.saveAccounts(accounts)
    } catch (error) {
      console.error("Error al añadir/actualizar cuenta:", error)
      return false
    }
  },

  // Eliminar una cuenta
  removeAccount: (accountId: string) => {
    try {
      const accounts = calendarStorage.getAccounts()
      const filteredAccounts = accounts.filter((a) => a.id !== accountId)
      return calendarStorage.saveAccounts(filteredAccounts)
    } catch (error) {
      console.error("Error al eliminar cuenta:", error)
      return false
    }
  },

  // Obtener cuentas por proveedor
  getAccountsByProvider: (provider: "google" | "microsoft"): CalendarAccount[] => {
    try {
      const accounts = calendarStorage.getAccounts()
      return accounts.filter((a) => a.provider === provider)
    } catch (error) {
      console.error(`Error al obtener cuentas de ${provider}:`, error)
      return []
    }
  },
}
