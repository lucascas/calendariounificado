"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Tipo para el usuario autenticado
interface AuthUser {
  id: string
  username: string
  email?: string
  name?: string
}

// Tipo para el contexto de autenticación
interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, email?: string, name?: string) => Promise<boolean>
  logout: () => Promise<void>
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

// Proveedor de autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar si el usuario está autenticado al cargar
  useEffect(() => {
    async function loadUserFromSession() {
      try {
        setLoading(true)
        const response = await fetch("/api/auth/me")

        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.user) {
            setUser(data.user)
          } else {
            // Si no está autenticado según la API, limpiar el estado local
            setUser(null)
            localStorage.removeItem("isAuthenticated")
          }
        } else {
          // Si hay un error en la respuesta, limpiar el estado
          setUser(null)
          localStorage.removeItem("isAuthenticated")
          console.error("Error al verificar autenticación:", response.status)
        }
      } catch (error) {
        console.error("Error al cargar la sesión:", error)
        setUser(null)
        localStorage.removeItem("isAuthenticated")
      } finally {
        setLoading(false)
      }
    }

    loadUserFromSession()
  }, [])

  // Función para iniciar sesión
  async function login(username: string, password: string): Promise<boolean> {
    try {
      setLoading(true)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Error de inicio de sesión",
          description: error.error || "Credenciales inválidas",
          variant: "destructive",
        })
        return false
      }

      const data = await response.json()
      setUser(data.user)

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${data.user.name || data.user.username}`,
      })

      return true
    } catch (error) {
      console.error("Error en inicio de sesión:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Función para registrar un nuevo usuario
  async function register(username: string, password: string, email?: string, name?: string): Promise<boolean> {
    try {
      setLoading(true)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email, name }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Error de registro",
          description: error.error || "No se pudo crear la cuenta",
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      })

      return true
    } catch (error) {
      console.error("Error en registro:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la cuenta",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  async function logout(): Promise<void> {
    try {
      setLoading(true)
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      setUser(null)
      router.push("/login")

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cerrar sesión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Valor del contexto
  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
