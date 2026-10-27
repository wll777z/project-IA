import { applyTheme } from "@/lib/appearance";
import {
  studioSchema,
  defaultStudio,
  type StudioInput,
} from "@/lib/studio-schema";
import type { ThemeId } from "@/lib/themes";
import type { ProfileInput } from "@/lib/validation";
export const profileTemplates = [
  {
    id: "gamer-grid",
    name: "Command Grid",
    category: "Gamer",
    theme: "cyber-neon",
    layout: "dashboard",
    premium: true,
    description: "Cartões em grade e identidade em primeiro plano.",
  },
  {
    id: "streamer",
    name: "On Air",
    category: "Streamer",
    theme: "galaxy-purple",
    layout: "showcase",
    premium: true,
    description: "Vitrine de jogos e links do seu conteúdo.",
  },
  {
    id: "creator",
    name: "Creative Signal",
    category: "Criador",
    theme: "holographic",
    layout: "portfolio",
    premium: true,
    description: "Espaço para projetos e histórias.",
  },
  {
    id: "minimal",
    name: "Quiet Focus",
    category: "Minimalista",
    theme: "minimal-black",
    layout: "classic",
    premium: false,
    description: "Uma composição simples para começar.",
  },
  {
    id: "future",
    name: "Future Pulse",
    category: "Futurista",
    theme: "voltage-city",
    layout: "dashboard",
    premium: true,
    description: "Linhas geométricas e luz elétrica.",
  },
  {
    id: "anime",
    name: "Petal Notes",
    category: "Anime Inspired",
    theme: "sakura-dream",
    layout: "showcase",
    premium: true,
    description: "Paleta delicada, sem personagens ou artes de terceiros.",
  },
  {
    id: "retro",
    name: "Save Point",
    category: "Retro",
    theme: "retro-arcade",
    layout: "portfolio",
    premium: true,
    description: "Uma composição original de inspiração arcade.",
  },
] as const;
export function applyProfileTemplate(base: ProfileInput, id: string) {
  const item = profileTemplates.find((t) => t.id === id);
  if (!item) return base;
  const themed = applyTheme(base, item.theme as ThemeId);
  const studio: StudioInput = {
    ...studioSchema.parse(defaultStudio),
    layout: item.layout,
    columns: item.layout === "dashboard" || item.layout === "portfolio" ? 2 : 1,
    width: item.premium ? "wide" : "standard",
    cardColumns: item.premium ? 2 : 1,
    order:
      item.layout === "portfolio"
        ? ["identity", "blocks", "links", "gamerCards"]
        : ["identity", "gamerCards", "blocks", "links"],
  };
  return {
    ...themed,
    studio: item.premium ? studio : studioSchema.parse(defaultStudio),
  };
}
