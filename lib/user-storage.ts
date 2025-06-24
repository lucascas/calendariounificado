// Tipos para la información del usuario
export interface UserCalendars {
  googleConnected: boolean
  microsoftConnected: boolean
}

// Funciones para manejar la persistencia del usuario
export const userStorage = {
  // Guardar información de calendarios
  saveCalendars: (calendars: UserCalendars) => {
    try {
      localStorage.setItem("user_calendars", JSON.stringify(calendars))
      return true
    } catch (error) {
      console.error("Error al guardar información de calendarios:", error)
      return false
    }
  },

  // Obtener información de calendarios
  getCalendars: (): UserCalendars | null => {
    try {
      const data = localStorage.getItem("user_calendars")
      if (!data) return null
      return JSON.parse(data)
    } catch (error) {
      console.error("Error al obtener información de calendarios:", error)
      return null
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    return localStorage.getItem("isAuthenticated") === "true"
  },

  // Establecer estado de autenticación
  setAuthenticated: (value: boolean) => {
    localStorage.setItem("isAuthenticated", value ? "true" : "false")
  },

  // Cerrar sesión (solo elimina la autenticación, no los datos de calendarios)
  logout: () => {
    localStorage.removeItem("isAuthenticated")
  },
}
