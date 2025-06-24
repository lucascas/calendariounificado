"use client"

import { useState, useEffect } from "react"
import { CalendarHeader } from "@/components/calendar-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import type { CalendarAccount } from "@/lib/types"
import { Trash2, ArrowLeft, Check, X, Edit2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { ColorPicker } from "@/components/color-picker"
import { InviteDialog } from "@/components/invite-dialog"
import { InvitationsSection } from "@/components/invitations-section"
import { usePreferences } from "@/hooks/use-preferences"
import type { UserPreferences } from "@/lib/preferences-storage"

export default function SettingsPage() {
  const [calendarAccounts, setCalendarAccounts] = useState<CalendarAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState<string>("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { preferences, updatePreference, resetPreferences } = usePreferences()

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true)

        const response = await fetch("/api/calendar-accounts")

        if (response.ok) {
          const data = await response.json()
          setCalendarAccounts(data.accounts || [])
        } else {
          throw new Error("Error al cargar cuentas de calendario")
        }
      } catch (error) {
        console.error("Error al cargar cuentas de calendario:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las cuentas de calendario.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [toast])

  const handlePreferenceChange = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    updatePreference(key, value)

    toast({
      title: "Preferencias guardadas",
      description: "Tus preferencias de visualización han sido actualizadas.",
      variant: "default",
    })
  }

  const reconnectAccount = (provider: "google" | "microsoft") => {
    toast({
      title: "Reconectando cuenta",
      description: `Serás redirigido para reconectar tu cuenta de ${provider === "google" ? "Google" : "Microsoft"}.`,
      variant: "default",
    })

    setTimeout(() => {
      window.location.href = `/api/auth/${provider}`
    }, 1000)
  }

  const removeAccount = async (accountId: string, email: string) => {
    try {
      const response = await fetch(`/api/calendar-accounts/${accountId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la cuenta")
      }

      const data = await response.json()
      setCalendarAccounts(data.accounts || [])

      toast({
        title: "Cuenta eliminada",
        description: `La cuenta ${email} ha sido eliminada correctamente.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error al eliminar cuenta:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta.",
        variant: "destructive",
      })
    }
  }

  const updateAccountColor = async (accountId: string, color: string) => {
    try {
      const account = calendarAccounts.find((acc) => acc.id === accountId)
      if (!account) return

      const updatedAccount = { ...account, color }

      const response = await fetch("/api/calendar-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account: updatedAccount }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el color")
      }

      const data = await response.json()
      setCalendarAccounts(data.accounts || [])

      toast({
        title: "Color actualizado",
        description: "El color del calendario ha sido actualizado.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error al actualizar color:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el color del calendario.",
        variant: "destructive",
      })
    }
  }

  const updateAccountName = async (accountId: string) => {
    try {
      const account = calendarAccounts.find((acc) => acc.id === accountId)
      if (!account) return

      const updatedAccount = { ...account, name: nameInput.trim() || undefined }

      const response = await fetch("/api/calendar-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account: updatedAccount }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el nombre")
      }

      const data = await response.json()
      setCalendarAccounts(data.accounts || [])
      setEditingName(null)

      toast({
        title: "Nombre actualizado",
        description: "El nombre del calendario ha sido actualizado.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error al actualizar nombre:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre del calendario.",
        variant: "destructive",
      })
    }
  }

  const startEditingName = (accountId: string, currentName: string | undefined) => {
    setEditingName(accountId)
    setNameInput(currentName || "")
  }

  const cancelEditingName = () => {
    setEditingName(null)
    setNameInput("")
  }

  const addNewCalendar = () => {
    window.location.href = "/"
  }

  const goBack = () => {
    router.push("/")
  }

  const googleAccounts = calendarAccounts.filter((account) => account.provider === "google")
  const microsoftAccounts = calendarAccounts.filter((account) => account.provider === "microsoft")

  const defaultColors = {
    google: "#4285F4",
    microsoft: "#7B83EB",
  }

  const getDisplayName = (account: CalendarAccount): string => {
    if (account.name) return account.name
    if (account.provider === "google") return "Google Calendar"
    return "Microsoft Calendar"
  }

  return (
    <div className="min-h-screen bg-background">
      <CalendarHeader calendarAccounts={calendarAccounts} />

      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={goBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Configuración</h1>
        </div>

        <div className="grid gap-6">
          {/* Sección de cuentas conectadas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cuentas conectadas</CardTitle>
                <CardDescription>Administra tus conexiones de calendario</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsInviteDialogOpen(true)} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invitar
                </Button>
                <Button onClick={addNewCalendar}>Agregar calendario</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                <>
                  {googleAccounts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Google Calendar</h3>
                      {googleAccounts.map((account) => (
                        <div key={account.id} className="border p-3 rounded-md">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <ColorPicker
                                value={account.color || defaultColors.google}
                                onChange={(color) => updateAccountColor(account.id, color)}
                              />
                              <div className="ml-3">
                                {editingName === account.id ? (
                                  <div className="flex items-center">
                                    <Input
                                      value={nameInput}
                                      onChange={(e) => setNameInput(e.target.value)}
                                      placeholder="Nombre del calendario"
                                      className="h-8 w-48"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateAccountName(account.id)}
                                      className="h-8 w-8 ml-1"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={cancelEditingName} className="h-8 w-8">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <p className="font-medium">{getDisplayName(account)}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => startEditingName(account.id, account.name)}
                                      className="h-8 w-8 ml-1"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                                <p className="text-sm text-muted-foreground">{account.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant={account.accessToken ? "outline" : "default"}
                                onClick={() => reconnectAccount("google")}
                              >
                                {account.accessToken ? "Reconectar" : "Reparar conexión"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removeAccount(account.id, account.email)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {account.simulated
                              ? "Cuenta simulada"
                              : account.accessToken
                                ? "Conectado"
                                : "Problema de conexión - Reconectar"}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={() => reconnectAccount("google")}>
                        Agregar otra cuenta de Google
                      </Button>
                    </div>
                  )}

                  {microsoftAccounts.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h3 className="font-medium text-lg">Microsoft Teams</h3>
                      {microsoftAccounts.map((account) => (
                        <div key={account.id} className="border p-3 rounded-md">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <ColorPicker
                                value={account.color || defaultColors.microsoft}
                                onChange={(color) => updateAccountColor(account.id, color)}
                              />
                              <div className="ml-3">
                                {editingName === account.id ? (
                                  <div className="flex items-center">
                                    <Input
                                      value={nameInput}
                                      onChange={(e) => setNameInput(e.target.value)}
                                      placeholder="Nombre del calendario"
                                      className="h-8 w-48"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateAccountName(account.id)}
                                      className="h-8 w-8 ml-1"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={cancelEditingName} className="h-8 w-8">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <p className="font-medium">{getDisplayName(account)}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => startEditingName(account.id, account.name)}
                                      className="h-8 w-8 ml-1"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                                <p className="text-sm text-muted-foreground">{account.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant={account.accessToken ? "outline" : "default"}
                                onClick={() => reconnectAccount("microsoft")}
                              >
                                {account.accessToken ? "Reconectar" : "Reparar conexión"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removeAccount(account.id, account.email)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {account.simulated
                              ? "Cuenta simulada"
                              : account.accessToken
                                ? "Conectado"
                                : "Problema de conexión - Reconectar"}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={() => reconnectAccount("microsoft")}>
                        Agregar otra cuenta de Microsoft
                      </Button>
                    </div>
                  )}

                  {calendarAccounts.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No hay cuentas de calendario conectadas</p>
                      <div className="space-y-2">
                        <Button className="w-full" onClick={() => reconnectAccount("google")}>
                          Conectar Google Calendar
                        </Button>
                        <Button className="w-full" onClick={() => reconnectAccount("microsoft")}>
                          Conectar Microsoft Teams
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Nueva sección de invitaciones - AQUÍ DEBE ESTAR */}
          <InvitationsSection />

          {/* Sección de preferencias */}
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de visualización</CardTitle>
              <CardDescription>Personaliza cómo se muestran tus calendarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-hour">Hora de inicio del día</Label>
                <Input
                  id="start-hour"
                  type="time"
                  value={preferences.startHour}
                  onChange={(e) => handlePreferenceChange("startHour", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-hour">Hora de fin del día</Label>
                <Input
                  id="end-hour"
                  type="time"
                  value={preferences.endHour}
                  onChange={(e) => handlePreferenceChange("endHour", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="weekend"
                  checked={preferences.showWeekends}
                  onCheckedChange={(checked) => handlePreferenceChange("showWeekends", checked)}
                />
                <Label htmlFor="weekend">Mostrar fines de semana</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={preferences.enableNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange("enableNotifications", checked)}
                />
                <Label htmlFor="notifications">Notificaciones de eventos</Label>
              </div>
            </CardContent>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetPreferences()
                  toast({
                    title: "Preferencias restablecidas",
                    description: "Tus preferencias de visualización han sido restablecidas a los valores por defecto.",
                    variant: "default",
                  })
                }}
              >
                Restablecer valores por defecto
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <InviteDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </div>
  )
}
