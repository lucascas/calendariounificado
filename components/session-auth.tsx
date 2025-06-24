"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function SessionAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar si hay un parámetro de autenticación exitosa en la URL
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get("auth_success")

    if (authSuccess === "true") {
      console.log("Autenticación exitosa detectada en URL, estableciendo sesión...")

      // Establecer una variable de sesión en localStorage
      localStorage.setItem("google_auth_success", "true")
      localStorage.setItem("google_auth_time", Date.now().toString())

      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Mostrar notificación
      toast({
        title: "Autenticación exitosa",
        description: "Has iniciado sesión correctamente. Recargando página...",
        variant: "default",
      })

      // Recargar la página después de un breve retraso
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }, [toast])

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const authSuccess = localStorage.getItem("google_auth_success")
    const authTime = localStorage.getItem("google_auth_time")

    if (authSuccess === "true" && authTime) {
      // Verificar si la sesión no ha expirado (24 horas)
      const now = Date.now()
      const authTimeNum = Number.parseInt(authTime, 10)

      if (now - authTimeNum < 24 * 60 * 60 * 1000) {
        setIsAuthenticated(true)
      } else {
        // Sesión expirada, limpiar
        localStorage.removeItem("google_auth_success")
        localStorage.removeItem("google_auth_time")
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("google_auth_success")
    localStorage.removeItem("google_auth_time")
    setIsAuthenticated(false)

    // Limpiar cookies
    document.cookie = "google-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "microsoft-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
      variant: "default",
    })

    // Recargar la página
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {isAuthenticated && (
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      )}
    </div>
  )
}
