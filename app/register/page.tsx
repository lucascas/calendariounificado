"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Calendar, Mail, UserCheck } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [isValidatingInvitation, setIsValidatingInvitation] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const invitationToken = searchParams.get("invitation")

  // Validar invitación si existe
  useEffect(() => {
    if (invitationToken) {
      validateInvitation(invitationToken)
    }
  }, [invitationToken])

  const validateInvitation = async (token: string) => {
    setIsValidatingInvitation(true)
    try {
      const response = await fetch(`/api/invitations/validate?token=${token}`)
      const data = await response.json()

      if (response.ok && data.valid) {
        setInvitationData(data)
        setEmail(data.email) // Pre-llenar el email
        toast({
          title: "Invitación válida",
          description: `Invitado por ${data.inviterName}`,
          variant: "default",
        })
      } else {
        setError(data.error || "Invitación inválida")
        toast({
          title: "Invitación inválida",
          description: data.error || "La invitación no es válida o ha expirado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al validar invitación:", error)
      setError("Error al validar la invitación")
    } finally {
      setIsValidatingInvitation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username || !email || !password || !confirmPassword) {
      setError("Por favor, completa todos los campos requeridos")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          name,
          invitationToken: invitationToken || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la cuenta")
      }

      toast({
        title: "Registro exitoso",
        description: invitationData
          ? `Tu cuenta ha sido creada y asociada con ${invitationData.inviterName}. Ahora puedes iniciar sesión.`
          : "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      })

      router.push("/login")
    } catch (error) {
      console.error("Error en registro:", error)
      setError(error instanceof Error ? error.message : "Ocurrió un error al crear la cuenta")

      toast({
        title: "Error",
        description: "Ocurrió un error al crear la cuenta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = () => {
    const url = invitationToken ? `/api/auth/google?invitation=${invitationToken}` : "/api/auth/google"
    window.location.href = url
  }

  const handleMicrosoftRegister = () => {
    const url = invitationToken ? `/api/auth/microsoft?invitation=${invitationToken}` : "/api/auth/microsoft"
    window.location.href = url
  }

  if (isValidatingInvitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Validando invitación...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            {invitationData ? "Aceptar invitación" : "Crear cuenta"}
          </CardTitle>
          <CardDescription className="text-center">
            {invitationData
              ? `${invitationData.inviterName} te ha invitado a Calendario Unificado`
              : "Regístrate para comenzar a usar Calendario Unificado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitationData && (
            <Alert>
              <UserCheck className="h-4 w-4" />
              <AlertDescription>
                Invitado por <strong>{invitationData.inviterName}</strong> ({invitationData.inviterEmail})
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones de OAuth */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={handleGoogleRegister} disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              Registrarse con Google
            </Button>

            <Button variant="outline" className="w-full" onClick={handleMicrosoftRegister} disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              Registrarse con Microsoft
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O regístrate con</span>
            </div>
          </div>

          {/* Formulario tradicional */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Usuario <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                placeholder="usuario123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !!invitationData} // Deshabilitar si viene de invitación
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar contraseña <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              ¿Ya tienes una cuenta? Inicia sesión
            </Link>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Al registrarte con Google o Microsoft, automáticamente se conectarán tus calendarios
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
