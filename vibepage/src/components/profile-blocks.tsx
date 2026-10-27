"use client";
/* eslint-disable @next/next/no-img-element -- Gallery images are bounded normalized same-origin uploads. */
import {
  Gamepad2,
  Swords,
  Blocks,
  Sparkles,
  Headphones,
  ArrowUpRight,
} from "lucide-react";
import type { ProfileInput } from "@/lib/validation";
import { safeLinkSchema } from "@/lib/validation";
import { GamerCard } from "@/components/gamer-card";
const icons = {
  gamepad: Gamepad2,
  swords: Swords,
  blocks: Blocks,
  sparkles: Sparkles,
  headset: Headphones,
};
export function ProfileBlocks({
  profile,
  preview,
}: {
  profile: ProfileInput;
  preview: boolean;
}) {
  return (
    <div className="profile-block-list">
      {profile.blocks
        .filter((b) => !b.hidden)
        .map((block) => {
          const Icon = icons[block.icon];
          const link = safeLinkSchema.safeParse(block.url);
          const featured = profile.gamerCards.find(
            (c) => c.id === block.cardId,
          );
          return (
            <article
              key={block.id}
              className={`profile-content-block block-${block.kind} span-${block.width}`}
            >
              <header>
                <Icon size={18} />
                <h2>{block.title}</h2>
              </header>
              {block.kind === "achievement" && (
                <>
                  <small className="self-reported">
                    Conquista informada pelo usuário · sem verificação oficial
                  </small>
                  {(block.game || block.date) && (
                    <p className="block-meta">
                      {block.game}
                      {block.date && ` · ${block.date}`}
                    </p>
                  )}
                </>
              )}
              {block.description && <p>{block.description}</p>}
              {block.kind === "favorites" && (
                <ul className="favorite-games">
                  {block.items.map((item, i) => (
                    <li key={i}>
                      <Gamepad2 size={14} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {block.kind === "gallery" && (
                <div className="block-gallery">
                  {block.imageKeys.map((key, i) => (
                    <img
                      key={key}
                      src={`/api/media/${key}`}
                      alt={`${block.title} — imagem ${i + 1}`}
                      width={400}
                      height={260}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              {block.kind === "spotlight" && featured && (
                <GamerCard card={featured} preview={preview} />
              )}{" "}
              {link.success && (
                <a
                  href={link.data}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                >
                  {new URL(link.data).hostname}
                  <ArrowUpRight size={15} />
                </a>
              )}
            </article>
          );
        })}
    </div>
  );
}
