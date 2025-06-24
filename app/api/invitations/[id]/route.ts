import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/db/mongodb"
import { Invitation } from "@/lib/db/models/invitation"
import { authConfig } from "@/lib/auth-config"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Obtener el token de autenticación
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth_token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar el token
    const decoded = verify(authToken, authConfig.jwt.secret) as { id: string }
    const inviterId = decoded.id

    const invitationId = params.id

    if (!invitationId) {
      return NextResponse.json({ error: "ID de invitación no proporcionado" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar la invitación y verificar que pertenece al usuario actual
    const invitation = await Invitation.findOne({
      _id: invitationId,
      inviterId: inviterId,
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
    }

    // Eliminar la invitación
    await Invitation.findByIdAndDelete(invitationId)

    return NextResponse.json({
      success: true,
      message: "Invitación eliminada correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar invitación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
