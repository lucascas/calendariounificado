import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { authConfig } from "@/auth.config"
import { UserService } from "@/services/user-service"
import { InvitationService } from "@/services/invitation-service"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Iniciando obtención de cuentas compartidas")

    // Obtener token de autenticación
    const token = request.cookies.get("auth_token")?.value
    console.log("🔍 [DEBUG] Token encontrado:", !!token)

    if (!token) {
      console.log("❌ [DEBUG] No hay token de autenticación")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar y decodificar el token
    const decoded = verify(token, authConfig.jwt.secret) as { id: string; email: string }
    console.log("🔍 [DEBUG] Usuario decodificado:", { id: decoded.id, email: decoded.email })

    // Obtener usuario de la base de datos
    const user = await UserService.getUserById(decoded.id)
    console.log("🔍 [DEBUG] Usuario encontrado en DB:", !!user)
    console.log("🔍 [DEBUG] Email del usuario:", user?.email)
    console.log("🔍 [DEBUG] Cuentas propias del usuario:", user?.calendarAccounts?.length || 0)

    if (!user) {
      console.log("❌ [DEBUG] Usuario no encontrado en la base de datos")
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener cuentas propias del usuario
    const ownAccounts = (user.calendarAccounts || []).map((account) => ({
      ...account,
      isOwn: true,
      canEdit: true,
      ownerName: user.name || user.email,
      ownerEmail: user.email,
    }))

    console.log("🔍 [DEBUG] Cuentas propias procesadas:", ownAccounts.length)
    ownAccounts.forEach((acc, index) => {
      console.log(`   ${index + 1}. ${acc.email} (${acc.provider})`)
    })

    // Obtener cuentas compartidas (invitaciones aceptadas)
    const acceptedInvitations = await InvitationService.getAcceptedInvitationsForUser(user.email)
    console.log("🔍 [DEBUG] Invitaciones aceptadas:", acceptedInvitations.length)

    const sharedAccounts = []
    for (const invitation of acceptedInvitations) {
      const inviterUser = await UserService.getUserByEmail(invitation.inviterEmail)
      if (inviterUser) {
        const inviterAccounts = (inviterUser.calendarAccounts || []).map((account) => ({
          ...account,
          isOwn: false,
          canEdit: false,
          ownerName: inviterUser.name || inviterUser.email,
          ownerEmail: inviterUser.email,
        }))
        sharedAccounts.push(...inviterAccounts)
      }
    }

    console.log("🔍 [DEBUG] Cuentas compartidas procesadas:", sharedAccounts.length)

    // Combinar todas las cuentas
    const allAccounts = [...ownAccounts, ...sharedAccounts]
    console.log("🔍 [DEBUG] Total de cuentas a devolver:", allAccounts.length)

    return NextResponse.json({
      accounts: allAccounts,
      debug: {
        userId: decoded.id,
        userEmail: decoded.email,
        ownAccountsCount: ownAccounts.length,
        sharedAccountsCount: sharedAccounts.length,
        totalAccounts: allAccounts.length,
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG] Error en obtención de cuentas:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
