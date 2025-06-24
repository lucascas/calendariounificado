import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, email, name } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Se requiere nombre de usuario y contraseña" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 409 })
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
    })

    await newUser.save()

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
