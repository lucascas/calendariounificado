import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth-config"

export async function GET() {
  const envStatus = {
    microsoft: {
      clientId: !!authConfig.microsoft.clientId,
      clientSecret: !!authConfig.microsoft.clientSecret,
      clientIdLength: authConfig.microsoft.clientId.length,
    },
    google: {
      clientId: !!authConfig.google.clientId,
      clientSecret: !!authConfig.google.clientSecret,
      clientIdLength: authConfig.google.clientId.length,
    },
    mongodb: !!process.env.MONGODB_URI,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  }

  return NextResponse.json({
    status: "Environment Variables Check",
    variables: envStatus,
    timestamp: new Date().toISOString(),
  })
}
