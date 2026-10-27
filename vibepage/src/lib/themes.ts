export const themes = [
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    premium: false,
    accent: "#a78bfa",
    background: "#100c1b",
    description: "Seu universo em tons de roxo.",
    className: "midnight",
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    premium: true,
    accent: "#bdff63",
    background: "#07140e",
    description: "Energia para o próximo level.",
    className: "cyber",
  },
  {
    id: "minimal-black",
    name: "Minimal Black",
    premium: false,
    accent: "#d4d4d8",
    background: "#0d0d10",
    description: "Só o que faz sentido para você.",
    className: "minimal",
  },
  {
    id: "pink-dream",
    name: "Pink Dream",
    premium: true,
    accent: "#f9a8d4",
    background: "#271324",
    description: "Leve, luminoso, do seu jeito.",
    className: "pink",
  },
  {
    id: "ice-blue",
    name: "Ice Blue",
    premium: false,
    accent: "#7dd3fc",
    background: "#0a1726",
    description: "Uma pausa azul no seu feed.",
    className: "ice",
  },
  {
    id: "voltage-city",
    name: "Voltage City",
    premium: true,
    accent: "#ffe766",
    background: "#11110a",
    description: "Amarelo elétrico, linhas de um futuro original.",
    className: "voltage",
  },
  {
    id: "galaxy-purple",
    name: "Galaxy Purple",
    premium: true,
    accent: "#c4a1ff",
    background: "#100924",
    description: "Nebulosas para o seu universo.",
    className: "galaxy",
  },
  {
    id: "sakura-dream",
    name: "Sakura Dream",
    premium: true,
    accent: "#ffc2de",
    background: "#22121e",
    description: "Pétalas, luz suave e novas histórias.",
    className: "sakura",
  },
  {
    id: "ice-crystal",
    name: "Ice Crystal",
    premium: true,
    accent: "#b6f5ff",
    background: "#081c28",
    description: "Cristais de luz em azul profundo.",
    className: "crystal",
  },
  {
    id: "crimson-shadow",
    name: "Crimson Shadow",
    premium: true,
    accent: "#ff8796",
    background: "#200c14",
    description: "Uma presença discreta em vermelho.",
    className: "crimson",
  },
  {
    id: "retro-arcade",
    name: "Retro Arcade",
    premium: true,
    accent: "#8bffcf",
    background: "#0e1421",
    description: "Um novo recorde para a sua identidade.",
    className: "arcade",
  },
  {
    id: "holographic",
    name: "Holographic",
    premium: true,
    accent: "#dec5ff",
    background: "#161327",
    description: "Reflexos iridescentes em movimento.",
    className: "holo",
  },
  {
    id: "aurora-blue",
    name: "Aurora Blue",
    premium: true,
    accent: "#91f2df",
    background: "#091627",
    description: "Luzes azuis e verdes em uma noite polar.",
    className: "aurora-blue",
  },
] as const;
export type ThemeId = (typeof themes)[number]["id"];
export function findTheme(id: string) {
  return themes.find((t) => t.id === id) ?? themes[0];
}

// Presets are explicit editor actions. Rendering always uses saved choices.
// Free recipes contain only free features; all saved fields remain server-validated.
const baseRecipe = {
  fontFamily: "modern",
  buttonStyle: "soft",
  cardStyle: "minimal",
  backgroundEffect: "none",
  avatarEffect: "none",
  buttonEffect: "none",
  entranceEffect: "fade",
} as const;
type Recipe = {
  fontFamily: "modern" | "mono" | "rounded";
  buttonStyle: "soft" | "outline" | "pill";
  cardStyle:
    "neon" | "minimal" | "glass" | "cyberpunk" | "holographic" | "pixel";
  backgroundEffect:
    | "none"
    | "particles"
    | "stars"
    | "gradient"
    | "aurora"
    | "digital"
    | "nebula"
    | "waves"
    | "parallax";
  avatarEffect: "none" | "pulse" | "halo" | "ring" | "holographic" | "hover";
  buttonEffect:
    "none" | "neon" | "magnetic" | "gradient" | "glass" | "shine" | "press";
  entranceEffect: "none" | "fade" | "slide" | "zoom" | "sequence";
};
export const themeRecipes: Record<ThemeId, Recipe> = {
  "midnight-purple": { ...baseRecipe, cardStyle: "neon" },
  "minimal-black": baseRecipe,
  "ice-blue": baseRecipe,
  "cyber-neon": {
    ...baseRecipe,
    fontFamily: "mono",
    cardStyle: "cyberpunk",
    backgroundEffect: "digital",
    buttonEffect: "neon",
    entranceEffect: "sequence",
  },
  "pink-dream": {
    ...baseRecipe,
    fontFamily: "rounded",
    buttonStyle: "pill",
    cardStyle: "glass",
    backgroundEffect: "gradient",
    avatarEffect: "halo",
    buttonEffect: "glass",
  },
  "voltage-city": {
    ...baseRecipe,
    fontFamily: "mono",
    buttonStyle: "outline",
    cardStyle: "cyberpunk",
    backgroundEffect: "digital",
    avatarEffect: "ring",
    buttonEffect: "shine",
  },
  "galaxy-purple": {
    ...baseRecipe,
    cardStyle: "neon",
    backgroundEffect: "nebula",
    avatarEffect: "halo",
    buttonEffect: "neon",
    entranceEffect: "sequence",
  },
  "sakura-dream": {
    ...baseRecipe,
    fontFamily: "rounded",
    buttonStyle: "pill",
    cardStyle: "glass",
    backgroundEffect: "particles",
    avatarEffect: "hover",
    buttonEffect: "glass",
  },
  "ice-crystal": {
    ...baseRecipe,
    buttonStyle: "outline",
    cardStyle: "glass",
    backgroundEffect: "waves",
    avatarEffect: "halo",
    buttonEffect: "glass",
  },
  "crimson-shadow": {
    ...baseRecipe,
    buttonStyle: "outline",
    cardStyle: "minimal",
    avatarEffect: "hover",
    buttonEffect: "neon",
    entranceEffect: "slide",
  },
  "retro-arcade": {
    ...baseRecipe,
    fontFamily: "mono",
    buttonStyle: "outline",
    cardStyle: "pixel",
    backgroundEffect: "stars",
    buttonEffect: "press",
    entranceEffect: "sequence",
  },
  holographic: {
    ...baseRecipe,
    cardStyle: "holographic",
    backgroundEffect: "gradient",
    avatarEffect: "holographic",
    buttonEffect: "shine",
    entranceEffect: "zoom",
  },
  "aurora-blue": {
    ...baseRecipe,
    cardStyle: "glass",
    backgroundEffect: "aurora",
    avatarEffect: "halo",
    buttonEffect: "glass",
    entranceEffect: "slide",
  },
};
