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

// POST: Obtener eventos de una cuenta (propia o compartida)
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

    const body = await request.json()
    const { accountId, date } = body

    if (!accountId || !date) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar el usuario actual
    const currentUser = await User.findById(userId)
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    let targetUser = currentUser
    let targetAccountId = accountId

    // Si es una cuenta compartida (empieza con "shared_")
    if (accountId.startsWith("shared_")) {
      const parts = accountId.split("_")
      if (parts.length >= 3) {
        const ownerId = parts[1]
        targetAccountId = parts.slice(2).join("_")

        // Verificar que el usuario actual tiene permisos para ver esta cuenta
        const hasPermission =
          currentUser.invitedBy?.toString() === ownerId || // El usuario fue invitado por el propietario
          (await User.exists({ _id: ownerId, invitedBy: userId })) // El propietario fue invitado por el usuario actual

        if (!hasPermission) {
          return NextResponse.json({ error: "Sin permisos para acceder a esta cuenta" }, { status: 403 })
        }

        // Buscar el usuario propietario de la cuenta
        targetUser = await User.findById(ownerId)
        if (!targetUser) {
          return NextResponse.json({ error: "Propietario de la cuenta no encontrado" }, { status: 404 })
        }
      }
    }

    // Buscar la cuenta de calendario
    const account = targetUser.calendarAccounts?.find((acc: any) => acc.id === targetAccountId)
    if (!account) {
      return NextResponse.json({ error: "Cuenta de calendario no encontrada" }, { status: 404 })
    }

    // Verificar que la cuenta tenga un token válido
    if (!account.accessToken) {
      return NextResponse.json({ error: "Cuenta sin token de acceso" }, { status: 401 })
    }

    // Cargar eventos usando la API existente
    const eventsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calendar/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth_token=${token}`, // Pasar el token para la autenticación
        },
        body: JSON.stringify({
          accountId: targetAccountId,
          date: date,
          // Pasar información adicional para cuentas compartidas
          targetUserId: targetUser._id.toString(),
        }),
      },
    )

    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json()
      return NextResponse.json(errorData, { status: eventsResponse.status })
    }

    const events = await eventsResponse.json()
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error al obtener eventos compartidos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
