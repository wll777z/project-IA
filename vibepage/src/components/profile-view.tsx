"use client";
/* eslint-disable @next/next/no-img-element -- Uploaded assets are served from an authenticated same-origin endpoint. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GamerCard } from "@/components/gamer-card";
import { editableAppearance } from "@/lib/appearance";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, AudioLines, Link2 } from "lucide-react";
import { safeLinkSchema, type ProfileInput } from "@/lib/validation";
import { findTheme } from "@/lib/themes";
export function ProfileView({
  profile: supplied,
  preview = false,
  pro = false,
}: {
  profile: ProfileInput;
  preview?: boolean;
  pro?: boolean;
}) {
  const reduced = useReducedMotion();
  const profile = editableAppearance(supplied, pro);
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let inView = true;
    const sync = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  const active = !reduced && !paused && visible;
  const entrance = active ? profile.entranceEffect : "none";
  const theme = findTheme(profile.themeId);
  const visibleTheme =
    theme.premium && !pro ? findTheme("midnight-purple") : theme;
  const style = {
    "--profile-accent": profile.accentColor,
    "--profile-bg": pro ? profile.backgroundColor : visibleTheme.background,
  } as CSSProperties;
  return (
    <div
      ref={root}
      onPointerMove={(event) => {
        if (
          !active ||
          profile.backgroundEffect !== "parallax" ||
          event.pointerType !== "mouse"
        )
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--parallax-x",
          `${((event.clientX - bounds.left) / bounds.width - 0.5) * 16}px`,
        );
        event.currentTarget.style.setProperty(
          "--parallax-y",
          `${((event.clientY - bounds.top) / bounds.height - 0.5) * 16}px`,
        );
      }}
      style={style}
      className={`public-profile theme-${visibleTheme.id} ${preview ? "profile-preview" : ""} ${pro ? "buttons-" + profile.buttonStyle : "buttons-soft"} ${active ? "animate-" + profile.animation : "animations-paused"} bg-effect-${profile.backgroundEffect} avatar-effect-${profile.avatarEffect} button-effect-${profile.buttonEffect} entrance-${entrance} font-${profile.fontFamily}`}
    >
      <div className="public-aurora" aria-hidden="true" />
      <div className="profile-effects" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} style={{ "--i": i } as CSSProperties} />
        ))}
      </div>
      <button
        type="button"
        className="motion-toggle"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? "Ativar efeitos" : "Pausar efeitos"}
      </button>
      {pro && profile.backgroundKey && (
        <img
          className="public-background"
          src={`/api/media/${profile.backgroundKey}`}
          alt=""
        />
      )}
      <motion.article
        className="public-card"
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="public-avatar">
          {profile.avatarKey ? (
            <img
              src={`/api/media/${profile.avatarKey}`}
              alt={`Avatar de ${profile.displayName}`}
              width={96}
              height={96}
            />
          ) : (
            <span>
              {(profile.displayName || "V").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="avatar-spark">✦</span>
        </div>
        <p className="public-handle">@{profile.username || "seu_username"}</p>
        <h1>{profile.displayName || "Seu nome aqui"}</h1>
        <p className="public-bio">
          {profile.bio || "Um espaço para o seu universo."}
        </p>
        {!!profile.gamerCards.length && (
          <section className="public-gamer-cards" aria-label="Cartões gamer">
            {profile.gamerCards.map((card, index) => (
              <GamerCard key={card.id} card={card} index={index} />
            ))}
          </section>
        )}
        <div className="public-links">
          {profile.links.length ? (
            profile.links.map((link, index) => (
              <motion.a
                key={link.id}
                href={
                  preview
                    ? safeLinkSchema.safeParse(link.url).success
                      ? link.url
                      : undefined
                    : `/go/${link.id}`
                }
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay:
                    entrance === "sequence" ? Math.min(index * 0.035, 0.35) : 0,
                }}
                onPointerMove={(event) => {
                  if (
                    !active ||
                    profile.buttonEffect !== "magnetic" ||
                    event.pointerType !== "mouse"
                  )
                    return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  event.currentTarget.style.translate = `${(event.clientX - bounds.left - bounds.width / 2) * 0.03}px ${(event.clientY - bounds.top - bounds.height / 2) * 0.1}px`;
                }}
                onPointerLeave={(event) => {
                  event.currentTarget.style.translate = "0 0";
                }}
              >
                <Link2 size={19} />
                <span>{link.title || "Seu link"}</span>
                <ArrowUpRight size={17} />
              </motion.a>
            ))
          ) : (
            <div className="profile-empty">
              <Link2 size={22} />
              <p>
                {preview
                  ? "Adicione seu primeiro link no editor."
                  : "Novos links chegam em breve."}
              </p>
            </div>
          )}
        </div>
        {!(pro && profile.hideBranding) && (
          <Link className="public-brand" href="/">
            <AudioLines size={15} /> feito com <strong>vibepage</strong>
          </Link>
        )}
      </motion.article>
    </div>
  );
}
