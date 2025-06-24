import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"
import { authConfig } from "@/lib/auth-config"

export async function POST() {
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

    console.log("=== ARREGLANDO RELACIONES MANUALMENTE ===")

    // Buscar la invitación pendiente
    const pendingInvitation = await Invitation.findOne({
      inviterEmail: "lucas.castillo@gmail.com",
      email: "lucas.castillo@invera.com.ar",
      status: "pending",
    })

    if (pendingInvitation) {
      console.log("✓ Invitación pendiente encontrada:", pendingInvitation.id)

      // Buscar los usuarios
      const inviterUser = await User.findOne({ email: "lucas.castillo@gmail.com" })
      const invitedUser = await User.findOne({ email: "lucas.castillo@invera.com.ar" })

      if (inviterUser && invitedUser) {
        console.log("✓ Ambos usuarios encontrados")

        // Establecer la relación: el usuario invitado fue invitado por el invitador
        invitedUser.invitedBy = inviterUser._id.toString()
        if (!invitedUser.sharedCalendars) {
          invitedUser.sharedCalendars = []
        }
        if (!invitedUser.sharedCalendars.includes(inviterUser._id.toString())) {
          invitedUser.sharedCalendars.push(inviterUser._id.toString())
        }
        await invitedUser.save()
        console.log(`✓ ${invitedUser.email} ahora puede ver calendarios de ${inviterUser.email}`)

        // Establecer la relación inversa: el invitador puede ver calendarios del invitado
        if (!inviterUser.sharedCalendars) {
          inviterUser.sharedCalendars = []
        }
        if (!inviterUser.sharedCalendars.includes(invitedUser._id.toString())) {
          inviterUser.sharedCalendars.push(invitedUser._id.toString())
        }
        await inviterUser.save()
        console.log(`✓ ${inviterUser.email} ahora puede ver calendarios de ${invitedUser.email}`)

        // Marcar la invitación como aceptada
        pendingInvitation.status = "accepted"
        pendingInvitation.acceptedAt = new Date()
        await pendingInvitation.save()
        console.log("✓ Invitación marcada como aceptada")

        return NextResponse.json({
          success: true,
          message: "Relaciones establecidas correctamente",
          details: {
            inviter: {
              email: inviterUser.email,
              sharedCalendars: inviterUser.sharedCalendars,
            },
            invited: {
              email: invitedUser.email,
              invitedBy: invitedUser.invitedBy,
              sharedCalendars: invitedUser.sharedCalendars,
            },
          },
        })
      } else {
        return NextResponse.json({ error: "No se encontraron ambos usuarios" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: "No se encontró la invitación pendiente" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error arreglando relaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
