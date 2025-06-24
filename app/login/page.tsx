"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Calendar, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username || !password) {
      setError("Por favor, ingresa tu nombre de usuario y contraseña")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Credenciales inválidas")
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${data.user.name || data.user.username}`,
      })

      // Redirigir al dashboard
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error en inicio de sesión:", error)
      setError(error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión")

      toast({
        title: "Error de inicio de sesión",
        description: "Credenciales inválidas o error del servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google"
  }

  const handleMicrosoftLogin = () => {
    window.location.href = "/api/auth/microsoft"
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Calendario Unificado</CardTitle>
          <CardDescription className="text-center">Inicia sesión para acceder a tus calendarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones de OAuth */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              Continuar con Google
            </Button>

            <Button variant="outline" className="w-full" onClick={handleMicrosoftLogin} disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              Continuar con Microsoft
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          {/* Formulario tradicional */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario o Email</Label>
              <Input
                id="username"
                placeholder="usuario@ejemplo.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center">
            <Link href="/register" className="text-sm text-primary hover:underline">
              ¿No tienes una cuenta? Regístrate
            </Link>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Al iniciar sesión con Google o Microsoft, automáticamente se conectarán tus calendarios
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
