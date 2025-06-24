import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { UserService } from "@/lib/db/services/user-service"
import { authConfig } from "@/lib/auth-config"

// Función para obtener eventos de Google Calendar
async function fetchGoogleEvents(accessToken: string, date: Date) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const timeMin = startOfDay.toISOString()
    const timeMax = endOfDay.toISOString()

    console.log(`Obteniendo eventos de Google para ${timeMin} - ${timeMax}`)

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error de Google Calendar API:", response.status, errorText)
      throw new Error(`Google Calendar API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Google Calendar devolvió ${data.items?.length || 0} eventos`)

    if (!data.items) {
      return []
    }

    return data.items.map((event: any) => ({
      id: event.id,
      title: event.summary || "Sin título",
      start: event.start.dateTime || `${event.start.date}T00:00:00`,
      end: event.end.dateTime || `${event.end.date}T23:59:59`,
      location: event.location,
      description: event.description,
      responseStatus: event.attendees?.find((a: any) => a.self)?.responseStatus || "accepted",
    }))
  } catch (error) {
    console.error("Error al obtener eventos de Google:", error)
    throw error
  }
}

// Función para obtener eventos de Microsoft Calendar
async function fetchMicrosoftEvents(accessToken: string, date: Date) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const startDateTime = startOfDay.toISOString()
    const endDateTime = endOfDay.toISOString()

    console.log(`Obteniendo eventos de Microsoft para ${startDateTime} - ${endDateTime}`)

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$orderby=start/dateTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.timezone="UTC"',
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error de Microsoft Graph API:", response.status, errorText)
      throw new Error(`Microsoft Graph API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Microsoft Graph devolvió ${data.value?.length || 0} eventos`)

    if (!data.value) {
      return []
    }

    return data.value.map((event: any) => ({
      id: event.id,
      title: event.subject || "Sin título",
      start: event.start.dateTime + "Z",
      end: event.end.dateTime + "Z",
      location: event.location?.displayName,
      description: event.bodyPreview,
      responseStatus:
        event.attendees?.find((a: any) => a.emailAddress.address === event.organizer?.emailAddress?.address)?.status
          ?.response || "accepted",
    }))
  } catch (error) {
    console.error("Error al obtener eventos de Microsoft:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    // Obtener el token de autenticación
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth_token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar el token
    const decoded = verify(authToken, authConfig.jwt.secret) as { id: string }
    const userId = decoded.id

    // Obtener los datos de la solicitud
    const body = await request.json()
    const { accountId, date } = body

    if (!accountId || !date) {
      return NextResponse.json({ error: "accountId y date son requeridos" }, { status: 400 })
    }

    // Obtener las cuentas del usuario
    const user = await UserService.getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Buscar la cuenta específica
    const account = user.calendarAccounts.find((acc: any) => acc.id === accountId)
    if (!account) {
      return NextResponse.json({ error: "Cuenta de calendario no encontrada" }, { status: 404 })
    }

    // Verificar que el token no haya expirado
    if (account.expiresAt && account.expiresAt < Date.now()) {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 })
    }

    const eventDate = new Date(date)
    let events = []

    // Obtener eventos según el proveedor
    if (account.provider === "google") {
      events = await fetchGoogleEvents(account.accessToken, eventDate)
    } else if (account.provider === "microsoft") {
      events = await fetchMicrosoftEvents(account.accessToken, eventDate)
    } else {
      return NextResponse.json({ error: "Proveedor no soportado" }, { status: 400 })
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error al obtener eventos:", error)

    if (error instanceof Error && error.message.includes("401")) {
      return NextResponse.json({ error: "Token de acceso inválido o expirado" }, { status: 401 })
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
