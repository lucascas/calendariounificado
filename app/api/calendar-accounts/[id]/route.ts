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

// DELETE: Eliminar una cuenta de calendario
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const accountId = params.id
    if (!accountId) {
      return NextResponse.json({ error: "ID de cuenta no proporcionado" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar el usuario
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar si el usuario tiene cuentas de calendario
    if (!user.calendarAccounts || user.calendarAccounts.length === 0) {
      return NextResponse.json({ error: "No hay cuentas de calendario para eliminar" }, { status: 404 })
    }

    // Filtrar la cuenta a eliminar
    const initialLength = user.calendarAccounts.length
    user.calendarAccounts = user.calendarAccounts.filter((account: any) => account.id !== accountId)

    // Verificar si se eliminó alguna cuenta
    if (user.calendarAccounts.length === initialLength) {
      return NextResponse.json({ error: "Cuenta de calendario no encontrada" }, { status: 404 })
    }

    // Guardar los cambios
    await user.save()

    return NextResponse.json({
      success: true,
      accounts: user.calendarAccounts,
    })
  } catch (error) {
    console.error("Error al eliminar cuenta de calendario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
