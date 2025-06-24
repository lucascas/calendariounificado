"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChromeIcon as Google, ComputerIcon as Microsoft, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AccountSetupProps {
  onSetupComplete?: () => void
}

export function AccountSetup({ onSetupComplete }: AccountSetupProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Verificar si hay nuevas cuentas después de OAuth
  useEffect(() => {
    const checkForNewAccounts = async () => {
      try {
        const response = await fetch("/api/calendar-accounts")
        if (response.ok) {
          const data = await response.json()
          const accounts = data.accounts || []

          if (accounts.length > 0) {
            console.log("Se detectaron nuevas cuentas de calendario")
            toast({
              title: "¡Calendario conectado!",
              description: "Tu calendario se ha conectado exitosamente.",
              variant: "default",
            })

            if (onSetupComplete) {
              onSetupComplete()
            }
          }
        }
      } catch (error) {
        console.error("Error al verificar cuentas:", error)
      }
    }

    // Verificar inmediatamente y luego cada 2 segundos por 10 segundos
    checkForNewAccounts()

    const interval = setInterval(checkForNewAccounts, 2000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [onSetupComplete, toast])

  const connectGoogle = () => {
    setIsConnecting("google")
    setError(null)

    try {
      console.log("Iniciando conexión con Google Calendar...")
      window.location.href = "/api/auth/google"
    } catch (error) {
      console.error("Error al conectar con Google:", error)
      setError("No se pudo conectar con Google. Inténtalo de nuevo.")
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Google. Inténtalo de nuevo.",
        variant: "destructive",
      })
      setIsConnecting(null)
    }
  }

  const connectMicrosoft = () => {
    setIsConnecting("microsoft")
    setError(null)

    try {
      console.log("Iniciando conexión con Microsoft Teams...")
      window.location.href = "/api/auth/microsoft"
    } catch (error) {
      console.error("Error al conectar con Microsoft:", error)
      setError("No se pudo conectar con Microsoft. Inténtalo de nuevo.")
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Microsoft. Inténtalo de nuevo.",
        variant: "destructive",
      })
      setIsConnecting(null)
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Configuración de Calendario</CardTitle>
          <CardDescription>Conecta al menos un calendario para comenzar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Elige un calendario para conectar</h3>
            <p className="text-sm text-muted-foreground">Puedes conectar más calendarios después</p>
          </div>

          <div className="space-y-4">
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={connectGoogle}
              disabled={isConnecting !== null}
            >
              <Google className="mr-2 h-4 w-4" />
              <span>{isConnecting === "google" ? "Conectando..." : "Conectar Google Calendar"}</span>
            </Button>

            <Button
              variant="default"
              className="w-full justify-start"
              onClick={connectMicrosoft}
              disabled={isConnecting !== null}
            >
              <Microsoft className="mr-2 h-4 w-4" />
              <span>{isConnecting === "microsoft" ? "Conectando..." : "Conectar Microsoft Teams"}</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Solo necesitamos acceso de lectura a tus calendarios. No almacenamos tus eventos.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
