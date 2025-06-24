export interface CalendarAccount {
  id: string
  provider: "google" | "microsoft"
  email: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  simulated?: boolean
  color?: string
  name?: string // Nombre personalizado
  // Nuevos campos para cuentas compartidas
  ownerName?: string // Nombre del propietario (para cuentas compartidas)
  ownerEmail?: string // Email del propietario (para cuentas compartidas)
  isOwn?: boolean // Si es cuenta propia o compartida
  canEdit?: boolean // Si se puede editar la cuenta
  originalAccountId?: string // ID original de la cuenta (para compartidas)
  originalOwnerId?: string // ID del propietario original (para compartidas)
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
  accountName?: string // Nombre personalizado de la cuenta
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction" | string
  // Nuevos campos para eventos compartidos
  isShared?: boolean // Si el evento viene de una cuenta compartida
  ownerName?: string // Nombre del propietario del calendario (para eventos compartidos)
}
