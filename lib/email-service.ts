// Servicio de envío de emails
// En un entorno de producción, usarías un servicio como SendGrid, Mailgun, etc.

interface InvitationEmailData {
  to: string
  inviterName: string
  inviterEmail: string
  invitationUrl: string
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  try {
    console.log("Enviando email de invitación:", data)

    // En desarrollo, solo logueamos el email
    // En producción, aquí integrarías con tu servicio de email preferido

    const emailContent = `
      Hola,

      ${data.inviterName} (${data.inviterEmail}) te ha invitado a unirte a Calendario Unificado.

      Calendario Unificado te permite ver todos tus calendarios de Google y Microsoft en un solo lugar.

      Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente enlace:
      ${data.invitationUrl}

      Esta invitación expirará en 7 días.

      ¡Esperamos verte pronto!

      El equipo de Calendario Unificado
    `

    console.log("=== EMAIL DE INVITACIÓN ===")
    console.log(`Para: ${data.to}`)
    console.log(`De: ${data.inviterName} (${data.inviterEmail})`)
    console.log(`URL de invitación: ${data.invitationUrl}`)
    console.log("Contenido:")
    console.log(emailContent)
    console.log("=========================")

    // Simular envío exitoso
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // TODO: Implementar envío real de email
    // Ejemplo con SendGrid:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    //
    // const msg = {
    //   to: data.to,
    //   from: 'noreply@calendariounificado.com',
    //   subject: `${data.inviterName} te ha invitado a Calendario Unificado`,
    //   text: emailContent,
    //   html: generateHtmlEmail(data)
    // }
    //
    // await sgMail.send(msg)
  } catch (error) {
    console.error("Error al enviar email de invitación:", error)
    throw new Error("No se pudo enviar el email de invitación")
  }
}

function generateHtmlEmail(data: InvitationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invitación a Calendario Unificado</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4285F4; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #4285F4; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Calendario Unificado</h1>
        </div>
        <div class="content">
          <h2>¡Has sido invitado!</h2>
          <p>Hola,</p>
          <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) te ha invitado a unirte a Calendario Unificado.</p>
          <p>Calendario Unificado te permite ver todos tus calendarios de Google y Microsoft en un solo lugar.</p>
          <p>Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
          <a href="${data.invitationUrl}" class="button">Aceptar invitación</a>
          <p><small>Esta invitación expirará en 7 días.</small></p>
          <p>¡Esperamos verte pronto!</p>
        </div>
        <div class="footer">
          <p>El equipo de Calendario Unificado</p>
        </div>
      </div>
    </body>
    </html>
  `
}
