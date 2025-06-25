// Configuración de autenticación para uso interno
export const authConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/google/callback`,
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    endpoints: {
      auth: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
      userInfo: "https://www.googleapis.com/oauth2/v2/userinfo",
    },
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/microsoft/callback`,
    scopes: ["User.Read", "Calendars.Read", "offline_access"],
    endpoints: {
      auth: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userInfo: "https://graph.microsoft.com/v1.0/me",
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || "calendario_unificado_secret_key",
    expiresIn: "7d",
  },
}

export function validateAuthConfig() {
  const errors: string[] = []

  if (!authConfig.google.clientId) {
    errors.push("GOOGLE_CLIENT_ID no está configurado")
  }

  if (!authConfig.google.clientSecret) {
    errors.push("GOOGLE_CLIENT_SECRET no está configurado")
  }

  if (!authConfig.microsoft.clientId) {
    errors.push("MICROSOFT_CLIENT_ID no está configurado")
  }

  if (!authConfig.microsoft.clientSecret) {
    errors.push("MICROSOFT_CLIENT_SECRET no está configurado")
  }

  if (!process.env.MONGODB_URI) {
    errors.push("MONGODB_URI no está configurado")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export default authConfig
