"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function DbTokenManager() {
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Función para verificar tokens que están por expirar
  const checkExpiringTokens = async () => {
    try {
      if (isChecking) return
      setIsChecking(true)

      // Verificar primero si el usuario está autenticado
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
      if (!isAuthenticated) {
        console.log("Usuario no autenticado, omitiendo verificación de tokens")
        return
      }

      // Llamar al endpoint para verificar tokens
      const response = await fetch("/api/tokens/check")

      // Si no está autorizado, posiblemente la sesión expiró
      if (response.status === 401) {
        console.log("Sesión expirada o inválida")
        return
      }

      if (!response.ok) {
        throw new Error("Error al verificar tokens")
      }

      const data = await response.json()

      // Si hay tokens por expirar, intentar refrescarlos
      if (data.expiringAccounts && data.expiringAccounts.length > 0) {
        console.log(`Se encontraron ${data.expiringAccounts.length} tokens por expirar`)

        let refreshedCount = 0
        let failedCount = 0

        // Intentar refrescar cada token
        for (const account of data.expiringAccounts) {
          try {
            const refreshResponse = await fetch("/api/tokens/refresh", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ accountId: account.id }),
            })

            if (refreshResponse.ok) {
              refreshedCount++
            } else {
              const errorData = await refreshResponse.json()

              // Si necesita reconexión, mostrar notificación
              if (errorData.needsReconnect) {
                toast({
                  title: `Reconexión necesaria`,
                  description: `La cuenta ${account.email} necesita ser reconectada.`,
                  variant: "destructive",
                })
              }

              failedCount++
            }
          } catch (error) {
            console.error(`Error al refrescar token para ${account.email}:`, error)
            failedCount++
          }
        }

        // Mostrar notificaciones según los resultados
        if (refreshedCount > 0) {
          toast({
            title: "Tokens actualizados",
            description: `Se actualizaron automáticamente ${refreshedCount} tokens de acceso.`,
            variant: "default",
          })
        }

        if (failedCount > 0) {
          toast({
            title: "Atención",
            description: `No se pudieron actualizar ${failedCount} tokens. Puede ser necesario reconectar algunas cuentas.`,
            variant: "warning",
          })
        }
      }
    } catch (error) {
      console.error("Error al verificar tokens:", error)
    } finally {
      setIsChecking(false)
    }
  }

  // Verificar tokens al montar el componente y cada 15 minutos
  useEffect(() => {
    // Verificar después de 5 segundos para dar tiempo a que la aplicación se cargue
    const initialTimeout = setTimeout(() => {
      checkExpiringTokens()
    }, 5000)

    // Configurar un intervalo para verificar periódicamente
    const interval = setInterval(checkExpiringTokens, 15 * 60 * 1000) // Verificar cada 15 minutos

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  // Este componente no renderiza nada visible
  return null
}
