"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventList } from "@/components/event-list"
import { DayView } from "@/components/day-view"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
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

  // Función para generar eventos de ejemplo
  const generateExampleEvents = (currentDate: Date): Event[] => {
    const today = new Date(currentDate)

    // Crear eventos de ejemplo para Google
    const googleExampleEvents = [
      {
        id: "g1",
        title: "Reunión de equipo",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
        location: "Google Meet",
        description: "Reunión semanal de equipo",
        provider: "google" as const,
        accountEmail: "ejemplo@gmail.com",
        responseStatus: "accepted",
      },
      {
        id: "g2",
        title: "Almuerzo con cliente",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30),
        location: "Restaurante Centro",
        description: "Discutir propuesta de proyecto",
        provider: "google" as const,
        accountEmail: "ejemplo@gmail.com",
        responseStatus: "accepted",
      },
      {
        id: "g3",
        title: "Revisión de proyecto",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0),
        description: "Revisar avances del sprint",
        provider: "google" as const,
        accountEmail: "ejemplo2@gmail.com",
        responseStatus: "declined",
      },
    ]

    // Crear eventos de ejemplo para Microsoft
    const microsoftExampleEvents = [
      {
        id: "m1",
        title: "Llamada con proveedor",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
        location: "Microsoft Teams",
        description: "Discutir términos del contrato",
        provider: "microsoft" as const,
        accountEmail: "ejemplo@outlook.com",
        responseStatus: "accepted",
      },
      {
        id: "m2",
        title: "Presentación de ventas",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
        location: "Sala de conferencias",
        description: "Presentar nuevos productos",
        provider: "microsoft" as const,
        accountEmail: "ejemplo@outlook.com",
        responseStatus: "tentative",
      },
      {
        id: "m3",
        title: "Capacitación",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 30),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0),
        description: "Capacitación sobre nuevas herramientas",
        provider: "microsoft" as const,
        accountEmail: "ejemplo@outlook.com",
        responseStatus: "declined",
      },
    ]

    return [...googleExampleEvents, ...microsoftExampleEvents]
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

    // Recargar los eventos
    loadEvents(date).finally(() => {
      setIsRefreshing(false)
    })
  }

  // Función para cargar eventos
  const loadEvents = async (currentDate: Date) => {
    setIsLoading(true)
    setError(null)
    setEvents([])

    try {
      console.log("Cargando eventos para la fecha:", currentDate.toDateString())
      console.log("Cuentas disponibles:", calendarAccounts.length)

      // Generar eventos de ejemplo para demostración
      const exampleEvents = generateExampleEvents(currentDate)
      setEvents(exampleEvents)

      // Simular un pequeño retraso para mostrar el estado de carga
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error("General error loading events:", error)
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

  // Cargar eventos cuando cambia la fecha
  useEffect(() => {
    if (!date) return
    loadEvents(date)
  }, [date])

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

  // Filtrar eventos rechazados, pero solo si tienen explícitamente responseStatus="declined"
  const filteredEvents = events.filter((event) => event.responseStatus !== "declined")

  // Separar eventos por proveedor
  const googleEvents = filteredEvents.filter((event) => event.provider === "google")
  const microsoftEvents = filteredEvents.filter((event) => event.provider === "microsoft")

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
          <CardTitle>{date && format(date, "EEEE, d 'de' MMMM", { locale: es })}</CardTitle>
          <Button variant="outline" size="sm" onClick={refreshEvents} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </CardHeader>

        {/* Añadir el componente MealPlanDisplay aquí, entre el CardHeader y el CardContent */}
        {date && <MealPlanDisplay date={date} />}

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="day">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="day">Vista de día</TabsTrigger>
              <TabsTrigger value="list">Lista de eventos</TabsTrigger>
            </TabsList>
            <TabsContent value="day">
              <DayView
                googleEvents={googleEvents}
                microsoftEvents={microsoftEvents}
                date={date}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="list">
              <EventList googleEvents={googleEvents} microsoftEvents={microsoftEvents} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
