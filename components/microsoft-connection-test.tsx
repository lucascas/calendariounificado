"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function MicrosoftConnectionTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)

    try {
      // Verificar variables de entorno
      const envCheck = await fetch("/api/debug/env-check")
      const envData = await envCheck.json()

      if (!envData.microsoft.clientId || !envData.microsoft.clientSecret) {
        setResult({
          success: false,
          message: "Variables de entorno de Microsoft no configuradas correctamente",
          details: envData.microsoft,
        })
        return
      }

      // Intentar iniciar flujo de OAuth
      window.location.href = "/api/auth/microsoft"
    } catch (error) {
      setResult({
        success: false,
        message: "Error al probar la conexión",
        details: error,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Microsoft Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Probando...
            </>
          ) : (
            "Probar Conexión Microsoft"
          )}
        </Button>

        {result && (
          <div
            className={`p-3 rounded-lg ${
              result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.message}
              </span>
            </div>
            {result.details && (
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
