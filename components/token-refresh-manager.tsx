"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { TokenService } from "@/lib/token-service"
import { calendarStorage } from "@/lib/calendar-storage"

// Intervalo de verificación de tokens (5 minutos)
const CHECK_INTERVAL_MS = 5 * 60 * 1000

// Intervalo de verificación inicial (10 segundos después de cargar)
const INITIAL_CHECK_DELAY_MS = 10 * 1000

export function TokenRefreshManager() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const { toast } = useToast()

  // Función para verificar y refrescar tokens
  const checkAndRefreshTokens = async () => {
    if (isRefreshing) return

    // Verificar si el usuario está autenticado
    const isAuth = localStorage.getItem("isAuthenticated") === "true"
    if (!isAuth) {
      console.log("Usuario no autenticado, omitiendo verificación de tokens")
      return
    }

    try {
      setIsRefreshing(true)

      // Obtener todas las cuentas
      const accounts = calendarStorage.getAccounts()

      // Filtrar cuentas no simuladas
      const realAccounts = accounts.filter((account) => !account.simulated)

      if (realAccounts.length === 0) {
        return
      }

      // Verificar tokens expirados o próximos a expirar
      const expiredOrExpiring = realAccounts.filter(
        (account) => !TokenService.isTokenValid(account) || TokenService.isTokenExpiringSoon(account),
      )

      if (expiredOrExpiring.length === 0) {
        console.log("No hay tokens que necesiten renovación")
        return
      }

      console.log(`Renovando ${expiredOrExpiring.length} tokens...`)

      // Refrescar tokens
      const { refreshed, failed } = await TokenService.checkAndRefreshAllTokens()

      // Actualizar timestamp de última renovación
      setLastRefresh(new Date())

      // Mostrar notificación si se renovaron tokens
      if (refreshed.length > 0) {
        console.log(`Se renovaron ${refreshed.length} tokens exitosamente`)

        // Solo mostrar toast si hay tokens renovados exitosamente
        toast({
          title: "Tokens renovados automáticamente",
          description: `Se renovaron ${refreshed.length} tokens de acceso.`,
          variant: "default",
        })
      }

      // Mostrar notificación si fallaron tokens
      if (failed.length > 0) {
        console.error(`Fallaron ${failed.length} renovaciones de tokens`)

        // Mostrar toast con error y opción para reconectar
        toast({
          title: "Algunos tokens no pudieron renovarse",
          description: "Es posible que necesites reconectar algunas cuentas.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al verificar y refrescar tokens:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Verificar tokens al montar el componente y periódicamente
  useEffect(() => {
    // Verificar después de un breve retraso inicial
    const initialCheck = setTimeout(() => {
      checkAndRefreshTokens()
    }, INITIAL_CHECK_DELAY_MS)

    // Configurar verificación periódica
    const interval = setInterval(() => {
      checkAndRefreshTokens()
    }, CHECK_INTERVAL_MS)

    // Limpiar temporizadores al desmontar
    return () => {
      clearTimeout(initialCheck)
      clearInterval(interval)
    }
  }, [])

  // Este componente no renderiza nada visible
  return null
}
