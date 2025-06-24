"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { calendarStorage } from "@/lib/calendar-storage"
import { TokenService } from "@/lib/token-service"
import { useToast } from "@/hooks/use-toast"
import type { CalendarAccount } from "@/lib/types"

export function TokenExpiredAlert() {
  const [expiredAccounts, setExpiredAccounts] = useState<CalendarAccount[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Función para verificar tokens expirados
  const checkExpiredTokens = () => {
    const accounts = calendarStorage.getAccounts()
    const expired = accounts.filter((account) => !account.simulated && !TokenService.isTokenValid(account))
    setExpiredAccounts(expired)
  }

  // Verificar tokens al montar el componente y cada 60 segundos
  useEffect(() => {
    // Verificar inmediatamente
    checkExpiredTokens()

    // Configurar verificación periódica
    const interval = setInterval(checkExpiredTokens, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Función para intentar renovar tokens
  const handleRefreshTokens = async () => {
    setIsRefreshing(true)

    try {
      const { refreshed, failed } = await TokenService.checkAndRefreshAllTokens()

      if (refreshed.length > 0) {
        toast({
          title: "Tokens renovados",
          description: `Se renovaron ${refreshed.length} tokens exitosamente.`,
          variant: "default",
        })
      }

      // Verificar nuevamente los tokens expirados
      checkExpiredTokens()
    } catch (error) {
      console.error("Error al renovar tokens:", error)
      toast({
        title: "Error",
        description: "No se pudieron renovar algunos tokens.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Función para reconectar una cuenta específica
  const handleReconnect = (provider: string) => {
    window.location.href = `/api/auth/${provider}`
  }

  // Función para ir a la página de configuración
  const handleGoToSettings = () => {
    router.push("/settings")
  }

  // Si no hay cuentas expiradas, no mostrar nada
  if (expiredAccounts.length === 0) {
    return null
  }

  // Agrupar cuentas por proveedor
  const googleAccounts = expiredAccounts.filter((account) => account.provider === "google")
  const microsoftAccounts = expiredAccounts.filter((account) => account.provider === "microsoft")

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Tokens expirados</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>
            Se han detectado {expiredAccounts.length} {expiredAccounts.length === 1 ? "cuenta" : "cuentas"} con tokens
            expirados:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {expiredAccounts.map((account) => (
              <li key={account.id}>
                {account.email} ({account.provider === "google" ? "Google" : "Microsoft"})
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button size="sm" onClick={handleRefreshTokens} disabled={isRefreshing} className="flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Renovando..." : "Renovar tokens"}
            </Button>

            {googleAccounts.length > 0 && (
              <Button size="sm" onClick={() => handleReconnect("google")}>
                Reconectar Google
              </Button>
            )}

            {microsoftAccounts.length > 0 && (
              <Button size="sm" onClick={() => handleReconnect("microsoft")}>
                Reconectar Microsoft
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={handleGoToSettings}>
              Ir a configuración
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
