import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { TokenService } from "@/lib/db/services/token-service"

export async function GET(request: Request) {
  try {
    // Obtener el token de autenticación
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth_token")?.value

    if (!authToken) {
      // En lugar de devolver un error 401, devolver una respuesta vacía con estado 200
      return NextResponse.json(
        {
          success: false,
          message: "No autenticado",
          expiringAccounts: [],
        },
        { status: 200 },
      )
    }

    // Verificar tokens que están por expirar
    try {
      const expiringAccounts = await TokenService.checkExpiringTokens(authToken)

      return NextResponse.json({
        success: true,
        expiringAccounts: expiringAccounts.map((account) => ({
          id: account.id,
          provider: account.provider,
          email: account.email,
          expiresAt: account.expiresAt,
        })),
      })
    } catch (tokenError) {
      console.error("Error al verificar tokens expirados:", tokenError)
      return NextResponse.json(
        {
          success: false,
          message: "Error al verificar tokens",
          expiringAccounts: [],
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Error al verificar tokens:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
        expiringAccounts: [],
      },
      { status: 200 }, // Devolver 200 en lugar de 500 para evitar errores en el cliente
    )
  }
}
