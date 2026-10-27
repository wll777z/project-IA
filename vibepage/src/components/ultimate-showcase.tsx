"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Gamepad2, Sparkles } from "lucide-react";
import { ProfileView } from "@/components/profile-view";
import { demoProfile } from "@/lib/demo-profile";
import { themes } from "@/lib/themes";
import type { ProfileInput } from "@/lib/validation";
const presets = [
  {
    name: "Neon loadout",
    themeId: "midnight-purple",
    backgroundEffect: "stars",
    avatarEffect: "ring",
    buttonEffect: "shine",
    style: "neon",
    game: "roblox",
    detail: "Blox Fruits · Sword main",
  },
  {
    name: "Crystal realm",
    themeId: "ice-crystal",
    backgroundEffect: "waves",
    avatarEffect: "halo",
    buttonEffect: "glass",
    style: "glass",
    game: "minecraft",
    detail: "Construa seu próximo universo",
  },
  {
    name: "Holo community",
    themeId: "holographic",
    backgroundEffect: "aurora",
    avatarEffect: "holographic",
    buttonEffect: "gradient",
    style: "holographic",
    game: "discord",
    detail: "Sua comunidade favorita",
  },
] as const;
export function UltimateShowcase() {
  const [selected, setSelected] = useState(0);
  const preset = presets[selected];
  const theme = themes.find((t) => t.id === preset.themeId)!;
  const profile: ProfileInput = {
    ...demoProfile,
    themeId: theme.id,
    accentColor: theme.accent,
    backgroundColor: theme.background,
    backgroundEffect: preset.backgroundEffect,
    avatarEffect: preset.avatarEffect,
    buttonEffect: preset.buttonEffect,
    entranceEffect: "sequence",
    gamerCards: demoProfile.gamerCards.map((c) => ({
      ...c,
      game: preset.game,
      style: preset.style,
      color: theme.accent,
      detail: preset.detail,
      url: "",
      glow: true,
    })),
  };
  return (
    <section id="cartoes" className="section shell ultimate-showcase">
      <div className="showcase-copy">
        <p className="kicker">NÃO É SÓ UM LINK NA BIO</p>
        <h2>
          Leve seu loadout
          <br />
          para fora do lobby.
        </h2>
        <p>
          Seu game, sua comunidade, seu estilo. Cartões com identidade própria e
          efeitos que você controla.
        </p>
        <div
          className="showcase-options"
          role="group"
          aria-label="Experimentar estilos"
        >
          {presets.map((p, i) => (
            <button
              type="button"
              key={p.name}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              <span>0{i + 1}</span>
              {i === 1 ? <Gamepad2 size={18} /> : <Sparkles size={18} />}
              <strong>{p.name}</strong>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
        <p className="showcase-note">
          Prévia ilustrativa de recursos Free e Pro. Sem integração com jogos ou
          dados de jogadores reais.
        </p>
        <Link className="button" href="/demo">
          Personalizar minha vibe <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="showcase-profile">
        <div className="showcase-window">
          <span />
          <span />
          <span />
          <small>vibepage / sua próxima versão</small>
        </div>
        <ProfileView key={selected} profile={profile} pro preview />
      </div>
    </section>
  );
}
