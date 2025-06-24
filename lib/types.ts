export interface CalendarAccount {
  id: string
  provider: "google" | "microsoft"
  email: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  simulated?: boolean
  color?: string
  name?: string // Nuevo campo para el nombre personalizado
}

export interface Event {
  id: string
  title: string
  start: Date
  end: Date
  location?: string
  description?: string
  calendarId?: string
  provider?: "google" | "microsoft"
  accountEmail?: string
  color?: string
  accountName?: string // Nuevo campo para el nombre personalizado de la cuenta
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction" | string
}
