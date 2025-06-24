import mongoose, { Schema, type Document } from "mongoose"
import { CalendarAccountSchema, type CalendarAccount } from "./calendar-account"

// Interfaz para el documento de usuario
export interface IUser extends Document {
  username: string
  password?: string // Opcional para usuarios OAuth
  email: string
  name?: string
  authProvider: "local" | "google" | "microsoft"
  providerId?: string // ID del proveedor OAuth
  picture?: string // URL de la imagen de perfil
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  calendarAccounts: CalendarAccount[]
  invitedBy?: string // ID del usuario que invitó a este usuario
  sharedCalendars?: string[] // IDs de usuarios cuyos calendarios puede ver
  allowedViewers?: string[] // IDs de usuarios que pueden ver mis calendarios
}

// Esquema de usuario
const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String }, // No requerido para OAuth
    email: { type: String, required: true, unique: true },
    name: { type: String },
    authProvider: {
      type: String,
      enum: ["local", "google", "microsoft"],
      default: "local",
    },
    providerId: { type: String }, // ID único del proveedor OAuth
    picture: { type: String }, // URL de imagen de perfil
    lastLogin: { type: Date },
    calendarAccounts: [CalendarAccountSchema],
    invitedBy: { type: String }, // ID del usuario que invitó
    sharedCalendars: [{ type: String }], // Calendarios que puedo ver
    allowedViewers: [{ type: String }], // Usuarios que pueden ver mis calendarios
  },
  { timestamps: true },
)

// Crear índices para mejorar el rendimiento
UserSchema.index({ email: 1 })
UserSchema.index({ providerId: 1 })
UserSchema.index({ username: 1 })
UserSchema.index({ invitedBy: 1 })
UserSchema.index({ sharedCalendars: 1 })
UserSchema.index({ allowedViewers: 1 })

// Crear el modelo si no existe
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
