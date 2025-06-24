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

  // Verificar si hay cookies de autenticación al montar el componente
  useEffect(() => {
    const checkForAuthCookies = () => {
      const cookies = document.cookie.split("; ")
      const hasGoogleAuth = cookies.some((cookie) => cookie.startsWith("google-auth="))
      const hasMicrosoftAuth = cookies.some((cookie) => cookie.startsWith("microsoft-auth="))

      if (hasGoogleAuth || hasMicrosoftAuth) {
        console.log("Se detectaron cookies de autenticación, notificando configuración completada")
        if (onSetupComplete) {
          onSetupComplete()
        }
      }
    }

    checkForAuthCookies()
  }, [onSetupComplete])

  const connectGoogle = () => {
    setIsConnecting("google")
    try {
      console.log("Iniciando conexión con Google Calendar...")
      // Redirección directa
      window.location.href = "/api/auth/google"
    } catch (error) {
      console.error("Error al conectar con Google:", error)
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
    try {
      console.log("Iniciando conexión con Microsoft Teams...")
      // Redirección directa
      window.location.href = "/api/auth/microsoft"
    } catch (error) {
      console.error("Error al conectar con Microsoft:", error)
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
              <span>Conectar Google Calendar</span>
            </Button>

            <Button
              variant="default"
              className="w-full justify-start"
              onClick={connectMicrosoft}
              disabled={isConnecting !== null}
            >
              <Microsoft className="mr-2 h-4 w-4" />
              <span>Conectar Microsoft Teams</span>
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
