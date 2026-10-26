"use client";
/* eslint-disable @next/next/no-img-element -- Uploaded assets are served from an authenticated same-origin endpoint. */
import type { CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, AudioLines, Link2 } from "lucide-react";
import { safeLinkSchema, type ProfileInput } from "@/lib/validation";
import { findTheme } from "@/lib/themes";
export function ProfileView({
  profile,
  preview = false,
  pro = false,
}: {
  profile: ProfileInput;
  preview?: boolean;
  pro?: boolean;
}) {
  const reduced = useReducedMotion();
  const theme = findTheme(profile.themeId);
  const visibleTheme =
    theme.premium && !pro ? findTheme("midnight-purple") : theme;
  const style = {
    "--profile-accent": profile.accentColor,
    "--profile-bg": pro ? profile.backgroundColor : visibleTheme.background,
  } as CSSProperties;
  return (
    <div
      style={style}
      className={`public-profile theme-${visibleTheme.id} ${preview ? "profile-preview" : ""} ${pro ? "buttons-" + profile.buttonStyle : "buttons-soft"} ${pro && !reduced ? "animate-" + profile.animation : ""}`}
    >
      <div className="public-aurora" />
      {profile.backgroundKey && (
        <img
          className="public-background"
          src={`/api/media/${profile.backgroundKey}`}
          alt=""
        />
      )}
      <motion.article
        className="public-card"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
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
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.035, 0.35) }}
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
