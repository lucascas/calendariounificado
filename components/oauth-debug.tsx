"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function OAuthDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkGoogleConfig = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

      setDebugInfo({
        clientId: clientId ? `${clientId.substring(0, 10)}...` : "No configurado",
        redirectUri: `${window.location.origin}/api/auth/google/callback`,
        baseUrl: window.location.origin,
      })
    } catch (err) {
      setError("Error al obtener información de configuración")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const goToDiagnosticPage = () => {
    router.push("/oauth-diagnostico")
  }

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Depurar OAuth
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Depuración de OAuth</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
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

          <Button variant="outline" size="sm" onClick={checkGoogleConfig} disabled={isLoading} className="w-full">
            {isLoading ? "Verificando..." : "Verificar configuración de Google"}
          </Button>

          {debugInfo && (
            <div className="mt-2 space-y-1">
              <p>
                <strong>Client ID:</strong> {debugInfo.clientId}
              </p>
              <p>
                <strong>URI de redirección:</strong> {debugInfo.redirectUri}
              </p>
              <p>
                <strong>URL base:</strong> {debugInfo.baseUrl}
              </p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-bold mb-1">Pasos para verificar en Google Cloud Console:</h3>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Accede a{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>Selecciona tu proyecto</li>
              <li>Ve a "Credenciales"</li>
              <li>Verifica que el ID de cliente OAuth esté correcto</li>
              <li>
                Asegúrate de que la URI de redirección incluya:{" "}
                <code className="bg-gray-100 px-1">{window.location.origin}/api/auth/google/callback</code>
              </li>
              <li>Verifica que la API de Google Calendar esté habilitada</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="default" size="sm" onClick={goToDiagnosticPage} className="w-full">
            Ir a página de diagnóstico completo
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
