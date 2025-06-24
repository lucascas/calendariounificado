import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"

export async function POST() {
  try {
    await connectToDatabase()

    console.log("=== ARREGLO MANUAL COMPLETO ===")

    // Buscar los usuarios específicos
    const gmailUser = await User.findOne({ email: "lucas.castillo@gmail.com" })
    const inveraUser = await User.findOne({ email: "lucas.castillo@invera.com.ar" })

    if (!gmailUser || !inveraUser) {
      return NextResponse.json({ error: "No se encontraron los usuarios" }, { status: 404 })
    }

    console.log("✓ Usuarios encontrados:")
    console.log(`  Gmail: ${gmailUser.email} (ID: ${gmailUser._id})`)
    console.log(`  Invera: ${inveraUser.email} (ID: ${inveraUser._id})`)

    // Establecer relaciones bidireccionales
    // 1. Invera fue invitado por Gmail
    inveraUser.invitedBy = gmailUser._id.toString()
    if (!inveraUser.sharedCalendars) inveraUser.sharedCalendars = []
    if (!inveraUser.sharedCalendars.includes(gmailUser._id.toString())) {
      inveraUser.sharedCalendars.push(gmailUser._id.toString())
    }

    // 2. Gmail puede ver calendarios de Invera
    if (!gmailUser.sharedCalendars) gmailUser.sharedCalendars = []
    if (!gmailUser.sharedCalendars.includes(inveraUser._id.toString())) {
      gmailUser.sharedCalendars.push(inveraUser._id.toString())
    }

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

    console.log("✅ Relaciones establecidas:")
    console.log(`  ${inveraUser.email} - invitedBy: ${inveraUser.invitedBy}`)
    console.log(`  ${inveraUser.email} - sharedCalendars: ${JSON.stringify(inveraUser.sharedCalendars)}`)
    console.log(`  ${gmailUser.email} - sharedCalendars: ${JSON.stringify(gmailUser.sharedCalendars)}`)

    return NextResponse.json({
      success: true,
      message: "Relaciones establecidas manualmente",
      details: {
        gmail: {
          email: gmailUser.email,
          sharedCalendars: gmailUser.sharedCalendars,
          calendarAccounts: gmailUser.calendarAccounts?.length || 0,
        },
        invera: {
          email: inveraUser.email,
          invitedBy: inveraUser.invitedBy,
          sharedCalendars: inveraUser.sharedCalendars,
          calendarAccounts: inveraUser.calendarAccounts?.length || 0,
        },
      },
    })
  } catch (error) {
    console.error("Error en arreglo manual:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
