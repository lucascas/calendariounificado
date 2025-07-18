"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventList } from "@/components/event-list"
import { DayView } from "@/components/day-view"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CalendarAccount, Event } from "@/lib/types"
import { format, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { MealPlanDisplay } from "@/components/meal-plan-display"

interface CalendarViewProps {
  calendarAccounts: CalendarAccount[]
}

export function CalendarView({ calendarAccounts }: CalendarViewProps) {
  const [date, setDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Inicializar la fecha después del montaje del componente
  useEffect(() => {
    setDate(new Date())
  }, [])

  // Función para cargar eventos desde la nueva API compartida
  const loadEvents = async (currentDate: Date) => {
    setIsLoading(true)
    setError(null)
    setEvents([])

    try {
      console.log("Cargando eventos (propios y compartidos) para la fecha:", currentDate.toDateString())
      console.log("Cuentas disponibles:", calendarAccounts.length)

      if (calendarAccounts.length === 0) {
        console.log("No hay cuentas de calendario configuradas")
        setEvents([])
        return
      }

      const allEvents: Event[] = []

      // Cargar eventos para cada cuenta (propias y compartidas)
      for (const account of calendarAccounts) {
        try {
          console.log(
            `Cargando eventos para ${account.provider}: ${account.email} (${account.isOwn ? "propia" : "compartida"})`,
          )

          // Usar la nueva API que maneja cuentas compartidas
          const response = await fetch("/api/calendar/events/shared", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accountId: account.id,
              date: currentDate.toISOString(),
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error(`Error al cargar eventos para ${account.email}:`, errorData)

            if (response.status === 401) {
              toast({
                title: "Token expirado",
                description: `La cuenta ${account.email} necesita ser reconectada.`,
                variant: "destructive",
              })
            } else if (response.status === 403) {
              toast({
                title: "Sin permisos",
                description: `No tienes permisos para ver la cuenta ${account.email}.`,
                variant: "destructive",
              })
            }
            continue
          }

          const accountEvents = await response.json()
          console.log(`Eventos cargados para ${account.email}:`, accountEvents.length)

          // Agregar información de la cuenta a cada evento
          const eventsWithAccount = accountEvents.map((event: any) => ({
            ...event,
            accountEmail: account.email,
            accountName: account.name || (account.isOwn ? undefined : `${account.ownerName} - ${account.provider}`),
            provider: account.provider,
            color: account.color,
            start: new Date(event.start),
            end: new Date(event.end),
            isShared: !account.isOwn,
            ownerName: account.ownerName,
          }))

          allEvents.push(...eventsWithAccount)
        } catch (error) {
          console.error(`Error al cargar eventos para ${account.email}:`, error)
        }
      }

      console.log("Total de eventos cargados:", allEvents.length)
      setEvents(allEvents)

      if (allEvents.length === 0) {
        toast({
          title: "Sin eventos",
          description: "No se encontraron eventos para esta fecha.",
          variant: "default",
        })
      } else {
        const ownEvents = allEvents.filter((e) => !e.isShared).length
        const sharedEvents = allEvents.filter((e) => e.isShared).length

        if (sharedEvents > 0) {
          toast({
            title: "Eventos cargados",
            description: `${ownEvents} eventos propios y ${sharedEvents} eventos compartidos.`,
            variant: "default",
          })
        }
      }
    } catch (error) {
      console.error("Error general al cargar eventos:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(`Error al cargar los eventos: ${errorMessage}`)
      toast({
        title: "Error al cargar eventos",
        description: "No se pudieron cargar los eventos del calendario.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para navegar al día anterior
  const goToPreviousDay = () => {
    if (date) {
      const newDate = subDays(date, 1)
      setDate(newDate)
    }
  }

  // Función para navegar al día siguiente
  const goToNextDay = () => {
    if (date) {
      const newDate = addDays(date, 1)
      setDate(newDate)
    }
  }

  // Función para ir al día actual
  const goToToday = () => {
    setDate(new Date())
  }

  // Función para refrescar los eventos
  const refreshEvents = () => {
    if (!date) return

    setIsRefreshing(true)
    setError(null)

    loadEvents(date).finally(() => {
      setIsRefreshing(false)
    })
  }

  // Cargar eventos cuando cambia la fecha o las cuentas
  useEffect(() => {
    if (!date || calendarAccounts.length === 0) return
    loadEvents(date)
  }, [date, calendarAccounts])

  // Si la fecha aún no está inicializada, mostrar un estado de carga
  if (!date) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p>Cargando calendario...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filtrar eventos rechazados
  const filteredEvents = events.filter((event) => event.responseStatus !== "declined")

  // Separar eventos por proveedor y tipo
  const ownGoogleEvents = filteredEvents.filter((event) => event.provider === "google" && !event.isShared)
  const ownMicrosoftEvents = filteredEvents.filter((event) => event.provider === "microsoft" && !event.isShared)
  const sharedGoogleEvents = filteredEvents.filter((event) => event.provider === "google" && event.isShared)
  const sharedMicrosoftEvents = filteredEvents.filter((event) => event.provider === "microsoft" && event.isShared)

  const allGoogleEvents = [...ownGoogleEvents, ...sharedGoogleEvents]
  const allMicrosoftEvents = [...ownMicrosoftEvents, ...sharedMicrosoftEvents]

  const hasSharedEvents = sharedGoogleEvents.length > 0 || sharedMicrosoftEvents.length > 0

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <CardTitle>{date && format(date, "EEEE, d 'de' MMMM", { locale: es })}</CardTitle>
            {hasSharedEvents && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                Calendarios compartidos
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={refreshEvents} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </CardHeader>

        {date && <MealPlanDisplay date={date} />}

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {calendarAccounts.length === 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay cuentas de calendario conectadas. Conecta al menos una cuenta para ver tus eventos.
              </AlertDescription>
            </Alert>
          )}

          {hasSharedEvents && (
            <Alert className="mb-4">
              <Users className="h-4 w-4" />
              <AlertDescription>
                Estás viendo eventos de calendarios compartidos contigo. Los eventos compartidos aparecen marcados con
                el nombre del propietario.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="day">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="day">Vista de día</TabsTrigger>
              <TabsTrigger value="list">Lista de eventos</TabsTrigger>
            </TabsList>
            <TabsContent value="day">
              <DayView
                googleEvents={allGoogleEvents}
                microsoftEvents={allMicrosoftEvents}
                date={date}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="list">
              <EventList googleEvents={allGoogleEvents} microsoftEvents={allMicrosoftEvents} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
