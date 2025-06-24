"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OAuthDiagnosticPage() {
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setIsLoading(true)
    const results: Record<string, any> = {}

    // Verificar variables de entorno
    results.clientId = {
      value: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        ? `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.substring(0, 10)}...`
        : "No configurado",
      status: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    }

    // Verificar formato del Client ID
    if (results.clientId.status) {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
      results.clientIdFormat = {
        value: clientId.includes(".apps.googleusercontent.com") ? "Correcto" : "Formato incorrecto",
        status: clientId.includes(".apps.googleusercontent.com"),
      }
    }

    // Verificar URL base
    const baseUrl = window.location.origin
    results.baseUrl = {
      value: baseUrl,
      status: true,
    }

    // Verificar URI de redirección
    const redirectUri = `${baseUrl}/api/auth/google/callback`
    results.redirectUri = {
      value: redirectUri,
      status: true,
    }

    // Construir URL de autenticación
    try {
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2.0/auth")
      authUrl.searchParams.append("client_id", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "")
      authUrl.searchParams.append("redirect_uri", redirectUri)
      authUrl.searchParams.append("response_type", "code")
      authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/calendar.readonly")
      authUrl.searchParams.append("access_type", "offline")
      authUrl.searchParams.append("prompt", "consent")

      results.authUrl = {
        value: authUrl.toString().substring(0, 50) + "...",
        status: true,
        fullUrl: authUrl.toString(),
      }
    } catch (error) {
      results.authUrl = {
        value: `Error: ${(error as Error).message}`,
        status: false,
      }
    }

    // Verificar cookies
    const cookies = document.cookie.split("; ")
    const authCookies = cookies.filter(
      (cookie) =>
        cookie.startsWith("google-auth=") || cookie.startsWith("microsoft-auth=") || cookie.startsWith("auth_token="),
    )

    results.authCookies = {
      value:
        authCookies.length > 0
          ? `${authCookies.length} cookies de autenticación encontradas`
          : "No se encontraron cookies de autenticación",
      status: authCookies.length > 0,
      details: authCookies.map((cookie) => cookie.split("=")[0]),
    }

    setDiagnosticResults(results)
    setIsLoading(false)
  }

  const goBack = () => {
    router.push("/")
  }

  const testDirectAuth = () => {
    if (!diagnosticResults.authUrl?.fullUrl) return
    window.open(diagnosticResults.authUrl.fullUrl, "_blank")
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Button variant="outline" size="sm" onClick={goBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de OAuth de Google</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta página muestra información de diagnóstico para ayudar a solucionar problemas con la autenticación de
              Google OAuth.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="py-4 text-center">Ejecutando diagnósticos...</div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Resultados del diagnóstico:</h3>

              <div className="space-y-2">
                {Object.entries(diagnosticResults).map(([key, data]) => (
                  <div key={key} className="border p-3 rounded-md">
                    <div className="flex items-start">
                      {data.status ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">{key}</div>
                        <div className="text-sm text-muted-foreground">{data.value}</div>
                        {data.details && (
                          <div className="text-xs mt-1">
                            <strong>Detalles:</strong>{" "}
                            {Array.isArray(data.details) ? data.details.join(", ") : data.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={runDiagnostics}>Ejecutar diagnóstico nuevamente</Button>
                {diagnosticResults.authUrl?.fullUrl && (
                  <Button variant="outline" onClick={testDirectAuth}>
                    Probar URL de autenticación
                  </Button>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="font-bold">Pasos para verificar en Google Cloud Console:</h3>
                <ol className="list-decimal pl-5 space-y-2">
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
                  <li>Verifica que el proyecto esté publicado (no en modo de prueba)</li>
                  <li>
                    Asegúrate de que la cuenta que estás usando esté autorizada como usuario de prueba si el proyecto
                    está en modo de prueba
                  </li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
