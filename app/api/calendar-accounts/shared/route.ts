import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { UserService } from "@/lib/db/services/user-service"
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

    // Obtener el usuario actual
    const currentUser = await UserService.getUserById(userId)
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    console.log(`Cargando cuentas para usuario: ${currentUser.email}`)
    console.log(`Usuario invitado por: ${currentUser.invitedBy}`)
    console.log(`Puede ver calendarios de: ${currentUser.sharedCalendars}`)

    const allAccounts = []

    // 1. Agregar las cuentas propias del usuario
    const ownAccounts = currentUser.calendarAccounts.map((account: any) => ({
      ...account,
      isOwn: true,
      ownerName: currentUser.name || currentUser.email,
      ownerId: currentUser._id.toString(),
    }))

    allAccounts.push(...ownAccounts)
    console.log(`Cuentas propias: ${ownAccounts.length}`)

    // 2. Agregar cuentas de usuarios que puede ver (usuarios que lo invitaron o que ha invitado)
    const sharedCalendarUserIds = currentUser.sharedCalendars || []

    for (const sharedUserId of sharedCalendarUserIds) {
      try {
        const sharedUser = await UserService.getUserById(sharedUserId)
        if (sharedUser && sharedUser.calendarAccounts) {
          const sharedAccounts = sharedUser.calendarAccounts.map((account: any) => ({
            ...account,
            isOwn: false,
            ownerName: sharedUser.name || sharedUser.email,
            ownerId: sharedUser._id.toString(),
            // Cambiar el ID para evitar conflictos
            id: `shared_${sharedUser._id}_${account.id}`,
          }))

          allAccounts.push(...sharedAccounts)
          console.log(`Cuentas compartidas de ${sharedUser.email}: ${sharedAccounts.length}`)
        }
      } catch (error) {
        console.error(`Error al cargar cuentas compartidas del usuario ${sharedUserId}:`, error)
      }
    }

    // 3. Agregar cuentas de usuarios que han sido invitados por este usuario
    const invitedUsers = await UserService.getUsersInvitedBy(userId)
    for (const invitedUser of invitedUsers) {
      try {
        if (invitedUser.calendarAccounts) {
          const invitedAccounts = invitedUser.calendarAccounts.map((account: any) => ({
            ...account,
            isOwn: false,
            ownerName: invitedUser.name || invitedUser.email,
            ownerId: invitedUser._id.toString(),
            // Cambiar el ID para evitar conflictos
            id: `invited_${invitedUser._id}_${account.id}`,
          }))

          allAccounts.push(...invitedAccounts)
          console.log(`Cuentas de usuario invitado ${invitedUser.email}: ${invitedAccounts.length}`)
        }
      } catch (error) {
        console.error(`Error al cargar cuentas del usuario invitado ${invitedUser._id}:`, error)
      }
    }

    console.log(`Total de cuentas devueltas: ${allAccounts.length}`)
    console.log(`Cuentas propias: ${allAccounts.filter((a) => a.isOwn).length}`)
    console.log(`Cuentas compartidas: ${allAccounts.filter((a) => !a.isOwn).length}`)

    return NextResponse.json({ accounts: allAccounts })
  } catch (error) {
    console.error("Error al obtener cuentas de calendario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
