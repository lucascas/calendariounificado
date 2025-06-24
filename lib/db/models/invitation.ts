import mongoose, { Schema, type Document } from "mongoose"

// Interfaz para el documento de invitación
export interface IInvitation extends Document {
  email: string
  inviterId: string
  inviterName: string
  inviterEmail: string
  token: string
  status: "pending" | "accepted" | "expired"
  createdAt: Date
  expiresAt: Date
  acceptedAt?: Date
}

// Esquema de invitación
const InvitationSchema: Schema = new Schema(
  {
    email: { type: String, required: true },
    inviterId: { type: String, required: true },
    inviterName: { type: String, required: true },
    inviterEmail: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
  },
  { timestamps: true },
)

// Crear índices para mejorar el rendimiento
InvitationSchema.index({ email: 1 })
InvitationSchema.index({ token: 1 })
InvitationSchema.index({ inviterId: 1 })
InvitationSchema.index({ expiresAt: 1 })

// Crear el modelo si no existe
export const Invitation = mongoose.models.Invitation || mongoose.model<IInvitation>("Invitation", InvitationSchema)
