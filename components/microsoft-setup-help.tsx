"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function MicrosoftSetupHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ayuda con Microsoft
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración de Microsoft</DialogTitle>
          <DialogDescription>
            Cómo configurar correctamente tu aplicación de Microsoft para cuentas personales
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Si recibes el error "unauthorized_client", significa que tu aplicación no está configurada para cuentas
              personales de Microsoft.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="font-medium">Pasos para solucionar:</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>
                Accede al{" "}
                <a
                  href="https://portal.azure.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Portal de Azure
                </a>
              </li>
              <li>Ve a "Registros de aplicaciones"</li>
              <li>Selecciona tu aplicación</li>
              <li>En la sección "Autenticación", busca "Tipos de cuenta compatibles"</li>
              <li>
                Selecciona la opción "Cuentas en cualquier directorio organizativo y cuentas personales de Microsoft"
              </li>
              <li>
                Asegúrate de que la URI de redirección esté configurada correctamente (debe coincidir con tu dominio +
                "/api/auth/microsoft/callback")
              </li>
              <li>Guarda los cambios</li>
              <li>Vuelve a intentar la conexión</li>
            </ol>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Para más información, consulta la{" "}
              <a
                href="https://learn.microsoft.com/es-es/azure/active-directory/develop/quickstart-register-app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                documentación oficial de Microsoft
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
