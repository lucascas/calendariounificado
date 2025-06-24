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
    const ownAccounts = (currentUser.calendarAccounts || []).map((account: any) => ({
      ...account,
      isOwn: true,
      canEdit: true,
    }))
    allAccounts.push(...ownAccounts)

    // 2. Buscar usuarios que este usuario ha invitado (y que han aceptado)
    const invitedUsers = await User.find({
      invitedBy: userId,
      isActive: true,
    })

    for (const invitedUser of invitedUsers) {
      const sharedAccounts = (invitedUser.calendarAccounts || []).map((account: any) => ({
        ...account,
        id: `shared_${invitedUser._id}_${account.id}`, // ID único para cuenta compartida
        isOwn: false,
        canEdit: false,
        ownerName: invitedUser.name || invitedUser.username,
        ownerEmail: invitedUser.email,
        originalAccountId: account.id,
        originalOwnerId: invitedUser._id.toString(),
        name: account.name || `${invitedUser.name || invitedUser.username} - ${account.provider}`,
      }))
      allAccounts.push(...sharedAccounts)
    }

    // 3. Si este usuario fue invitado por alguien, agregar las cuentas del invitador
    if (currentUser.invitedBy) {
      const inviterUser = await User.findById(currentUser.invitedBy)
      if (inviterUser) {
        const inviterAccounts = (inviterUser.calendarAccounts || []).map((account: any) => ({
          ...account,
          id: `shared_${inviterUser._id}_${account.id}`, // ID único para cuenta compartida
          isOwn: false,
          canEdit: false,
          ownerName: inviterUser.name || inviterUser.username,
          ownerEmail: inviterUser.email,
          originalAccountId: account.id,
          originalOwnerId: inviterUser._id.toString(),
          name: account.name || `${inviterUser.name || inviterUser.username} - ${account.provider}`,
        }))
        allAccounts.push(...inviterAccounts)
      }
    }

    console.log(`Usuario ${currentUser.email} tiene acceso a ${allAccounts.length} cuentas de calendario`)
    console.log(`- Propias: ${ownAccounts.length}`)
    console.log(`- Compartidas: ${allAccounts.length - ownAccounts.length}`)

    return NextResponse.json({
      accounts: allAccounts,
    })
  } catch (error) {
    console.error("Error al obtener cuentas de calendario compartidas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
