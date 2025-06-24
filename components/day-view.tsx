"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Event } from "@/lib/types"
import { usePreferences } from "@/hooks/use-preferences"

interface DayViewProps {
  googleEvents: Event[]
  microsoftEvents: Event[]
  date: Date
  isLoading: boolean
}

interface TimeSlot {
  time: string
  events: Event[]
}

export function DayView({ googleEvents, microsoftEvents, date, isLoading }: DayViewProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const allEvents = [...googleEvents, ...microsoftEvents]
  const hasEvents = allEvents.length > 0
  const { preferences } = usePreferences()

  useEffect(() => {
    const { startHour, endHour } = preferences

    const startHourParts = startHour.split(":")
    const endHourParts = endHour.split(":")

    const startHourNum = Number.parseInt(startHourParts[0], 10)
    const endHourNum = Number.parseInt(endHourParts[0], 10)

    const slots: TimeSlot[] = []

    for (let hour = startHourNum; hour <= endHourNum; hour++) {
      for (const minute of [0, 30]) {
        if (hour === endHourNum && minute > Number.parseInt(endHourParts[1], 10)) {
          continue
        }

        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const eventsAtTime = findEventsAtTime(allEvents, hour, minute)

        slots.push({
          time: timeString,
          events: eventsAtTime,
        })
      }
    }

    setTimeSlots(slots)
  }, [googleEvents, microsoftEvents, date, preferences])

  function findEventsAtTime(events: Event[], hour: number, minute: number): Event[] {
    const targetTime = new Date(date)
    targetTime.setHours(hour, minute, 0, 0)

    return events.filter((event) => {
      return targetTime >= event.start && targetTime < event.end
    })
  }

  function getEventColor(event: Event): string {
    if (event.color) return event.color
    return event.provider === "google" ? "#4285F4" : "#7B83EB"
  }

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
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (!hasEvents) {
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
      <div className="space-y-1">
        {timeSlots.map((slot, index) => (
          <div key={index} className="py-2 border-t">
            <div className="flex">
              <div className="w-16 text-sm text-muted-foreground">{slot.time}</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {slot.events.length === 0 ? (
                  <div className="h-6"></div>
                ) : (
                  slot.events.map((event, eventIndex) => {
                    const eventColor = getEventColor(event)
                    const duration = getEventDuration(event.start, event.end)
                    const timeString = `${event.start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${event.end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`

                    return (
                      <TooltipProvider key={`${event.id}-${eventIndex}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="p-2 rounded-md flex-1 min-w-[200px] max-w-[300px] cursor-pointer"
                              style={{ backgroundColor: `${eventColor}20`, borderLeft: `3px solid ${eventColor}` }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {duration}
                                </div>
                              </div>

                              <div className="flex justify-between items-start mt-1">
                                <div className="text-xs text-muted-foreground">
                                  {event.accountName || event.accountEmail || ""}
                                </div>
                                <div className="text-xs text-muted-foreground">{timeString}</div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="p-2">
                              <p className="font-bold">{event.title}</p>
                              <p className="text-sm">
                                <span className="font-medium">Inicio:</span>{" "}
                                {event.start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Fin:</span>{" "}
                                {event.end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Duración:</span> {duration}
                              </p>
                              {event.location && (
                                <p className="text-sm">
                                  <span className="font-medium">Ubicación:</span> {event.location}
                                </p>
                              )}
                              {event.responseStatus && (
                                <p className="text-sm">
                                  <span className="font-medium">Estado:</span>{" "}
                                  {event.responseStatus === "accepted"
                                    ? "Aceptado"
                                    : event.responseStatus === "tentative"
                                      ? "Tentativo"
                                      : event.responseStatus === "declined"
                                        ? "Rechazado"
                                        : "Sin respuesta"}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
