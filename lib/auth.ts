//
// Configuración centralizada de OAuth para Google y Microsoft
//

// --- GOOGLE ---------------------------------------------------------
export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/auth/google/callback`,
  scopes: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
}

// --- MICROSOFT ------------------------------------------------------
export const microsoftConfig = {
  clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/auth/microsoft/callback`,
  scopes: ["Calendars.Read", "User.Read"],
}

/**
 * Cliente/objeto de acceso rápido a Microsoft Graph.
 *  - Lo exportamos con nombre `microsoft` porque el build lo reclama.
 *  - Si ya tienes un helper real, sustitúyelo aquí.
 */
export const microsoft = {
  config: microsoftConfig,
}

/* Exports adicionales que ya usabas en otras partes del proyecto */
