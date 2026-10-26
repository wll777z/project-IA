import { z } from "zod";
export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email("Informe um e-mail válido."))
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(12, "Use pelo menos 12 caracteres.")
    .max(128, "Use até 128 caracteres."),
});
export const registrationSchema = credentialsSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(60)
    .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Nome inválido."),
});
export const reservedUsernames = new Set([
  "api",
  "dashboard",
  "login",
  "cadastro",
  "recuperar-senha",
  "redefinir-senha",
  "privacidade",
  "termos",
  "admin",
  "settings",
  "themes",
  "suporte",
  "vibepage",
  "www",
  "account",
  "auth",
  "favicon",
  "robots",
  "sitemap",
  "_next",
  "go",
  "demo",
]);
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(24)
  .regex(/^[a-z0-9][a-z0-9_]*$/)
  .refine((v) => !reservedUsernames.has(v), "Esse username é reservado.");
// Never fetch user-provided links on the server.
export const safeLinkSchema = z
  .string()
  .max(2048)
  .refine((value) => {
    // Refinements must be total: the preview validates partially typed URLs too.
    if (/[\u0000-\u0020\u007f]/.test(value) || value.includes("\\"))
      return false;
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase().replace(/\.+$/, "");
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.port &&
        host.includes(".") &&
        !host.endsWith(".local") &&
        !host.endsWith(".localhost") &&
        !host.endsWith(".internal") &&
        !/^[\d.]+$/.test(host) &&
        !host.includes(":") &&
        !host.startsWith("[")
      );
    } catch {
      return false;
    }
  }, "Use um link HTTPS público, sem credenciais.")
  .transform((value) => new URL(value).href);

export const profileSchema = z
  .object({
    username: usernameSchema,
    displayName: z
      .string()
      .trim()
      .min(1, "Informe seu nome público.")
      .max(60)
      .refine(
        (v) => !/[\u0000-\u001f\u007f]/.test(v),
        "Nome público inválido.",
      ),
    bio: z
      .string()
      .trim()
      .max(240, "A bio pode ter até 240 caracteres.")
      .refine(
        (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
        "Biografia inválida.",
      ),
    themeId: z.enum([
      "midnight-purple",
      "cyber-neon",
      "minimal-black",
      "pink-dream",
      "ice-blue",
    ]),
    accentColor: z.string().regex(/^#[a-fA-F0-9]{6}$/, "Cor inválida."),
    backgroundColor: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    buttonStyle: z.enum(["soft", "outline", "pill"]),
    animation: z.enum(["none", "float", "glow"]),
    hideBranding: z.boolean(),
    published: z.boolean(),
    avatarKey: z.uuid().nullable(),
    backgroundKey: z.uuid().nullable(),
    revision: z.number().int().nonnegative(),
    links: z
      .array(
        z
          .object({
            id: z.uuid(),
            title: z.string().trim().min(1, "Dê um título ao link.").max(80),
            url: safeLinkSchema,
          })
          .strict(),
      )
      .max(100, "Use no máximo 100 links.")
      .refine(
        (v) => new Set(v.map((l) => l.id)).size === v.length,
        "Links duplicados.",
      ),
  })
  .strict();
export type ProfileInput = z.infer<typeof profileSchema>;
