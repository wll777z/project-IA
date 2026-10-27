import { studioSchema, blockKinds, vibeCardStyles } from "@/lib/studio-schema";
import { z } from "zod";
import { themes } from "@/lib/themes";
import {
  games,
  cardStyles,
  backgroundEffects,
  avatarEffects,
  buttonEffects,
  entranceEffects,
  fonts,
} from "@/lib/customization";
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

const shortText = (length: number) =>
  z
    .string()
    .trim()
    .max(length)
    .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Texto inválido.");
export const gamerCardSchema = z
  .object({
    id: z.uuid(),
    game: z.enum(games),
    displayName: shortText(60).min(1, "Informe o nome do cartão."),
    handle: shortText(60),
    detail: shortText(100),
    edition: z.enum(["", "java", "bedrock"]),
    url: z.union([z.literal(""), safeLinkSchema]),
    avatarKey: z.uuid().nullable(),
    color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    style: z.enum(cardStyles),
    layout: z.enum(["compact", "banner"]),
    icon: z.enum(["gamepad", "swords", "blocks", "sparkles", "headset"]),
    glow: z.boolean(),
    animated: z.boolean(),
  })
  .strict();
export function gamerCardDTO(card: GamerCardInput): GamerCardInput {
  return Object.fromEntries(
    Object.keys(gamerCardSchema.shape).map((key) => [
      key,
      card[key as keyof GamerCardInput],
    ]),
  ) as GamerCardInput;
}
export type GamerCardInput = z.infer<typeof gamerCardSchema>;

export const blockSchema = z
  .object({
    id: z.uuid(),
    kind: z.enum(blockKinds),
    title: shortText(80).min(1),
    description: z
      .string()
      .trim()
      .max(600)
      .refine(
        (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
        "Texto inválido.",
      ),
    icon: z.enum(["gamepad", "swords", "blocks", "sparkles", "headset"]),
    url: z.union([z.literal(""), safeLinkSchema]),
    imageKeys: z.array(z.uuid()).max(6),
    items: z.array(shortText(80).min(1)).max(12),
    game: shortText(80),
    date: z.union([z.literal(""), z.iso.date()]),
    cardId: z.uuid().nullable(),
    hidden: z.boolean(),
    width: z.union([z.literal(1), z.literal(2)]),
  })
  .strict();
export type BlockInput = z.infer<typeof blockSchema>;
export const profileSchema = z
  .object({
    studio: studioSchema,
    blocks: z
      .array(blockSchema)
      .max(16)
      .refine(
        (v) => new Set(v.map((b) => b.id)).size === v.length,
        "Blocos duplicados.",
      ),
    vibeCardStyle: z.enum(vibeCardStyles),
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
    themeId: z.enum(themes.map((theme) => theme.id)),
    accentColor: z.string().regex(/^#[a-fA-F0-9]{6}$/, "Cor inválida."),
    backgroundColor: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    buttonStyle: z.enum(["soft", "outline", "pill"]),
    animation: z.enum(["none", "float", "glow"]),
    hideBranding: z.boolean(),
    published: z.boolean(),
    avatarKey: z.uuid().nullable(),
    backgroundKey: z.uuid().nullable(),
    revision: z.number().int().nonnegative(),
    backgroundEffect: z.enum(backgroundEffects),
    avatarEffect: z.enum(avatarEffects),
    buttonEffect: z.enum(buttonEffects),
    entranceEffect: z.enum(entranceEffects),
    fontFamily: z.enum(fonts),
    gamerCards: z
      .array(gamerCardSchema)
      .max(12)
      .refine(
        (v) => new Set(v.map((c) => c.id)).size === v.length,
        "Cartões duplicados.",
      ),
    links: z
      .array(
        z
          .object({
            id: z.uuid(),
            title: z
              .string()
              .trim()
              .min(1, "Dê um título ao link.")
              .max(80)
              .refine(
                (value) => !/[\u0000-\u001f\u007f]/.test(value),
                "Título inválido.",
              ),
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
