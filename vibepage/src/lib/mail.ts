import nodemailer from "nodemailer";
export const mailConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_FROM &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD,
);
// Fora de produção, sem SMTP, o e-mail é exibido no terminal do servidor
// para que "Esqueci minha senha" funcione durante o desenvolvimento.
export const mailDevFallback =
  !mailConfigured && process.env.NODE_ENV !== "production";
export const mailAvailable = mailConfigured || mailDevFallback;
export async function sendMail(to: string, subject: string, text: string) {
  if (mailDevFallback) {
    console.info(`\n[DEV E-MAIL] Para: ${to}\nAssunto: ${subject}\n${text}\n`);
    return;
  }
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
