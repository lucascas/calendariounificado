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

// GET: Obtener todas las cuentas de calendario del usuario
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

    return NextResponse.json({
      accounts: user.calendarAccounts || [],
    })
  } catch (error) {
    console.error("Error al obtener cuentas de calendario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST: Añadir o actualizar una cuenta de calendario
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

    // Obtener los datos de la cuenta
    const body = await request.json()
    const { account } = body

    if (!account || !account.provider || !account.email) {
      return NextResponse.json({ error: "Datos de cuenta incompletos" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar el usuario
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Inicializar el array de cuentas si no existe
    if (!user.calendarAccounts) {
      user.calendarAccounts = []
    }

    // Verificar si la cuenta ya existe
    const existingIndex = user.calendarAccounts.findIndex(
      (a: any) => a.id === account.id || (a.provider === account.provider && a.email === account.email),
    )

    if (existingIndex >= 0) {
      // Actualizar la cuenta existente
      user.calendarAccounts[existingIndex] = account
    } else {
      // Añadir nueva cuenta
      user.calendarAccounts.push(account)
    }

    // Guardar los cambios
    await user.save()

    return NextResponse.json({
      success: true,
      accounts: user.calendarAccounts,
    })
  } catch (error) {
    console.error("Error al añadir/actualizar cuenta de calendario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
