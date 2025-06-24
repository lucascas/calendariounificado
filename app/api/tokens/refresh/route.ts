import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { TokenService } from "@/lib/db/services/token-service"
import { refreshGoogleToken, refreshMicrosoftToken } from "@/lib/token-refresh"
import type { CalendarAccount } from "@/lib/types"

export async function POST(request: Request) {
  try {
    // Obtener el token de autenticación
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth_token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el cuerpo de la solicitud
    const body = await request.json()
    const { accountId } = body

    if (!accountId) {
      return NextResponse.json({ error: "ID de cuenta no proporcionado" }, { status: 400 })
    }

    // Obtener todas las cuentas del usuario
    const accounts = await TokenService.getCalendarAccounts(authToken)

    // Buscar la cuenta específica
    const account = accounts.find((acc) => acc.id === accountId)

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 })
    }

    // Refrescar el token según el proveedor
    let updatedAccount: CalendarAccount | null = null

    if (account.provider === "google") {
      updatedAccount = await refreshGoogleToken(account)
    } else if (account.provider === "microsoft") {
      updatedAccount = await refreshMicrosoftToken(account)
    }

    if (!updatedAccount) {
      return NextResponse.json(
        {
          error: "No se pudo refrescar el token",
          needsReconnect: true,
        },
        { status: 400 },
      )
    }

    // Guardar la cuenta actualizada en la base de datos
    const success = await TokenService.updateCalendarAccount(authToken, updatedAccount)

    if (!success) {
      return NextResponse.json({ error: "Error al guardar el token actualizado" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      account: {
        id: updatedAccount.id,
        provider: updatedAccount.provider,
        email: updatedAccount.email,
        expiresAt: updatedAccount.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error al refrescar token:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
