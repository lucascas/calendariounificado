// Archivo de configuración de autenticación
// Exporta EXACTAMENTE lo que el build system espera

const authConfig = {
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
    },
  },
}

// Named export (lo que busca el sistema)
module.exports = { authConfig }

// También como export default por si acaso
module.exports.default = authConfig
