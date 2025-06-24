import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"

export async function POST() {
  try {
    await connectToDatabase()

    console.log("=== FORZANDO ARREGLO DE RELACIONES ===")

    // Buscar usuarios específicos
    const gmailUser = await User.findOne({ email: "lucas.castillo@gmail.com" })
    const inveraUser = await User.findOne({ email: "lucas.castillo@invera.com.ar" })

    if (!gmailUser || !inveraUser) {
      return NextResponse.json({ error: "No se encontraron ambos usuarios" }, { status: 404 })
    }

    console.log("Usuarios encontrados:")
    console.log(`Gmail: ${gmailUser._id} - ${gmailUser.email}`)
    console.log(`Invera: ${inveraUser._id} - ${inveraUser.email}`)

    // FORZAR las relaciones

    // 1. El usuario de invera fue invitado por gmail
    inveraUser.invitedBy = gmailUser._id.toString()
    inveraUser.sharedCalendars = [gmailUser._id.toString()]

    // 2. El usuario de gmail puede ver calendarios de invera
    gmailUser.sharedCalendars = [inveraUser._id.toString()]

    // Guardar cambios
    await inveraUser.save()
    await gmailUser.save()

    // Marcar invitación como aceptada
    await Invitation.updateOne(
      {
        inviterEmail: "lucas.castillo@gmail.com",
        email: "lucas.castillo@invera.com.ar",
      },
      {
        status: "accepted",
        acceptedAt: new Date(),
      },
    )

    console.log("✅ Relaciones forzadas:")
    console.log(`Gmail sharedCalendars: ${JSON.stringify(gmailUser.sharedCalendars)}`)
    console.log(`Invera invitedBy: ${inveraUser.invitedBy}`)
    console.log(`Invera sharedCalendars: ${JSON.stringify(inveraUser.sharedCalendars)}`)

    return NextResponse.json({
      success: true,
      message: "Relaciones forzadas correctamente",
      gmail: {
        id: gmailUser._id,
        email: gmailUser.email,
        sharedCalendars: gmailUser.sharedCalendars,
      },
      invera: {
        id: inveraUser._id,
        email: inveraUser.email,
        invitedBy: inveraUser.invitedBy,
        sharedCalendars: inveraUser.sharedCalendars,
      },
    })
  } catch (error) {
    console.error("Error forzando arreglo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
