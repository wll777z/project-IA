"use client";
/* eslint-disable @next/next/no-img-element -- Only validated, same-origin normalized uploads. */
import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  Gamepad2,
  Swords,
  Blocks,
  Sparkles,
  Headphones,
} from "lucide-react";
import { safeLinkSchema, type GamerCardInput } from "@/lib/validation";
import { gameNames } from "@/lib/customization";
const icons = {
  gamepad: Gamepad2,
  swords: Swords,
  blocks: Blocks,
  sparkles: Sparkles,
  headset: Headphones,
};
export function GamerCard({
  card,
  index = 0,
  preview = true,
  selected = false,
}: {
  card: GamerCardInput;
  index?: number;
  preview?: boolean;
  selected?: boolean;
}) {
  const Icon = icons[card.icon] ?? Gamepad2;
  const safe = safeLinkSchema.safeParse(card.url);
  const content = (
    <>
      <div className="gamer-card-top">
        <span>{gameNames[card.game]}</span>
        <Icon size={16} />
      </div>
      <div className="gamer-card-identity">
        <div className="gamer-card-avatar">
          {card.avatarKey ? (
            <img
              src={`/api/media/${card.avatarKey}`}
              alt=""
              width={48}
              height={48}
            />
          ) : (
            <Icon size={24} />
          )}
        </div>
        <div>
          <h3>{card.displayName || "Seu nome no jogo"}</h3>
          {card.handle && <p>{card.handle}</p>}
        </div>
        {safe.success && <ArrowUpRight size={18} />}
      </div>
      {(card.detail || card.edition) && (
        <p className="gamer-card-detail">
          {card.detail}
          {card.edition && (
            <span> · {card.edition === "java" ? "Java" : "Bedrock"}</span>
          )}
        </p>
      )}
      {safe.success && (
        <span className="gamer-card-destination">
          {new URL(safe.data).hostname} ↗
        </span>
      )}
    </>
  );
  const props = {
    "data-selected": selected || undefined,
    className: `gamer-card card-${card.style} card-layout-${card.layout} ${card.glow ? "card-glow" : ""} ${card.animated ? "card-animated" : ""}`,
    style: {
      "--card-color": card.color,
      "--entry-delay": `${Math.min(index * 0.06, 0.5)}s`,
    } as CSSProperties,
  };
  return safe.success ? (
    <a
      {...props}
      href={preview ? safe.data : `/go/card/${card.id}`}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      aria-label={`${gameNames[card.game]}: ${card.displayName} — abrir link externo`}
    >
      {content}
    </a>
  ) : (
    <article {...props}>{content}</article>
  );
}
