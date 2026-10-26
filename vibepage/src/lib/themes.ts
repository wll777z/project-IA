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
] as const;
export type ThemeId = (typeof themes)[number]["id"];
export function findTheme(id: string) {
  return themes.find((t) => t.id === id) ?? themes[0];
}
