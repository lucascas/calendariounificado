import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { Invitation } from "@/lib/db/models/invitation"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, email, name, invitationToken } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Se requiere nombre de usuario y contraseña" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    let invitation = null
    let inviterId = null

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

      inviterId = invitation.inviterId
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "El nombre de usuario o email ya está en uso" }, { status: 409 })
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el nuevo usuario
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      name,
      calendarAccounts: [],
      invitedBy: inviterId, // Asociar con el usuario que invitó
      sharedCalendars: inviterId ? [inviterId] : [], // Puede ver los calendarios del invitador
      allowedViewers: [], // Inicialmente nadie puede ver sus calendarios
    })

    await newUser.save()

    // Si había una invitación, marcarla como aceptada Y actualizar permisos del invitador
    if (invitation && inviterId) {
      invitation.status = "accepted"
      invitation.acceptedAt = new Date()
      await invitation.save()

      // Permitir que el invitador vea los calendarios del nuevo usuario
      await User.findByIdAndUpdate(inviterId, {
        $addToSet: { allowedViewers: newUser._id.toString() },
      })

      console.log(`Usuario ${newUser.email} registrado e invitado por ${inviterId}`)
      console.log(`${newUser.email} puede ver calendarios de: [${inviterId}]`)
      console.log(`${inviterId} puede ver calendarios de: [${newUser._id}]`)
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
        },
        invitedBy: inviterId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
