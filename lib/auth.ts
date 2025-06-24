// Configuración de autenticación para Google y Microsoft

// Credenciales de Google (guardar en variables de entorno)
export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/google/callback`,
  scopes: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
}

// Credenciales de Microsoft (guardar en variables de entorno)
export const microsoftConfig = {
  clientId: process.env.MICROSOFT_CLIENT_ID || "",
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/microsoft/callback`,
  scopes: ["Calendars.Read", "User.Read"],
}
