import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"
import { authConfig } from "@/lib/auth-config"

export async function GET() {
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

    // Conectar a la base de datos
    await connectToDatabase()

    // Obtener el usuario actual
    const currentUser = await User.findById(userId)
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener todos los usuarios para debug
    const allUsers = await User.find({}, { password: 0 }).lean()

    // Obtener todas las invitaciones
    const allInvitations = await Invitation.find({}).lean()

    // Buscar usuarios relacionados
    const invitedByUser = currentUser.invitedBy ? await User.findById(currentUser.invitedBy) : null
    const usersInvitedByMe = await User.find({ invitedBy: userId })

    const debugInfo = {
      currentUser: {
        id: currentUser._id,
        email: currentUser.email,
        name: currentUser.name,
        invitedBy: currentUser.invitedBy,
        sharedCalendars: currentUser.sharedCalendars,
        calendarAccountsCount: currentUser.calendarAccounts?.length || 0,
      },
      invitedByUser: invitedByUser
        ? {
            id: invitedByUser._id,
            email: invitedByUser.email,
            name: invitedByUser.name,
            calendarAccountsCount: invitedByUser.calendarAccounts?.length || 0,
          }
        : null,
      usersInvitedByMe: usersInvitedByMe.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        calendarAccountsCount: user.calendarAccounts?.length || 0,
      })),
      allUsers: allUsers.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        invitedBy: user.invitedBy,
        sharedCalendars: user.sharedCalendars,
        calendarAccountsCount: user.calendarAccounts?.length || 0,
      })),
      invitations: allInvitations.map((inv) => ({
        id: inv._id,
        inviterEmail: inv.inviterEmail,
        email: inv.email,
        status: inv.status,
        createdAt: inv.createdAt,
        acceptedAt: inv.acceptedAt,
      })),
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Error en debug:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
