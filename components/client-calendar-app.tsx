"use client"

import { useState, useEffect } from "react"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarView } from "@/components/calendar-view"
import { AccountSetup } from "@/components/account-setup"
import { LoginForm } from "@/components/login-form"
import { useToast } from "@/hooks/use-toast"
import { calendarStorage } from "@/lib/calendar-storage"
import type { CalendarAccount } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

export function ClientCalendarApp() {
  const [calendarAccounts, setCalendarAccounts] = useState<CalendarAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [needsCalendarSetup, setNeedsCalendarSetup] = useState(false)
  const { toast } = useToast()

  // Función para parsear cookies
  const parseCookies = () => {
    const cookieObj: Record<string, string> = {}
    const cookies = document.cookie.split("; ")

    cookies.forEach((cookie) => {
      if (cookie) {
        const parts = cookie.split("=")
        if (parts.length >= 2) {
          const [name, ...valueParts] = parts
          cookieObj[name] = valueParts.join("=")
        }
      }
    })

    return cookieObj
  }

  // Verificar autenticación y cargar datos
  useEffect(() => {
    const checkAuth = async () => {
      // Verificar autenticación en localStorage (método simple)
      const isAuth = localStorage.getItem("isAuthenticated") === "true"
      setIsAuthenticated(isAuth)

      if (isAuth) {
        await loadCalendarData()
      } else {
        // Si no está autenticado, no intentar cargar datos ni hacer llamadas a la API
        setIsLoading(false)
        setNeedsCalendarSetup(false) // Asegurarse de que muestre el formulario de login
      }
    }

    checkAuth()
  }, [])

  // Función para cargar datos de calendario
  const loadCalendarData = async () => {
    try {
      setIsLoading(true)
      console.log("Cargando datos de calendario...")

      // Verificar si hay cookies de autenticación de calendario
      const cookies = parseCookies()
      let hasProcessedNewAccount = false

      // Procesar cuenta de Google si existe en cookies
      if (cookies["google-auth"]) {
        console.log("Cookie de Google encontrada")
        hasProcessedNewAccount = true

        try {
          // Intentar decodificar y parsear la cookie
          let authData
          try {
            authData = JSON.parse(decodeURIComponent(cookies["google-auth"]))
          } catch (e) {
            // Si falla, intentar parsear directamente
            authData = JSON.parse(cookies["google-auth"])
          }

          console.log("Datos de autenticación de Google parseados correctamente")

          // Crear o actualizar la cuenta
          const googleAccount: CalendarAccount = {
            id: authData.user?.id || uuidv4(),
            provider: "google",
            email: authData.user?.email || "usuario@gmail.com",
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at,
          }

          // Guardar la cuenta en localStorage
          calendarStorage.addOrUpdateAccount(googleAccount)

          toast({
            title: "Calendario conectado",
            description: "Se ha conectado Google Calendar correctamente.",
            variant: "default",
          })
        } catch (e) {
          console.error("Error al parsear la cookie de Google:", e)
        }

        // Limpiar la cookie después de procesarla
        document.cookie = "google-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      }

      // Procesar cuenta de Microsoft si existe en cookies
      if (cookies["microsoft-auth"]) {
        console.log("Cookie de Microsoft encontrada")
        hasProcessedNewAccount = true

        try {
          // Intentar decodificar y parsear la cookie
          let authData
          try {
            authData = JSON.parse(decodeURIComponent(cookies["microsoft-auth"]))
          } catch (e) {
            // Si falla, intentar parsear directamente
            authData = JSON.parse(cookies["microsoft-auth"])
          }

          console.log("Datos de autenticación de Microsoft parseados correctamente")

          // Crear o actualizar la cuenta
          const microsoftAccount: CalendarAccount = {
            id: authData.user?.id || uuidv4(),
            provider: "microsoft",
            email: authData.user?.email || "usuario@outlook.com",
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at,
          }

          // Guardar la cuenta en localStorage
          calendarStorage.addOrUpdateAccount(microsoftAccount)

          toast({
            title: "Calendario conectado",
            description: "Se ha conectado Microsoft Calendar correctamente.",
            variant: "default",
          })
        } catch (e) {
          console.error("Error al parsear la cookie de Microsoft:", e)
        }

        // Limpiar la cookie después de procesarla
        document.cookie = "microsoft-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      }

      // Cargar cuentas desde localStorage
      const localAccounts = calendarStorage.getAccounts()
      setCalendarAccounts(localAccounts)
      setNeedsCalendarSetup(localAccounts.length === 0)
      console.log("Cuentas cargadas desde localStorage:", localAccounts.length)
    } catch (error) {
      console.error("Error al cargar datos de calendario:", error)
      // No establecer needsCalendarSetup a true si hay un error
      // para evitar mostrar la pantalla de configuración cuando debería mostrar login
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del calendario. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      })
      // Si hay un error grave, cerrar sesión
      localStorage.removeItem("isAuthenticated")
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar inicio de sesión exitoso
  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    loadCalendarData()
  }

  // Manejar configuración de calendario exitosa
  const handleCalendarSetup = () => {
    loadCalendarData()
  }

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-lg">Cargando aplicación...</p>
      </div>
    )
  }

  // Si no está autenticado, mostrar formulario de login
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  // Si no hay cuentas configuradas, mostrar configuración
  if (needsCalendarSetup) {
    return <AccountSetup onSetupComplete={handleCalendarSetup} />
  }

  // Mostrar el calendario
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <CalendarHeader calendarAccounts={calendarAccounts} />
      <CalendarView calendarAccounts={calendarAccounts} />
    </main>
  )
}
