import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"
import { authConfig } from "@/lib/auth-config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, email, name, invitationToken } = body

    console.log("Registro de usuario:", { username, email, invitationToken })

    // Validar datos requeridos
    if (!username || !password || !email) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "El usuario o email ya existe" }, { status: 400 })
    }

    let inviterUserId = null
    let invitation = null

    // Si hay un token de invitación, validarlo
    if (invitationToken) {
      invitation = await Invitation.findOne({
        token: invitationToken,
        status: "pending",
        expiresAt: { $gt: new Date() },
      })

      if (!invitation) {
        return NextResponse.json({ error: "Invitación inválida o expirada" }, { status: 400 })
      }

      // Verificar que el email coincida con la invitación
      if (invitation.email !== email) {
        return NextResponse.json({ error: "El email no coincide con la invitación" }, { status: 400 })
      }

      inviterUserId = invitation.inviterId
      console.log(`Usuario registrándose con invitación de: ${invitation.inviterEmail}`)
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el nuevo usuario
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      name: name || username,
      authProvider: "local",
      calendarAccounts: [],
      invitedBy: inviterUserId, // Establecer quién lo invitó
      sharedCalendars: inviterUserId ? [inviterUserId] : [], // Puede ver calendarios del invitador
      isActive: true,
    })

    await newUser.save()
    console.log(`Usuario creado: ${newUser.email} (ID: ${newUser._id})`)

    // Si fue invitado, actualizar las relaciones
    if (inviterUserId && invitation) {
      // Marcar la invitación como aceptada
      invitation.status = "accepted"
      invitation.acceptedAt = new Date()
      await invitation.save()

      // Actualizar el usuario que invitó para que pueda ver los calendarios del nuevo usuario
      const inviterUser = await User.findById(inviterUserId)
      if (inviterUser) {
        if (!inviterUser.sharedCalendars) {
          inviterUser.sharedCalendars = []
        }
        if (!inviterUser.sharedCalendars.includes(newUser._id.toString())) {
          inviterUser.sharedCalendars.push(newUser._id.toString())
        }
        await inviterUser.save()
        console.log(`Relación establecida: ${inviterUser.email} puede ver calendarios de ${newUser.email}`)
      }
    }

    // Crear token JWT
    const token = sign({ id: newUser._id.toString() }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    })

    // Crear la respuesta con la cookie
    const response = NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
      },
    })

    // Establecer la cookie del token
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 días
    })

    return response
  } catch (error) {
    console.error("Error en el registro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
