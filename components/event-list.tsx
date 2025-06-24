"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, AlertCircle, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Event } from "@/lib/types"

interface EventListProps {
  googleEvents: Event[]
  microsoftEvents: Event[]
  isLoading: boolean
}

export function EventList({ googleEvents, microsoftEvents, isLoading }: EventListProps) {
  // Combinar y ordenar todos los eventos por hora de inicio
  const allEvents = [
    ...googleEvents.map((e) => ({ ...e, source: "google" })),
    ...microsoftEvents.map((e) => ({ ...e, source: "microsoft" })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime())

  // Función para obtener el color del evento basado en el proveedor o color personalizado
  function getEventColor(event: Event): string {
    if (event.color) return event.color
    return event.provider === "google" ? "#4285F4" : "#7B83EB"
  }

  // Función para calcular la duración del evento
  function getEventDuration(start: Date, end: Date): string {
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.floor(durationMs / 60000)

    if (durationMinutes < 60) {
      return `${durationMinutes} min`
    } else {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (allEvents.length === 0) {
    return (
      <div>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay eventos programados para este día. Verifica que tu cuenta tenga eventos en el calendario o prueba con
            otra fecha.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {allEvents.map((event, index) => {
          const eventColor = getEventColor(event)
          const duration = getEventDuration(event.start, event.end)
          const timeString = `${event.start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${event.end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`

          return (
            <Card
              key={index}
              className="overflow-hidden"
              style={{ borderLeftColor: eventColor, borderLeftWidth: "4px" }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg">{event.title}</h3>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {duration}
                      </div>
                    </div>

                    <div className="flex justify-between items-start mt-2">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{event.accountName || event.accountEmail}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{timeString}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                      {event.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.responseStatus && (
                        <div className="flex items-center text-sm text-muted-foreground justify-end md:justify-start">
                          <span className="font-medium mr-1">Estado:</span>
                          <span>
                            {event.responseStatus === "accepted"
                              ? "Aceptado"
                              : event.responseStatus === "tentative"
                                ? "Tentativo"
                                : event.responseStatus === "declined"
                                  ? "Rechazado"
                                  : "Sin respuesta"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )
}
