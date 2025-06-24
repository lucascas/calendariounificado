import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { connectToDatabase } from "@/lib/db/mongodb"
import { User } from "@/lib/db/models/user"
import { authConfig } from "@/lib/auth-config"

export async function GET() {
  try {
    // Obtener el token de autenticación
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth_token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar el token
    const decoded = verify(authToken, authConfig.jwt.secret) as { id: string }
    const userId = decoded.id

    // Conectar a la base de datos
    await connectToDatabase()

    // Obtener el usuario actual
    const currentUser = await User.findById(userId)
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    console.log(`=== Cargando cuentas para usuario: ${currentUser.email} ===`)
    console.log(`Usuario ID: ${currentUser._id}`)
    console.log(`Invitado por: ${currentUser.invitedBy}`)
    console.log(`Puede ver calendarios de: ${JSON.stringify(currentUser.sharedCalendars)}`)

    const allAccounts = []

    // 1. Agregar las cuentas propias del usuario
    const ownAccounts = (currentUser.calendarAccounts || []).map((account: any) => ({
      ...account.toObject(),
      isOwn: true,
      canEdit: true,
      ownerName: currentUser.name || currentUser.email,
      ownerEmail: currentUser.email,
      ownerId: currentUser._id.toString(),
    }))

    allAccounts.push(...ownAccounts)
    console.log(`✓ Cuentas propias agregadas: ${ownAccounts.length}`)

    // 2. Agregar cuentas de usuarios cuyos calendarios puede ver
    const sharedCalendarUserIds = currentUser.sharedCalendars || []
    console.log(`Buscando cuentas compartidas de ${sharedCalendarUserIds.length} usuarios`)

    for (const sharedUserId of sharedCalendarUserIds) {
      try {
        console.log(`  Buscando usuario: ${sharedUserId}`)
        const sharedUser = await User.findById(sharedUserId)

        if (sharedUser && sharedUser.calendarAccounts && sharedUser.calendarAccounts.length > 0) {
          console.log(`  ✓ Usuario encontrado: ${sharedUser.email} con ${sharedUser.calendarAccounts.length} cuentas`)

          const sharedAccounts = sharedUser.calendarAccounts.map((account: any) => ({
            ...account.toObject(),
            isOwn: false,
            canEdit: false,
            ownerName: sharedUser.name || sharedUser.email,
            ownerEmail: sharedUser.email,
            ownerId: sharedUser._id.toString(),
            // Cambiar el ID para evitar conflictos
            id: `shared_${sharedUser._id}_${account.id}`,
            originalAccountId: account.id,
          }))

          allAccounts.push(...sharedAccounts)
          console.log(`  ✓ Agregadas ${sharedAccounts.length} cuentas compartidas de ${sharedUser.email}`)
        } else {
          console.log(`  ✗ Usuario ${sharedUserId} no encontrado o sin cuentas`)
        }
      } catch (error) {
        console.error(`  ✗ Error al cargar usuario ${sharedUserId}:`, error)
      }
    }

    console.log(`=== Resumen ===`)
    console.log(`Total de cuentas: ${allAccounts.length}`)
    console.log(`Cuentas propias: ${allAccounts.filter((a) => a.isOwn).length}`)
    console.log(`Cuentas compartidas: ${allAccounts.filter((a) => !a.isOwn).length}`)

    // Debug: mostrar detalles de cuentas compartidas
    const sharedAccounts = allAccounts.filter((a) => !a.isOwn)
    if (sharedAccounts.length > 0) {
      console.log(`Detalles de cuentas compartidas:`)
      sharedAccounts.forEach((acc, index) => {
        console.log(`  ${index + 1}. ${acc.email} (${acc.provider}) - Propietario: ${acc.ownerEmail}`)
      })
    }

    return NextResponse.json({ accounts: allAccounts })
  } catch (error) {
    console.error("Error al obtener cuentas de calendario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
