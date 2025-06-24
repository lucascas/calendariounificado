import { Schema } from "mongoose"

// Interfaz para la cuenta de calendario
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
  lastRefreshed?: number // Nueva propiedad para rastrear la última actualización
}

// Esquema para la cuenta de calendario
export const CalendarAccountSchema: Schema = new Schema({
  id: { type: String, required: true },
  provider: { type: String, enum: ["google", "microsoft"], required: true },
  email: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Number },
  simulated: { type: Boolean, default: false },
  color: { type: String },
  name: { type: String },
  lastRefreshed: { type: Number }, // Nueva propiedad para rastrear la última actualización
})
