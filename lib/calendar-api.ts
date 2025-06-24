// Importar el servicio de renovación de tokens
import { ensureValidToken } from "./token-refresh"
import type { CalendarAccount } from "./types"

// Función para obtener eventos de Google Calendar
export async function fetchGoogleEvents(date: Date, account: CalendarAccount) {
  try {
    console.log("Iniciando fetchGoogleEvents para fecha:", date.toISOString())
    console.log("Cuenta:", account.email)

    // Si no hay datos de autenticación, devolver un array vacío
    if (!account) {
      console.error("No hay datos de autenticación para Google Calendar")
      return []
    }

    // Verificar y refrescar el token si es necesario
    const validAccount = await ensureValidToken(account)
    if (!validAccount) {
      throw new Error("No se pudo obtener un token válido. Por favor, vuelve a conectar tu cuenta de Google.")
    }

    // Usar la cuenta con el token actualizado
    account = validAccount

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Formatear fechas para la API de Google
    const timeMin = startOfDay.toISOString()
    const timeMax = endOfDay.toISOString()

    console.log(`Fetching Google events from ${timeMin} to ${timeMax}`)
    console.log("Using access token:", account.accessToken.substring(0, 10) + "...")

    // Hacer la petición a la API de Google Calendar
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
    console.log("Google Calendar API URL:", apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
    })

    console.log("Google Calendar API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response from Google Calendar API:", response.status, errorText)

      if (response.status === 401) {
        throw new Error("Sesión expirada. Por favor, vuelve a conectar tu cuenta de Google.")
      }

      throw new Error(`Error al obtener eventos de Google Calendar: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Google Calendar API response:", data)

    // Si no hay items, devolver un array vacío
    if (!data.items || !Array.isArray(data.items)) {
      console.log("No se encontraron eventos en Google Calendar")
      return []
    }

    // Transformar los eventos al formato que espera nuestra aplicación
    return data.items.map((event: any) => {
      // Buscar el estado de asistencia del usuario actual
      let responseStatus = "needsAction"
      if (event.attendees) {
        const currentUserAttendee = event.attendees.find(
          (attendee: any) => attendee.self === true || attendee.email === account.email,
        )
        if (currentUserAttendee) {
          responseStatus = currentUserAttendee.responseStatus || "needsAction"
        }
      } else if (event.creator && event.creator.email === account.email) {
        // Si el usuario es el creador y no hay attendees, asumimos que asiste
        responseStatus = "accepted"
      }

      return {
        id: event.id,
        title: event.summary || "Sin título",
        start: new Date(event.start.dateTime || `${event.start.date}T00:00:00`),
        end: new Date(event.end.dateTime || `${event.end.date}T23:59:59`),
        location: event.location,
        description: event.description,
        responseStatus: responseStatus,
      }
    })
  } catch (error) {
    console.error("Error fetching Google events:", error)
    throw error
  }
}

// Función para obtener eventos de Microsoft Teams/Outlook
export async function fetchMicrosoftEvents(date: Date, account: CalendarAccount) {
  try {
    console.log("Iniciando fetchMicrosoftEvents para fecha:", date.toISOString())
    console.log("Cuenta:", account.email)

    // Si no hay datos de autenticación, devolver un array vacío
    if (!account) {
      console.error("No hay datos de autenticación para Microsoft Calendar")
      return []
    }

    // Verificar y refrescar el token si es necesario
    const validAccount = await ensureValidToken(account)
    if (!validAccount) {
      throw new Error("No se pudo obtener un token válido. Por favor, vuelve a conectar tu cuenta de Microsoft.")
    }

    // Usar la cuenta con el token actualizado
    account = validAccount

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Formatear fechas para Microsoft Graph API
    const startDateTime = startOfDay.toISOString()
    const endDateTime = endOfDay.toISOString()

    console.log(`Fetching Microsoft events from ${startDateTime} to ${endDateTime}`)
    console.log("Using access token:", account.accessToken.substring(0, 10) + "...")

    // Hacer la petición a Microsoft Graph API
    const apiUrl = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$orderby=start/dateTime`
    console.log("Microsoft Graph API URL:", apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    })

    console.log("Microsoft Graph API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response from Microsoft Graph API:", response.status, errorText)

      if (response.status === 401) {
        throw new Error("Sesión expirada. Por favor, vuelve a conectar tu cuenta de Microsoft.")
      }

      throw new Error(`Error al obtener eventos de Microsoft Calendar: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Microsoft Graph API response:", data)

    // Si no hay value o no es un array, devolver un array vacío
    if (!data.value || !Array.isArray(data.value)) {
      console.log("No se encontraron eventos en Microsoft Calendar")
      return []
    }

    // Transformar los eventos al formato que espera nuestra aplicación
    return data.value.map((event: any) => {
      // Buscar el estado de asistencia del usuario actual
      let responseStatus = "needsAction"
      if (event.attendees) {
        const currentUserAttendee = event.attendees.find(
          (attendee: any) => attendee.emailAddress.address === account.email,
        )
        if (currentUserAttendee) {
          responseStatus = currentUserAttendee.status.response || "needsAction"
        }
      } else if (event.organizer && event.organizer.emailAddress.address === account.email) {
        // Si el usuario es el organizador y no hay attendees, asumimos que asiste
        responseStatus = "accepted"
      }

      return {
        id: event.id,
        title: event.subject || "Sin título",
        start: new Date(event.start.dateTime + "Z"),
        end: new Date(event.end.dateTime + "Z"),
        location: event.location?.displayName,
        description: event.bodyPreview,
        responseStatus: responseStatus,
      }
    })
  } catch (error) {
    console.error("Error fetching Microsoft events:", error)
    throw error
  }
}
