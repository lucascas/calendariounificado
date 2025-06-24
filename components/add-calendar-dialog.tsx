"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChromeIcon as Google, ComputerIcon as Microsoft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// Importar el componente de ayuda
import { MicrosoftSetupHelp } from "@/components/microsoft-setup-help"

interface AddCalendarDialogProps {
  onClose: () => void
}

export function AddCalendarDialog({ onClose }: AddCalendarDialogProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const { toast } = useToast()

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
    <div className="space-y-4 py-4">
      <div className="space-y-4">
        <Button
          variant="default"
          className="w-full justify-start"
          onClick={connectGoogle}
          disabled={isConnecting !== null}
        >
          <Google className="mr-2 h-4 w-4" />
          <span>Conectar cuenta de Google Calendar</span>
        </Button>

        <Button
          variant="default"
          className="w-full justify-start"
          onClick={connectMicrosoft}
          disabled={isConnecting !== null}
        >
          <Microsoft className="mr-2 h-4 w-4" />
          <span>Conectar cuenta de Microsoft Teams</span>
        </Button>

        <div className="mt-2 flex justify-end">
          <MicrosoftSetupHelp />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}
