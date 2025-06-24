"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { calendarStorage } from "@/lib/calendar-storage"
import { ensureValidToken } from "@/lib/token-refresh"

export function AutoReconnect() {
  const [isReconnecting, setIsReconnecting] = useState(false)
  const { toast } = useToast()

  // Función para verificar y reconectar cuentas automáticamente
  const checkAndReconnect = async () => {
    try {
      if (isReconnecting) return
      setIsReconnecting(true)

      // Obtener todas las cuentas
      const accounts = calendarStorage.getAccounts()
      const now = Date.now()

      // Verificar cada cuenta y actualizar tokens si es posible
      let refreshedCount = 0
      let failedCount = 0

      for (const account of accounts) {
        // Saltar cuentas simuladas
        if (account.simulated) continue

        // Si el token está por expirar o ha expirado
        if (!account.expiresAt || account.expiresAt < now + 10 * 60 * 1000) {
          // 10 minutos de margen
          console.log(`Token para ${account.email} está por expirar o ha expirado, intentando refrescar...`)

          // Intentar refrescar el token
          const updatedAccount = await ensureValidToken(account)

          if (updatedAccount) {
            console.log(`Token para ${account.email} refrescado exitosamente`)
            refreshedCount++
          } else {
            console.warn(`No se pudo refrescar el token para ${account.email}`)
            failedCount++
          }
        }
      }

      // Mostrar notificación si se refrescaron tokens
      if (refreshedCount > 0) {
        toast({
          title: "Tokens actualizados",
          description: `Se actualizaron automáticamente ${refreshedCount} tokens de acceso.`,
          variant: "default",
        })
      }

      // Mostrar notificación si fallaron tokens
      if (failedCount > 0) {
        toast({
          title: "Atención",
          description: `No se pudieron actualizar ${failedCount} tokens. Puede ser necesario reconectar algunas cuentas.`,
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Error al reconectar cuentas:", error)
    } finally {
      setIsReconnecting(false)
    }
  }

  // Verificar tokens al montar el componente y cada 30 minutos
  useEffect(() => {
    // Verificar después de 5 segundos para dar tiempo a que la aplicación se cargue
    const initialTimeout = setTimeout(() => {
      checkAndReconnect()
    }, 5000)

    // Configurar un intervalo para verificar periódicamente
    const interval = setInterval(checkAndReconnect, 30 * 60 * 1000) // Verificar cada 30 minutos

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  // Este componente no renderiza nada visible
  return null
}
