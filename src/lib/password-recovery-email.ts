export type PasswordRecoveryEmail = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] || character;
  });
}

export function buildPasswordRecoveryEmail(recoveryUrl: string): PasswordRecoveryEmail {
  const safeRecoveryUrl = escapeHtml(recoveryUrl);
  const subject = "Restablece tu contraseña · Chetesaí Fitness+";

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${subject}</title>
  </head>
  <body style="margin:0;background:#f5f6f2;color:#07182b;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Crea una nueva contraseña para tu cuenta de Chetesaí Fitness+.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f6f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e3e7df;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="background:#07182b;padding:26px 32px;color:#ffffff;">
                <div style="font-size:23px;font-weight:800;letter-spacing:-0.4px;">Chetesaí <span style="color:#8ee500;">Fitness+</span></div>
                <div style="margin-top:6px;color:#cbd4dc;font-size:13px;">Acceso seguro a tu cuenta</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 32px;">
                <div style="display:inline-block;margin-bottom:16px;color:#4f8500;font-size:12px;font-weight:800;letter-spacing:1.8px;">RECUPERAR ACCESO</div>
                <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;letter-spacing:-0.8px;color:#07182b;">Restablece tu contraseña</h1>
                <p style="margin:0 0 14px;color:#52606d;font-size:16px;line-height:1.65;">Hemos recibido una solicitud para crear una nueva contraseña en tu cuenta de Chetesaí Fitness+.</p>
                <p style="margin:0 0 26px;color:#52606d;font-size:16px;line-height:1.65;">Pulsa el botón para continuar. Por seguridad, utiliza el enlace cuanto antes y no lo compartas con nadie.</p>
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="border-radius:12px;background:#8ee500;">
                      <a href="${safeRecoveryUrl}" style="display:inline-block;padding:16px 24px;color:#07182b;font-size:16px;font-weight:800;text-decoration:none;">Crear nueva contraseña →</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;color:#7a8591;font-size:13px;line-height:1.6;">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña seguirá siendo la misma.</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #edf0e9;padding:20px 32px;color:#87919b;font-size:12px;line-height:1.6;">Chetesaí Fitness+ · Entrena con cabeza. Mejora con método.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Chetesaí Fitness+",
    "",
    "Restablece tu contraseña",
    "",
    "Hemos recibido una solicitud para crear una nueva contraseña en tu cuenta.",
    "Abre este enlace seguro para continuar:",
    recoveryUrl,
    "",
    "Por seguridad, utiliza el enlace cuanto antes y no lo compartas con nadie.",
    "Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña seguirá siendo la misma.",
  ].join("\n");

  return { subject, html, text };
}
