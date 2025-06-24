// Tipos para las preferencias del usuario
export interface UserPreferences {
  startHour: string // Formato "HH:MM"
  endHour: string // Formato "HH:MM"
  showWeekends: boolean
  enableNotifications: boolean
}

// Valores por defecto
export const DEFAULT_PREFERENCES: UserPreferences = {
  startHour: "09:00",
  endHour: "18:00",
  showWeekends: true,
  enableNotifications: true,
}

// Funciones para manejar la persistencia de preferencias
export const preferencesStorage = {
  // Guardar todas las preferencias
  savePreferences: (preferences: UserPreferences) => {
    try {
      localStorage.setItem("user_preferences", JSON.stringify(preferences))
      return true
    } catch (error) {
      console.error("Error al guardar preferencias:", error)
      return false
    }
  },

  // Obtener todas las preferencias
  getPreferences: (): UserPreferences => {
    try {
      const data = localStorage.getItem("user_preferences")
      if (!data) return DEFAULT_PREFERENCES
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) }
    } catch (error) {
      console.error("Error al obtener preferencias:", error)
      return DEFAULT_PREFERENCES
    }
  },

  // Actualizar una preferencia específica
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    try {
      const preferences = preferencesStorage.getPreferences()
      preferences[key] = value
      return preferencesStorage.savePreferences(preferences)
    } catch (error) {
      console.error(`Error al actualizar preferencia ${key}:`, error)
      return false
    }
  },
}
