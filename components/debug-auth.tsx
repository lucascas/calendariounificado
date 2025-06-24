"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function DebugAuth() {
  const [cookies, setCookies] = useState<Record<string, string>>({})
  const [googleAuth, setGoogleAuth] = useState<any>(null)
  const [microsoftAuth, setMicrosoftAuth] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    const parseCookies = () => {
      const cookieObj: Record<string, string> = {}
      const cookies = document.cookie.split("; ")

      cookies.forEach((cookie) => {
        if (cookie) {
          const parts = cookie.split("=")
          if (parts.length >= 2) {
            const [name, ...valueParts] = parts
            cookieObj[name] = valueParts.join("=")
          }
        }
      })

      return cookieObj
    }

    const cookies = parseCookies()
    setCookies(cookies)

    // Intentar parsear las cookies de autenticación
    try {
      if (cookies["google-auth"]) {
        if (cookies["google-auth"] === "simulated-token") {
          setGoogleAuth({ simulated: true })
        } else {
          try {
            let authData
            try {
              authData = JSON.parse(decodeURIComponent(cookies["google-auth"]))
            } catch (e) {
              // Si falla, intentar parsear directamente
              authData = JSON.parse(cookies["google-auth"])
            }
            setGoogleAuth(authData)
          } catch (e) {
            console.error("Error parsing Google auth cookie:", e)
            setGoogleAuth({ error: e.message })
          }
        }
      }

      if (cookies["microsoft-auth"]) {
        if (cookies["microsoft-auth"] === "simulated-token") {
          setMicrosoftAuth({ simulated: true })
        } else {
          try {
            let authData
            try {
              authData = JSON.parse(decodeURIComponent(cookies["microsoft-auth"]))
            } catch (e) {
              // Si falla, intentar parsear directamente
              authData = JSON.parse(cookies["microsoft-auth"])
            }
            setMicrosoftAuth(authData)
          } catch (e) {
            console.error("Error parsing Microsoft auth cookie:", e)
            setMicrosoftAuth({ error: e.message })
          }
        }
      }
    } catch (error) {
      console.error("Error loading auth data:", error)
    }
  }, [])

  const toggleDebug = () => {
    setShowDebug(!showDebug)
  }

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" onClick={toggleDebug}>
          Mostrar Depuración
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Información de Depuración</CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleDebug}>
              Cerrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-2 max-h-96 overflow-auto">
          <div>
            <h3 className="font-bold">Cookies disponibles:</h3>
            {Object.keys(cookies).length > 0 ? (
              <ul className="list-disc pl-4">
                {Object.keys(cookies).map((name) => (
                  <li key={name}>
                    {name}: {name.includes("auth") ? "[CONTENIDO OCULTO]" : cookies[name]}
                  </li>
                ))}
              </ul>
            ) : (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription>No se encontraron cookies</AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <h3 className="font-bold">Estado de autenticación de Google:</h3>
            {googleAuth ? (
              <div>
                {googleAuth.simulated ? (
                  <p>Usando autenticación simulada</p>
                ) : googleAuth.error ? (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription>Error: {googleAuth.error}</AlertDescription>
                  </Alert>
                ) : (
                  <ul className="list-disc pl-4">
                    <li>Usuario: {googleAuth.user?.email || "No disponible"}</li>
                    <li>Token: {googleAuth.access_token ? "Presente" : "Ausente"}</li>
                    <li>
                      Expira:{" "}
                      {googleAuth.expires_at ? new Date(googleAuth.expires_at).toLocaleString() : "No disponible"}
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <p>No configurado</p>
            )}
          </div>

          <div>
            <h3 className="font-bold">Estado de autenticación de Microsoft:</h3>
            {microsoftAuth ? (
              <div>
                {microsoftAuth.simulated ? (
                  <p>Usando autenticación simulada</p>
                ) : microsoftAuth.error ? (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription>Error: {microsoftAuth.error}</AlertDescription>
                  </Alert>
                ) : (
                  <ul className="list-disc pl-4">
                    <li>Usuario: {microsoftAuth.user?.email || "No disponible"}</li>
                    <li>Token: {microsoftAuth.access_token ? "Presente" : "Ausente"}</li>
                    <li>
                      Expira:{" "}
                      {microsoftAuth.expires_at ? new Date(microsoftAuth.expires_at).toLocaleString() : "No disponible"}
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <p>No configurado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
