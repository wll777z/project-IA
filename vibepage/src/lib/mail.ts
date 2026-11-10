import nodemailer from "nodemailer";
export const mailConfigured = Boolean(
  (process.env.RESEND_API_KEY && process.env.MAIL_FROM) ||
  (process.env.SMTP_HOST &&
    process.env.SMTP_FROM &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD),
);
export async function sendMail(to: string, subject: string, text: string) {
  if (!mailConfigured) throw new Error("Envio de e-mail não configurado");
  // HTTPS also works on hosts where outbound SMTP ports are unavailable.
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [to],
        subject,
        text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error("Falha no envio do e-mail de recuperação");
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: process.env.SMTP_PORT !== "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 15000,
    socketTimeout: 15000,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}
