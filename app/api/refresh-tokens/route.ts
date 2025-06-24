import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { refreshGoogleToken, refreshMicrosoftToken } from "@/lib/token-refresh"

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

// POST: Refrescar todos los tokens del usuario
export async function POST(request: Request) {
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

    // Refrescar tokens para cada cuenta
    const results = {
      success: 0,
      failed: 0,
      accounts: [] as any[],
    }

    for (const account of user.calendarAccounts) {
      try {
        let updatedAccount = null

        if (account.provider === "google") {
          updatedAccount = await refreshGoogleToken(account)
        } else if (account.provider === "microsoft") {
          updatedAccount = await refreshMicrosoftToken(account)
        }

        if (updatedAccount) {
          // Actualizar la cuenta en la base de datos
          const accountIndex = user.calendarAccounts.findIndex((a: any) => a.id === account.id)
          if (accountIndex >= 0) {
            user.calendarAccounts[accountIndex] = updatedAccount
          }

          results.success++
          results.accounts.push({
            id: account.id,
            provider: account.provider,
            email: account.email,
            status: "refreshed",
            expiresAt: updatedAccount.expiresAt,
          })
        } else {
          results.failed++
          results.accounts.push({
            id: account.id,
            provider: account.provider,
            email: account.email,
            status: "failed",
          })
        }
      } catch (error) {
        console.error(`Error al refrescar token para cuenta ${account.id}:`, error)
        results.failed++
        results.accounts.push({
          id: account.id,
          provider: account.provider,
          email: account.email,
          status: "error",
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    // Guardar los cambios en la base de datos
    await user.save()

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error al refrescar tokens:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
