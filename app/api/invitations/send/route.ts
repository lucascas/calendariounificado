import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"
import { authConfig } from "@/lib/auth-config"
import { sendInvitationEmail } from "@/lib/email-service"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
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

    // Obtener el email del cuerpo de la solicitud
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Verificar que el usuario que invita existe
    const inviter = await User.findById(inviterId)
    if (!inviter) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar si el email ya está registrado
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Este email ya está registrado en el sistema" }, { status: 409 })
    }

    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await Invitation.findOne({
      email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })

    if (existingInvitation) {
      return NextResponse.json({ error: "Ya existe una invitación pendiente para este email" }, { status: 409 })
    }

    // Crear la invitación
    const invitationToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días

    const invitation = new Invitation({
      email,
      inviterId,
      inviterName: inviter.name || inviter.username,
      inviterEmail: inviter.email,
      token: invitationToken,
      status: "pending",
      expiresAt,
    })

    await invitation.save()

    // Construir la URL de invitación
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${new URL(request.url).protocol}//${new URL(request.url).host}`
    const invitationUrl = `${baseUrl}/register?invitation=${invitationToken}`

    // Enviar el email de invitación
    await sendInvitationEmail({
      to: email,
      inviterName: inviter.name || inviter.username,
      inviterEmail: inviter.email,
      invitationUrl,
    })

    return NextResponse.json({
      success: true,
      message: "Invitación enviada correctamente",
      invitationUrl, // Devolver la URL para mostrarla en el frontend
    })
  } catch (error) {
    console.error("Error al enviar invitación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
