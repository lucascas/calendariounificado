import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { Invitation } from "@/lib/db/models/invitation"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token de invitación requerido" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar la invitación
    const invitation = await Invitation.findOne({ token })

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
    }

    // Verificar si la invitación ha expirado
    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired"
      await invitation.save()
      return NextResponse.json({ error: "La invitación ha expirado" }, { status: 410 })
    }

    // Verificar si la invitación ya fue aceptada
    if (invitation.status === "accepted") {
      return NextResponse.json({ error: "Esta invitación ya fue utilizada" }, { status: 409 })
    }

    // Devolver información de la invitación
    return NextResponse.json({
      valid: true,
      email: invitation.email,
      inviterName: invitation.inviterName,
      inviterEmail: invitation.inviterEmail,
    })
  } catch (error) {
    console.error("Error al validar invitación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
