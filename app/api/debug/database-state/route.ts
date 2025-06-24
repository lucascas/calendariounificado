import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"

export async function GET() {
  try {
    await connectToDatabase()

    // Obtener todos los usuarios con todos sus campos
    const users = await User.find({}).lean()
    const invitations = await Invitation.find({}).lean()

    console.log("=== ESTADO COMPLETO DE LA BASE DE DATOS ===")

    users.forEach((user, index) => {
      console.log(`Usuario ${index + 1}:`)
      console.log(`  Email: ${user.email}`)
      console.log(`  ID: ${user._id}`)
      console.log(`  invitedBy: ${user.invitedBy}`)
      console.log(`  sharedCalendars: ${JSON.stringify(user.sharedCalendars)}`)
      console.log(`  calendarAccounts: ${user.calendarAccounts?.length || 0}`)
      console.log(`  ---`)
    })

    console.log("Invitaciones:")
    invitations.forEach((inv, index) => {
      console.log(`  ${index + 1}. ${inv.inviterEmail} -> ${inv.email} (${inv.status})`)
    })

    return NextResponse.json({
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        invitedBy: user.invitedBy,
        sharedCalendars: user.sharedCalendars,
        calendarAccountsCount: user.calendarAccounts?.length || 0,
        calendarAccounts: user.calendarAccounts?.map((acc) => ({
          id: acc.id,
          email: acc.email,
          provider: acc.provider,
        })),
      })),
      invitations: invitations.map((inv) => ({
        id: inv._id,
        inviterEmail: inv.inviterEmail,
        email: inv.email,
        status: inv.status,
        createdAt: inv.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error obteniendo estado de la base de datos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
