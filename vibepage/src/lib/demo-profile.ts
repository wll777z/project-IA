import { defaultEffects } from "@/lib/customization";
import type { ProfileInput } from "@/lib/validation";
export const demoProfile: ProfileInput = {
  ...defaultEffects,
  username: "wendell",
  displayName: "wendell",
  bio: "Entre um game e uma ideia nova.\nEsse é o meu universo. 🪐",
  themeId: "midnight-purple",
  accentColor: "#a78bfa",
  backgroundColor: "#100c1b",
  buttonStyle: "soft",
  animation: "none",
  hideBranding: false,
  published: false,
  avatarKey: null,
  backgroundKey: null,
  revision: 0,
  gamerCards: [
    {
      id: "8e6ca6f0-88f9-45d4-8f4c-812e98d14503",
      game: "roblox",
      displayName: "wendell",
      handle: "@wendell",
      detail: "Blox Fruits · Sword main",
      edition: "",
      url: "https://www.roblox.com/",
      avatarKey: null,
      color: "#a78bfa",
      style: "neon",
      layout: "compact",
      icon: "swords",
      glow: true,
      animated: false,
    },
  ],
  links: [
    {
      id: "8e6ca6f0-88f9-45d4-8f4c-812e98d14501",
      title: "Meu canal",
      url: "https://www.youtube.com/",
    },
    {
      id: "8e6ca6f0-88f9-45d4-8f4c-812e98d14502",
      title: "Minha comunidade",
      url: "https://discord.com/",
    },
  ],
};
