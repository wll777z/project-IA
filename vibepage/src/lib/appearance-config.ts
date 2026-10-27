import { z } from "zod";
import {
  profileSchema,
  gamerCardSchema,
  type ProfileInput,
} from "@/lib/validation";
const appearanceShape = {
  themeId: true,
  accentColor: true,
  backgroundColor: true,
  buttonStyle: true,
  animation: true,
  hideBranding: true,
  backgroundEffect: true,
  avatarEffect: true,
  buttonEffect: true,
  entranceEffect: true,
  fontFamily: true,
  studio: true,
  vibeCardStyle: true,
} as const;
const appearanceSchema = profileSchema.pick(appearanceShape).strip();
const presentation = gamerCardSchema
  .pick({
    id: true,
    color: true,
    style: true,
    layout: true,
    icon: true,
    glow: true,
    animated: true,
  })
  .strip();
export const appearanceConfigSchema = appearanceSchema
  .extend({
    version: z.literal(1),
    cardPresentation: z.array(presentation).max(12),
    blockSettings: z
      .array(
        z
          .object({
            id: z.uuid(),
            hidden: z.boolean(),
            width: z.union([z.literal(1), z.literal(2)]),
          })
          .strict(),
      )
      .max(16),
  })
  .strict();
export type AppearanceConfig = z.infer<typeof appearanceConfigSchema>;
export function captureAppearance(profile: ProfileInput): AppearanceConfig {
  return appearanceConfigSchema.parse({
    ...appearanceSchema.parse(profile),
    version: 1,
    cardPresentation: profile.gamerCards.map((c) => presentation.parse(c)),
    blockSettings: profile.blocks.map((b) => ({
      id: b.id,
      hidden: b.hidden,
      width: b.width,
    })),
  });
}
export function applyAppearance(
  base: ProfileInput,
  input: unknown,
): ProfileInput {
  const config = appearanceConfigSchema.parse(input);
  const {
    version: _version,
    cardPresentation,
    blockSettings,
    ...appearance
  } = config;
  void _version;
  const order = new Map(blockSettings.map((b, i) => [b.id, i]));
  return {
    ...base,
    ...appearance,
    gamerCards: base.gamerCards.map((c) => ({
      ...c,
      ...cardPresentation.find((p) => p.id === c.id),
    })),
    blocks: [...base.blocks]
      .sort((a, b) => (order.get(a.id) ?? 100) - (order.get(b.id) ?? 100))
      .map((b) => ({ ...b, ...blockSettings.find((p) => p.id === b.id) })),
  };
}
