export const games = [
  "roblox",
  "discord",
  "minecraft",
  "fortnite",
  "valorant",
  "free-fire",
  "league-of-legends",
  "pokemon",
  "custom",
] as const;
export const gameNames: Record<(typeof games)[number], string> = {
  roblox: "Roblox",
  discord: "Discord",
  minecraft: "Minecraft",
  fortnite: "Fortnite",
  valorant: "Valorant",
  "free-fire": "Free Fire",
  "league-of-legends": "League of Legends",
  pokemon: "Pokémon",
  custom: "Outro jogo",
};
export const cardStyles = [
  "neon",
  "minimal",
  "glass",
  "cyberpunk",
  "holographic",
  "pixel",
] as const;
export const cardStyleNames = [
  "Neon Gamer",
  "Minimal Dark",
  "Glass Card",
  "Cyberpunk",
  "Holographic",
  "Retro Pixel",
];
export const backgroundEffects = [
  "none",
  "particles",
  "stars",
  "gradient",
  "aurora",
  "digital",
  "nebula",
  "waves",
  "parallax",
] as const;
export const avatarEffects = [
  "none",
  "pulse",
  "halo",
  "ring",
  "holographic",
  "hover",
] as const;
export const buttonEffects = [
  "none",
  "neon",
  "magnetic",
  "gradient",
  "glass",
  "shine",
  "press",
] as const;
export const entranceEffects = [
  "none",
  "fade",
  "slide",
  "zoom",
  "sequence",
] as const;
export const fonts = ["modern", "mono", "rounded"] as const;
export const defaultEffects = {
  backgroundEffect: "none",
  avatarEffect: "none",
  buttonEffect: "none",
  entranceEffect: "fade",
  fontFamily: "modern",
} as const;
export const FREE_CARD_LIMIT = 3;
export const PRO_CARD_LIMIT = 12;
