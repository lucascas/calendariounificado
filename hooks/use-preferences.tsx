"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { preferencesStorage, type UserPreferences, DEFAULT_PREFERENCES } from "@/lib/preferences-storage"

// Tipo para el contexto
interface PreferencesContextType {
  preferences: UserPreferences
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  resetPreferences: () => void
}

// Crear el contexto
const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error("usePreferences debe ser usado dentro de un PreferencesProvider")
  }
  return context
}

// Proveedor de preferencias
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)

  // Cargar preferencias al montar el componente
  useEffect(() => {
    const savedPreferences = preferencesStorage.getPreferences()
    setPreferences(savedPreferences)
  }, [])

  // Función para actualizar una preferencia específica
  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => {
      const newPreferences = { ...prev, [key]: value }
      preferencesStorage.savePreferences(newPreferences)
      return newPreferences
    })
  }

  // Función para restablecer las preferencias a los valores por defecto
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
    preferencesStorage.savePreferences(DEFAULT_PREFERENCES)
  }

  // Valor del contexto
  const value = {
    preferences,
    updatePreference,
    resetPreferences,
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
