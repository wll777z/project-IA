import nodemailer from "nodemailer";
export const mailConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_FROM &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD,
);
export async function sendMail(to: string, subject: string, text: string) {
  if (!mailConfigured) throw new Error("SMTP não configurado");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: process.env.SMTP_PORT !== "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    dnsTimeout: 5000,
    logger: false,
    debug: false,
  });
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    });
  } catch {
    // Provider errors may contain recipient addresses or SMTP diagnostics.
    console.error("SMTP_DELIVERY_FAILED");
    throw new Error("Serviço de e-mail temporariamente indisponível.");
  } finally {
    transport.close();
  }
}
