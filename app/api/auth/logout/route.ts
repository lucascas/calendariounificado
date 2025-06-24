import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Crear respuesta
    const response = NextResponse.json({ success: true }, { status: 200 })

    // Eliminar la cookie de autenticación
    response.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error en logout:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
