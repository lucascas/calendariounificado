/**
 * Archivo requerido por el build de Vercel.
 * Debe existir en la raíz y exportar CON NOMBRE `authConfig`.
 *
 * Ajusta los valores según tu entorno real (clientId, clientSecret, etc.).
 */
export const authConfig = {
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    },
  },
  callbacks: {},
}

/* Exportación por defecto opcional, por si algún código la usa. */
export default authConfig
