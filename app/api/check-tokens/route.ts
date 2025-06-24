import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"

// Clave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || "calendario_unificado_secret_key"

// Obtener el ID de usuario del token
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string }
    return decoded.id
  } catch (error) {
    console.error("Error al verificar token:", error)
    return null
  }
}

// GET: Verificar el estado de los tokens
export async function GET(request: Request) {
  try {
    // Obtener el token de la cookie
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el ID de usuario del token
    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar el usuario y sus cuentas de calendario
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar el estado de los tokens para cada cuenta
    const results = {
      accounts: [] as any[],
    }

    for (const account of user.calendarAccounts) {
      const now = Date.now()
      const expiresAt = account.expiresAt || 0
      const timeRemaining = expiresAt - now

      results.accounts.push({
        id: account.id,
        provider: account.provider,
        email: account.email,
        status: timeRemaining > 0 ? "valid" : "expired",
        expiresAt: account.expiresAt,
        timeRemaining: timeRemaining > 0 ? Math.floor(timeRemaining / 1000) : 0,
        hasRefreshToken: !!account.refreshToken,
      })
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error al verificar tokens:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
