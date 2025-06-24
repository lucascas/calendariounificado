import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/db/mongodb"
import { Invitation } from "@/lib/db/models/invitation"
import { authConfig } from "@/lib/auth-config"

export async function GET(request: Request) {
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

    // Conectar a la base de datos
    await connectToDatabase()

    // Obtener todas las invitaciones del usuario actual
    const invitations = await Invitation.find({ inviterId })
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación, más recientes primero
      .lean()

    return NextResponse.json({
      success: true,
      invitations,
    })
  } catch (error) {
    console.error("Error al obtener invitaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
