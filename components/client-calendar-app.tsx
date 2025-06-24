"use client"

import { useState, useEffect } from "react"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarView } from "@/components/calendar-view"
import { AccountSetup } from "@/components/account-setup"
import { LoginForm } from "@/components/login-form"
import { useToast } from "@/hooks/use-toast"
import type { CalendarAccount } from "@/lib/types"

export function ClientCalendarApp() {
  const [calendarAccounts, setCalendarAccounts] = useState<CalendarAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [needsCalendarSetup, setNeedsCalendarSetup] = useState(false)
  const { toast } = useToast()

  // Verificar autenticación y cargar datos
  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      setIsLoading(true)
      console.log("Verificando autenticación...")

      // Verificar autenticación con la API
      const authResponse = await fetch("/api/auth/me")
      const authData = await authResponse.json()

      if (authData.authenticated && authData.user) {
        console.log("Usuario autenticado:", authData.user.email)
        setIsAuthenticated(true)

        // Cargar cuentas de calendario desde la API
        await loadCalendarAccounts()
      } else {
        console.log("Usuario no autenticado")
        setIsAuthenticated(false)
        setNeedsCalendarSetup(false)
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      setIsAuthenticated(false)
      setNeedsCalendarSetup(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCalendarAccounts = async () => {
    try {
      console.log("Cargando cuentas de calendario desde la API...")

      const response = await fetch("/api/calendar-accounts")

      if (response.ok) {
        const data = await response.json()
        const accounts = data.accounts || []

        console.log("Cuentas cargadas desde la API:", accounts.length)
        setCalendarAccounts(accounts)
        setNeedsCalendarSetup(accounts.length === 0)

        if (accounts.length > 0) {
          toast({
            title: "Calendarios cargados",
            description: `Se cargaron ${accounts.length} cuenta(s) de calendario.`,
            variant: "default",
          })
        }
      } else if (response.status === 401) {
        // No autorizado, cerrar sesión
        console.log("Token expirado, cerrando sesión")
        setIsAuthenticated(false)
        setCalendarAccounts([])
        setNeedsCalendarSetup(false)
      } else {
        throw new Error("Error al cargar cuentas de calendario")
      }
    } catch (error) {
      console.error("Error al cargar cuentas de calendario:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas de calendario.",
        variant: "destructive",
      })
      setNeedsCalendarSetup(true)
    }
  }

  // Manejar inicio de sesión exitoso
  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    checkAuthAndLoadData()
  }

  // Manejar configuración de calendario exitosa
  const handleCalendarSetup = () => {
    loadCalendarAccounts()
  }

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg">Cargando aplicación...</p>
        </div>
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
