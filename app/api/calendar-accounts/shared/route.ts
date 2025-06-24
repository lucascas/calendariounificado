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

// GET: Obtener todas las cuentas de calendario (propias y compartidas)
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

    // Buscar el usuario actual
    const currentUser = await User.findById(userId)
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const allAccounts = []

    // 1. Agregar las cuentas propias del usuario
    if (currentUser.calendarAccounts && currentUser.calendarAccounts.length > 0) {
      const ownAccounts = currentUser.calendarAccounts.map((account: any) => ({
        ...account.toObject(),
        ownerName: currentUser.name || currentUser.username,
        ownerEmail: currentUser.email,
        isOwn: true,
        canEdit: true,
      }))
      allAccounts.push(...ownAccounts)
    }

    // 2. Agregar las cuentas de usuarios cuyos calendarios puede ver
    if (currentUser.sharedCalendars && currentUser.sharedCalendars.length > 0) {
      for (const sharedUserId of currentUser.sharedCalendars) {
        const sharedUser = await User.findById(sharedUserId)
        if (sharedUser && sharedUser.calendarAccounts) {
          const sharedAccounts = sharedUser.calendarAccounts.map((account: any) => ({
            ...account.toObject(),
            id: `shared_${sharedUserId}_${account.id}`, // ID único para cuentas compartidas
            ownerName: sharedUser.name || sharedUser.username,
            ownerEmail: sharedUser.email,
            isOwn: false,
            canEdit: false,
            originalAccountId: account.id,
            originalOwnerId: sharedUserId,
          }))
          allAccounts.push(...sharedAccounts)
        }
      }
    }

    console.log(`Usuario ${currentUser.email} tiene acceso a ${allAccounts.length} cuentas de calendario`)
    console.log(
      `Propias: ${allAccounts.filter((a) => a.isOwn).length}, Compartidas: ${allAccounts.filter((a) => !a.isOwn).length}`,
    )

    return NextResponse.json({
      accounts: allAccounts,
    })
  } catch (error) {
    console.error("Error al obtener cuentas de calendario compartidas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
