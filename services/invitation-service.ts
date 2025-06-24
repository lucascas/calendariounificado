import { connectToDatabase } from "../lib/db/mongodb"
import { Invitation, type IInvitation } from "../lib/db/models/invitation"
import { v4 as uuidv4 } from "uuid"

export const InvitationService = {
  /**
   * Crea una invitación y devuelve la entidad guardada.
   */
  async createInvitation({
    email,
    invitedBy,
    expiresAt,
  }: {
    email: string
    invitedBy: string
    expiresAt?: Date
  }): Promise<IInvitation> {
    await connectToDatabase()

    const code = uuidv4()

    const invitation = new Invitation({
      email,
      invitedBy,
      code,
      expiresAt: expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 días por defecto
    })

    await invitation.save()
    return invitation
  },

  /**
   * Obtiene una invitación válida por su código.
   * Devuelve `null` si el código no existe o ya expiró.
   */
  async getInvitationByCode(code: string): Promise<IInvitation | null> {
    await connectToDatabase()

    const invitation = await Invitation.findOne({ code })
    if (!invitation) return null
    if (invitation.expiresAt && invitation.expiresAt < new Date()) return null

    return invitation
  },

  /**
   * Marca la invitación como usada cuando un usuario la acepta.
   */
  async acceptInvitation(code: string, acceptedBy: string): Promise<boolean> {
    await connectToDatabase()

    const invitation = await Invitation.findOne({ code })
    if (!invitation) return false
    if (invitation.expiresAt && invitation.expiresAt < new Date()) return false

    invitation.acceptedBy = acceptedBy
    invitation.acceptedAt = new Date()
    await invitation.save()
    return true
  },
}
