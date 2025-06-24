import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db/mongodb"

export async function GET() {
  try {
    await connectToDatabase()
    return NextResponse.json({ status: "connected", message: "Conexión a MongoDB exitosa" })
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error)
    return NextResponse.json(
      { status: "error", message: "Error al conectar a MongoDB", error: String(error) },
      { status: 500 },
    )
  }
}
