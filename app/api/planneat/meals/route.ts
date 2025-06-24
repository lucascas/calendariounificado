import { NextResponse } from "next/server"

// API key para PlannEat
const PLANNEAT_API_KEY = "3ce66fd8814a5015735b78c2e50a4ad3463ca9e9031e890d19d5d4dea37f59fb"

export async function GET(request: Request) {
  try {
    // Obtener los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Se requieren los parámetros startDate y endDate" }, { status: 400 })
    }

    // Hacer la solicitud a la API de PlannEat
    const response = await fetch(
      `https://planneat.vercel.app/api/public/meals?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          "x-api-key": PLANNEAT_API_KEY,
        },
        // Importante: no redirigir automáticamente para evitar problemas con CORS
        redirect: "manual",
      },
    )

    // Si la respuesta no es exitosa, devolver un error
    if (!response.ok) {
      console.error("Error en la respuesta de PlannEat:", response.status, response.statusText)
      return NextResponse.json(
        { error: `Error al obtener datos de PlannEat: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    // Obtener los datos de la respuesta
    const data = await response.json()

    // Devolver los datos al cliente
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
