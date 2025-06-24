"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"

export default function ErrorPage() {
  const [errorInfo, setErrorInfo] = useState({
    source: "desconocido",
    message: "error_general",
    details: "",
  })

  useEffect(() => {
    // Obtener parámetros de la URL usando window.location
    const urlParams = new URLSearchParams(window.location.search)
    setErrorInfo({
      source: urlParams.get("source") || "desconocido",
      message: urlParams.get("message") || "error_general",
      details: urlParams.get("details") || "",
    })
  }, [])

  let errorTitle = "Error de autenticación"
  let errorDescription = "Ha ocurrido un error durante el proceso de autenticación."
  let solutionSteps: string[] = []

  if (errorInfo.source === "google") {
    errorTitle = "Error al conectar con Google"
    errorDescription = "No se pudo completar la autenticación con Google Calendar."

    // Verificar si es un error específico
    if (errorInfo.details.includes("invalid_request") && errorInfo.details.includes("approval_prompt")) {
      errorDescription = "Error de configuración: Conflicto entre parámetros de autenticación."
      solutionSteps = [
        "Este es un error técnico en la configuración de la autenticación.",
        "El equipo de desarrollo ha sido notificado y estamos trabajando para solucionarlo.",
        "Por favor, intenta nuevamente en unos minutos.",
      ]
    }
  } else if (errorInfo.source === "microsoft") {
    errorTitle = "Error al conectar con Microsoft"
    errorDescription = "No se pudo completar la autenticación con Microsoft Teams."

    // Verificar si es el error específico de "unauthorized_client"
    if (errorInfo.details.includes("unauthorized_client")) {
      errorDescription = "La aplicación no está configurada correctamente para cuentas personales de Microsoft."
      solutionSteps = [
        "1. Accede al Portal de Azure en https://portal.azure.com",
        "2. Ve a 'Registros de aplicaciones'",
        "3. Selecciona tu aplicación",
        "4. En 'Autenticación', asegúrate de que 'Cuentas en cualquier directorio organizativo y cuentas personales de Microsoft' esté seleccionado",
        "5. Guarda los cambios y vuelve a intentar la conexión",
      ]
    }
  }

  if (errorInfo.message === "invalid_state") {
    errorDescription = "Error de seguridad: estado inválido. Por favor, intenta de nuevo."
  } else if (errorInfo.message === "auth_error") {
    errorDescription = "Error durante la autenticación. Por favor, intenta de nuevo."
  } else if (errorInfo.message === "config_error") {
    errorDescription = "Error de configuración. Verifica que las credenciales estén correctamente configuradas."
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>{errorTitle}</CardTitle>
          </div>
          <CardDescription>{errorDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Esto puede deberse a un problema temporal o a una configuración incorrecta.
          </p>

          {solutionSteps.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="font-medium">Pasos para solucionar:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {solutionSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {errorInfo.details && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Detalles del error: {errorInfo.details}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/" className="w-full">
            <Button className="w-full">Volver al inicio</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
