import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"

// Clave secreta para JWT (debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || "calendario_unificado_secret_key"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Se requiere nombre de usuario y contraseña" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar el usuario
    const user = await User.findOne({ username })
    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Actualizar la fecha de último inicio de sesión
    user.lastLogin = new Date()
    await user.save()

    // Crear token JWT
    const token = sign(
      {
        id: user._id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Crear respuesta con cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 },
    )

    // Establecer cookie con el token
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
