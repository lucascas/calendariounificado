"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function GoogleOAuthTester() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean | string>>({})
  const { toast } = useToast()

  const runTests = async () => {
    setIsLoading(true)
    setTestResults({})

    // Verificar variables de entorno
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const results: Record<string, boolean | string> = {
      clientIdExists: !!clientId,
      clientIdFormat: clientId && clientId.includes(".apps.googleusercontent.com") ? true : "Formato incorrecto",
    }

    // Verificar si podemos construir la URL de OAuth correctamente
    try {
      const baseUrl = window.location.origin
      const redirectUri = `${baseUrl}/api/auth/google/callback`

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2.0/auth")
      authUrl.searchParams.append("client_id", clientId || "")
      authUrl.searchParams.append("redirect_uri", redirectUri)
      authUrl.searchParams.append("response_type", "code")
      authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/calendar.readonly")
      authUrl.searchParams.append("access_type", "offline")
      authUrl.searchParams.append("prompt", "consent")

      results.canBuildAuthUrl = true
      results.authUrl = authUrl.toString().substring(0, 50) + "..."

      // Verificar si la URL es accesible (esto no garantiza que funcione, solo que la URL es válida)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(authUrl.toString(), {
          method: "HEAD",
          signal: controller.signal,
          mode: "no-cors", // Esto evitará errores CORS pero no nos dará información real
        })

        clearTimeout(timeoutId)
        results.urlAccessible = "No se puede verificar completamente debido a restricciones CORS"
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          results.urlAccessible = "Tiempo de espera agotado"
        } else {
          results.urlAccessible = "Error al verificar URL"
        }
      }
    } catch (error) {
      results.canBuildAuthUrl = false
      results.buildUrlError = (error as Error).message
    }

    setTestResults(results)
    setIsLoading(false)
  }

  const handleDirectTest = () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        toast({
          title: "Error",
          description: "No se encontró el ID de cliente de Google",
          variant: "destructive",
        })
        return
      }

      const baseUrl = window.location.origin
      const redirectUri = `${baseUrl}/api/auth/google/callback`

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2.0/auth")
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

      // Redirigir directamente a la URL de autenticación
      window.location.href = authUrl.toString()
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al construir URL: ${(error as Error).message}`,
        variant: "destructive",
      })
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          Probar OAuth de Google
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Prueba de OAuth de Google</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta herramienta te ayudará a diagnosticar problemas con la autenticación de Google OAuth.
            </AlertDescription>
          </Alert>

          <Button variant="outline" size="sm" onClick={runTests} disabled={isLoading} className="w-full">
            {isLoading ? "Ejecutando pruebas..." : "Ejecutar pruebas de diagnóstico"}
          </Button>

          {Object.keys(testResults).length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-bold">Resultados:</h3>
              <ul className="space-y-1">
                {Object.entries(testResults).map(([key, value]) => (
                  <li key={key} className="flex items-start">
                    {typeof value === "boolean" ? (
                      value ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mr-1 mt-0.5" />
                      )
                    ) : (
                      <span className="mr-1">→</span>
                    )}
                    <span>
                      <strong>{key}:</strong> {typeof value === "boolean" ? (value ? "OK" : "Error") : value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-2">
            <Button variant="default" size="sm" onClick={handleDirectTest} className="w-full">
              Probar autenticación directa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/api/auth/google")}
              className="w-full"
            >
              Usar ruta API normal
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
