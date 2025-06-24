"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { RefreshCw, LogOut, Settings, PlusCircle, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddCalendarDialog } from "@/components/add-calendar-dialog"
import { useToast } from "@/hooks/use-toast"
import type { CalendarAccount } from "@/lib/types"
import { useRouter } from "next/navigation"

interface CalendarHeaderProps {
  calendarAccounts: CalendarAccount[]
}

export function CalendarHeader({ calendarAccounts }: CalendarHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const refreshCalendars = async () => {
    setIsRefreshing(true)
    // Aquí iría la lógica para refrescar los datos de los calendarios
    setTimeout(() => {
      setIsRefreshing(false)
      window.location.reload()
    }, 1000)
  }

  const handleLogout = async () => {
    // Eliminar el estado de autenticación
    localStorage.removeItem("isAuthenticated")

    // Intentar cerrar sesión con la API
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }

    // Eliminar cookies de autenticación
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "google-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "microsoft-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
      variant: "default",
    })

    // Recargar la página
    window.location.href = "/login"
  }

  const goToSettings = () => {
    router.push("/settings")
  }

  // Contar cuentas por proveedor
  const googleAccounts = calendarAccounts.filter((account) => account.provider === "google")
  const microsoftAccounts = calendarAccounts.filter((account) => account.provider === "microsoft")

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Calendario Unificado</h1>

        <div className="flex items-center gap-2">
          <Dialog open={isAddCalendarOpen} onOpenChange={setIsAddCalendarOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                <span>Agregar calendario</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar calendario</DialogTitle>
                <DialogDescription>
                  Conecta un calendario adicional para ver todos tus eventos en un solo lugar.
                </DialogDescription>
              </DialogHeader>
              <AddCalendarDialog onClose={() => setIsAddCalendarOpen(false)} />
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon" onClick={refreshCalendars} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refrescar</span>
          </Button>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-medium">
                <span>Admin</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={goToSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {googleAccounts.length > 0 && (
                <>
                  <DropdownMenuItem className="text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                    <span>
                      {googleAccounts.length} {googleAccounts.length === 1 ? "cuenta de Google" : "cuentas de Google"}
                    </span>
                  </DropdownMenuItem>
                </>
              )}

              {microsoftAccounts.length > 0 && (
                <>
                  <DropdownMenuItem className="text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                    <span>
                      {microsoftAccounts.length}{" "}
                      {microsoftAccounts.length === 1 ? "cuenta de Microsoft" : "cuentas de Microsoft"}
                    </span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
