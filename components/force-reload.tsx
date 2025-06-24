"use client"

import { useEffect, useState } from "react"

export function ForceReload() {
  const [hasReloaded, setHasReloaded] = useState(false)

  useEffect(() => {
    // Verificar si venimos de una autenticación exitosa usando window.location
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get("auth_success")

    // Verificar si hay cookies de autenticación de calendario
    const cookies = document.cookie.split("; ")
    const hasGoogleAuth = cookies.some((cookie) => cookie.startsWith("google-auth="))
    const hasMicrosoftAuth = cookies.some((cookie) => cookie.startsWith("microsoft-auth="))

    if ((authSuccess === "true" || hasGoogleAuth || hasMicrosoftAuth) && !hasReloaded) {
      console.log("Detectada autenticación exitosa o cookies de calendario, recargando página...")
      setHasReloaded(true)

      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Esperar un momento y luego recargar
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }, [hasReloaded])

  return null
}
