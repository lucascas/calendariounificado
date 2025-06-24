import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { UserService } from "@/lib/db/services/user-service"
import { authConfig } from "@/lib/auth-config"

export async function GET(request: Request) {
  try {
    // Obtener el token de la cookie
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
    }

    // Parsear las cookies
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((cookie) => {
        const [name, ...value] = cookie.split("=")
        return [name, value.join("=")]
      }),
    )

    const token = cookies["auth_token"]

    if (!token) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
    }

    try {
      // Verificar el token
      const decoded = verify(token, authConfig.jwt.secret) as { id: string; email: string; name?: string }

      // Obtener el usuario de la base de datos
      const user = await UserService.getUserById(decoded.id)

      if (!user) {
        return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
      }

      // Devolver la información del usuario (sin la contraseña)
      return NextResponse.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          authProvider: user.authProvider,
          picture: user.picture,
        },
        authenticated: true,
      })
    } catch (error) {
      // Token inválido
      console.error("Error al verificar token JWT:", error)
      return NextResponse.json({ user: null, authenticated: false, error: "Token inválido" }, { status: 200 })
    }
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json({ user: null, authenticated: false, error: "Error interno" }, { status: 500 })
  }
}
