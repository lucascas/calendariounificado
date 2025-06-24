"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function GoogleAuthTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [testUrl, setTestUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateAuthUrl = () => {
    try {
      setError(null)

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        setError("No se encontró el ID de cliente de Google")
        return
      }

      // Usar el endpoint v1 en lugar de v2.0
      const authUrl = new URL("https://accounts.google.com/o/oauth2/auth")

      const redirectUri = `${window.location.origin}/api/auth/google/callback`

      authUrl.searchParams.append("client_id", clientId)
      authUrl.searchParams.append("redirect_uri", redirectUri)
      authUrl.searchParams.append("response_type", "code")
      authUrl.searchParams.append(
        "scope",
        "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
      )
      authUrl.searchParams.append("access_type", "offline")
      authUrl.searchParams.append("prompt", "consent")
      authUrl.searchParams.append("include_granted_scopes", "true")
      authUrl.searchParams.append("state", Math.random().toString(36).substring(2))

      setTestUrl(authUrl.toString())
    } catch (error) {
      setError(`Error al generar URL: ${(error as Error).message}`)
    }
  }

  const testAuth = () => {
    if (testUrl) {
      window.location.href = testUrl
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed top-4 left-4">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          Probar Auth Google v1
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Prueba de Auth Google v1</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button variant="outline" size="sm" onClick={generateAuthUrl} className="w-full">
            Generar URL de autenticación v1
          </Button>

          {testUrl && (
            <div className="mt-2">
              <p className="mb-2 text-xs break-all">{testUrl}</p>
              <Button variant="default" size="sm" onClick={testAuth} className="w-full">
                Probar autenticación
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Esta herramienta usa el endpoint v1 de OAuth de Google en lugar de v2.0
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
