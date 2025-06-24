"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LoginFormProps {
  onLoginSuccess: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Para simplificar, usaremos autenticación local
      if (username === "admin" && password === "admin") {
        localStorage.setItem("isAuthenticated", "true")

        // Añadir una bandera para indicar que estamos en modo de desarrollo
        localStorage.setItem("dev_mode", "true")

        toast({
          title: "Inicio de sesión exitoso (Modo desarrollo)",
          description: "Bienvenido al Calendario Unificado",
          variant: "default",
        })

        onLoginSuccess()
        return
      }

      setError("Usuario o contraseña incorrectos")

      toast({
        title: "Error de inicio de sesión",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error de inicio de sesión:", error)
      setError("Ocurrió un error durante el inicio de sesión")
    } finally {
      setIsLoading(false)
    }
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
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  placeholder="admin"
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Usa "admin" como usuario y contraseña para acceder</p>
        </CardFooter>
      </Card>
    </div>
  )
}
