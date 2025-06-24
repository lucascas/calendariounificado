import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
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

    // Obtener todos los usuarios
    const allUsers = await User.find({})

    console.log("=== ARREGLANDO RELACIONES ===")

    for (const user of allUsers) {
      console.log(`Usuario: ${user.email}`)
      console.log(`  - ID: ${user._id}`)
      console.log(`  - Invitado por: ${user.invitedBy}`)
      console.log(`  - Calendarios compartidos actuales: ${JSON.stringify(user.sharedCalendars)}`)

      // Si este usuario fue invitado por alguien
      if (user.invitedBy) {
        // Asegurar que puede ver los calendarios del invitador
        if (!user.sharedCalendars) {
          user.sharedCalendars = []
        }
        if (!user.sharedCalendars.includes(user.invitedBy)) {
          user.sharedCalendars.push(user.invitedBy)
          console.log(`  ✓ Agregado ${user.invitedBy} a sharedCalendars`)
        }

        // Asegurar que el invitador puede ver los calendarios de este usuario
        const inviter = await User.findById(user.invitedBy)
        if (inviter) {
          if (!inviter.sharedCalendars) {
            inviter.sharedCalendars = []
          }
          if (!inviter.sharedCalendars.includes(user._id.toString())) {
            inviter.sharedCalendars.push(user._id.toString())
            await inviter.save()
            console.log(`  ✓ Agregado ${user._id} a sharedCalendars de ${inviter.email}`)
          }
        }

        await user.save()
      }
    }

    console.log("=== RELACIONES ARREGLADAS ===")

    return NextResponse.json({ success: true, message: "Relaciones arregladas" })
  } catch (error) {
    console.error("Error arreglando relaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
