import { z } from "zod";
export const sectionIds = [
  "identity",
  "gamerCards",
  "links",
  "blocks",
] as const;
export const sectionNames = {
  identity: "Identidade",
  gamerCards: "Cartões gamer",
  links: "Links",
  blocks: "Blocos",
};
export const defaultStudio = {
  layout: "classic",
  columns: 1,
  width: "standard",
  spacing: "normal",
  cardColumns: 1,
  order: [...sectionIds],
  hidden: [],
  widths: { identity: 2, gamerCards: 2, links: 2, blocks: 2 },
} as const;
export const studioSchema = z
  .object({
    layout: z.enum(["classic", "dashboard", "showcase", "portfolio"]),
    columns: z.union([z.literal(1), z.literal(2)]),
    width: z.enum(["standard", "wide"]),
    spacing: z.enum(["compact", "normal", "airy"]),
    cardColumns: z.union([z.literal(1), z.literal(2)]),
    order: z
      .array(z.enum(sectionIds))
      .length(4)
      .refine((v) => new Set(v).size === 4, "Não repita seções."),
    hidden: z
      .array(z.enum(sectionIds))
      .max(3)
      .refine((v) => new Set(v).size === v.length),
    widths: z
      .object({
        identity: z.union([z.literal(1), z.literal(2)]),
        gamerCards: z.union([z.literal(1), z.literal(2)]),
        links: z.union([z.literal(1), z.literal(2)]),
        blocks: z.union([z.literal(1), z.literal(2)]),
      })
      .strict(),
  })
  .strict();
export type StudioInput = z.infer<typeof studioSchema>;
export const blockKinds = [
  "favorites",
  "achievement",
  "project",
  "gallery",
  "social",
  "about",
  "spotlight",
] as const;
export const blockNames = {
  favorites: "Jogos favoritos",
  achievement: "Conquista",
  project: "Projeto",
  gallery: "Galeria",
  social: "Redes sociais",
  about: "Sobre mim",
  spotlight: "Destaque principal",
};
export const layoutNames = {
  classic: "Classic Center",
  dashboard: "Gamer Dashboard",
  showcase: "Neon Showcase",
  portfolio: "Creator Portfolio",
};
export const vibeCardStyles = [
  "neon",
  "holographic",
  "minimal",
  "galaxy",
  "retro",
] as const;
