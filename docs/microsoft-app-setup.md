# Configuración de Aplicación Microsoft para Cuentas Personales

## Pasos para crear una nueva aplicación:

1. Ve a: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade

2. Configuración inicial:
   - **Nombre**: "Calendario Unificado" (o el nombre que prefieras)
   - **Tipos de cuenta compatibles**: Selecciona "Cuentas en cualquier directorio organizativo y cuentas personales de Microsoft"
   - **URI de redirección**: 
     - Tipo: Web
     - URL: https://tu-dominio.com/api/auth/microsoft/callback

3. Después de crear:
   - Copia el "Application (client) ID"
   - Ve a "Certificates & secrets" → "New client secret"
   - Copia el valor del secret (solo se muestra una vez)

4. Configurar permisos:
   - Ve a "API permissions"
   - Add permission → Microsoft Graph → Delegated permissions
   - Agregar: Calendars.Read, User.Read

## Variables de entorno:
\`\`\`env
MICROSOFT_CLIENT_ID=tu-nuevo-client-id
MICROSOFT_CLIENT_SECRET=tu-nuevo-client-secret
