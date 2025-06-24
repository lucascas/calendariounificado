"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { calendarStorage } from "@/lib/calendar-storage"
import { ensureValidToken } from "@/lib/token-refresh"
import type { CalendarAccount } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function TokenStatus() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Función para cargar cuentas
  const loadAccounts = () => {
    const storedAccounts = calendarStorage.getAccounts()
    setAccounts(storedAccounts)
  }

  useEffect(() => {
    // Cargar cuentas al montar el componente
    loadAccounts()

    // Actualizar cada 30 segundos
    const interval = setInterval(loadAccounts, 30000)

    return () => clearInterval(interval)
  }, [])

  const refreshAllTokens = async () => {
    setIsRefreshing(true)

    try {
      const updatedAccounts = [...accounts]
      let refreshed = 0

      for (let i = 0; i < updatedAccounts.length; i++) {
        const account = updatedAccounts[i]
        const validAccount = await ensureValidToken(account)

        if (validAccount) {
          updatedAccounts[i] = validAccount
          refreshed++
        }
      }

      // Recargar las cuentas desde el almacenamiento
      loadAccounts()

      toast({
        title: "Tokens actualizados",
        description: `Se actualizaron ${refreshed} de ${accounts.length} tokens.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error al refrescar tokens:", error)
      toast({
        title: "Error",
        description: "No se pudieron refrescar algunos tokens.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calcular tiempo restante en formato legible
  const getTimeRemaining = (expiresAt: number | undefined) => {
    if (!expiresAt) return "Desconocido"

    const now = Date.now()
    const remaining = expiresAt - now

    if (remaining <= 0) return "Expirado"

    const minutes = Math.floor(remaining / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }

    return `${minutes}m`
  }

  // Determinar el estado del token
  const getTokenStatus = (account: CalendarAccount) => {
    if (!account.expiresAt) return "unknown"

    const now = Date.now()
    const remaining = account.expiresAt - now

    if (remaining <= 0) return "expired"
    if (remaining < 10 * 60 * 1000) return "warning" // menos de 10 minutos
    return "valid"
  }

  if (accounts.length === 0) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">Estado de tokens</CardTitle>
        <Button variant="outline" size="sm" onClick={refreshAllTokens} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          Refrescar todos
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {accounts.map((account) => {
            const status = getTokenStatus(account)

            return (
              <div key={account.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={status === "valid" ? "default" : status === "warning" ? "outline" : "destructive"}>
                    {account.provider}
                  </Badge>
                  <span>{account.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {account.simulated ? "Simulado" : `Expira en: ${getTimeRemaining(account.expiresAt)}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
