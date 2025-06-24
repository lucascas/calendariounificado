import mongoose, { Schema, type Document } from "mongoose"
import type { CalendarAccount } from "./calendar-account"

// Interfaz para el documento de usuario
export interface IUser extends Document {
  username: string
  password?: string
  email: string
  name?: string
  authProvider: "local" | "google" | "microsoft"
  providerId?: string
  picture?: string
  calendarAccounts: CalendarAccount[]
  lastLogin?: Date
  invitedBy?: string // ID del usuario que lo invitó
  sharedCalendars?: string[] // IDs de usuarios cuyos calendarios puede ver
  isActive?: boolean
}

// Esquema de usuario
const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String }, // Opcional para usuarios OAuth
    email: { type: String, required: true, unique: true },
    name: { type: String },
    authProvider: {
      type: String,
      enum: ["local", "google", "microsoft"],
      default: "local",
    },
    providerId: { type: String }, // ID del proveedor OAuth
    picture: { type: String }, // URL de la imagen de perfil
    calendarAccounts: [
      {
        id: { type: String, required: true },
        provider: {
          type: String,
          enum: ["google", "microsoft"],
          required: true,
        },
        email: { type: String, required: true },
        name: { type: String },
        accessToken: { type: String, required: true },
        refreshToken: { type: String },
        expiresAt: { type: Number },
        lastRefreshed: { type: Number },
        color: { type: String },
        simulated: { type: Boolean, default: false },
      },
    ],
    lastLogin: { type: Date },
    invitedBy: { type: String }, // ID del usuario que lo invitó
    sharedCalendars: [{ type: String }], // IDs de usuarios cuyos calendarios puede ver
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

// Crear índices para mejorar el rendimiento
UserSchema.index({ username: 1 })
UserSchema.index({ email: 1 })
UserSchema.index({ providerId: 1 })
UserSchema.index({ invitedBy: 1 })

// Crear el modelo si no existe
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
