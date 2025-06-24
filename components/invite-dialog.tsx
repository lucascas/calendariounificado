"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, CheckCircle, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState<string>("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!email || !email.includes("@")) {
      setError("Por favor, ingresa un email válido")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar la invitación")
      }

      setSuccess(true)
      setInvitationUrl(data.invitationUrl)
      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${email}`,
        variant: "default",
      })

      // Limpiar el formulario después de 10 segundos (más tiempo para ver el link)
      setTimeout(() => {
        setEmail("")
        setSuccess(false)
        setInvitationUrl("")
        onOpenChange(false)
      }, 10000)
    } catch (error) {
      console.error("Error al enviar invitación:", error)
      setError(error instanceof Error ? error.message : "Error al enviar la invitación")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl)
      toast({
        title: "Link copiado",
        description: "El link de invitación ha sido copiado al portapapeles",
        variant: "default",
      })
    } catch (error) {
      console.error("Error al copiar:", error)
      toast({
        title: "Error",
        description: "No se pudo copiar el link",
        variant: "destructive",
      })
    }
  }

  const openInNewTab = () => {
    window.open(invitationUrl, "_blank")
  }

  const handleClose = () => {
    setEmail("")
    setError(null)
    setSuccess(false)
    setInvitationUrl("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitar usuario
          </DialogTitle>
          <DialogDescription>
            Envía una invitación para que otra persona pueda acceder a Calendario Unificado
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-center">¡Invitación enviada!</p>
              <p className="text-sm text-muted-foreground text-center">
                El usuario recibirá un email con las instrucciones para registrarse
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="invitation-link" className="text-sm font-medium">
                Link de invitación generado:
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="invitation-link"
                  value={invitationUrl}
                  readOnly
                  className="text-xs"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button size="icon" variant="outline" onClick={copyToClipboard} title="Copiar link">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={openInNewTab} title="Abrir en nueva pestaña">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                También puedes compartir este link directamente con la persona que quieres invitar
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email del usuario a invitar</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !email}>
                {isLoading ? "Enviando..." : "Enviar invitación"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
