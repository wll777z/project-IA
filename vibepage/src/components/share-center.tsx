"use client";
import { UnavailableProfile } from "@/components/profile-availability";

/* eslint-disable @next/next/no-img-element -- Locally generated PNG from the published public profile only. */
import { useState } from "react";
import Link from "next/link";
import { Copy, Download, Share2, QrCode } from "lucide-react";
import { vibeCardStyles } from "@/lib/studio-schema";
import type { ProfileInput } from "@/lib/validation";
export function ShareCenter({
  profile,
  pro,
  url,
  unavailable = false,
}: {
  profile: ProfileInput | null;
  pro: boolean;
  url: string;
  unavailable?: boolean;
}) {
  const [style, setStyle] = useState(profile?.vibeCardStyle ?? "minimal"),
    [revision, setRevision] = useState(profile?.revision ?? 0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (unavailable) return <UnavailableProfile />;
  if (!profile?.published || !url)
    return (
      <section className="workspace-card">
        <h1>Publique antes de compartilhar.</h1>
        <p>
          A central usa apenas dados da página pública. Rascunhos não geram QR
          ou VibeCard.
        </p>
        <Link className="button" href="/dashboard/editor">
          Abrir editor
        </Link>
      </section>
    );
  const effectiveStyle = pro ? style : "minimal",
    cardURL = `/api/vibecard/${profile.username}?style=${effectiveStyle}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link público copiado.");
    } catch {
      setMessage("Não foi possível copiar. Selecione o endereço abaixo.");
    }
  }
  async function nativeShare() {
    try {
      if (!navigator.share) {
        setMessage(
          "Seu navegador não oferece compartilhamento nativo. Baixe o PNG ou copie o link.",
        );
        return;
      }
      const response = await fetch(cardURL);
      if (!response.ok)
        throw new Error("Não foi possível gerar o cartão agora.");
      const file = new File(
        [await response.blob()],
        `vibecard-${profile!.username}.png`,
        { type: "image/png" },
      );
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({
          title: profile!.displayName,
          url,
          files: [file],
        });
      else await navigator.share({ title: profile!.displayName, url });
      setMessage("Compartilhamento concluído.");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError")
        setMessage(error.message);
    }
  }
  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="kicker">SUA VIBE GANHA O MUNDO</p>
          <h1>Central de compartilhamento.</h1>
          <p>
            QR e VibeCard usam apenas seu perfil publicado e a URL canônica.
          </p>
        </div>
      </div>
      <div className="share-center-grid">
        <section className="workspace-card">
          <h2>Seu endereço público</h2>
          <input
            className="share-url"
            value={url}
            readOnly
            aria-label="URL pública canônica"
          />
          <button
            className="button button-secondary"
            onClick={() => void copy()}
          >
            <Copy size={16} />
            Copiar link
          </button>
          <h2>
            <QrCode size={20} /> QR Code
          </h2>
          <img
            className="share-qr"
            src={`/api/qr/${profile.username}`}
            alt="QR Code para o perfil público"
            width={220}
            height={220}
          />
          <a
            className="text-button"
            href={`/api/qr/${profile.username}`}
            download
          >
            <Download size={16} />
            Baixar QR PNG
          </a>
        </section>
        <section className="workspace-card">
          <h2>VibeCard</h2>
          <label>
            Estilo
            <select
              value={effectiveStyle}
              onChange={(e) => setStyle(e.target.value as typeof style)}
            >
              {vibeCardStyles.map((s) => (
                <option key={s} value={s} disabled={!pro && s !== "minimal"}>
                  {s}
                  {s !== "minimal" ? " · Pro" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            className="text-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const response = await fetch("/api/profile/vibecard-style", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ style: effectiveStyle, revision }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                setRevision(data.revision);
                setMessage("Estilo de compartilhamento salvo.");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Falha ao salvar.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Salvando…" : "Salvar estilo"}
          </button>
          <img
            className="vibecard-preview"
            src={cardURL}
            alt={`VibeCard de ${profile.displayName}`}
            width={1280}
            height={720}
            onError={() =>
              setMessage(
                "Não foi possível carregar a imagem. Confira se o perfil segue publicado ou aguarde o limite de geração.",
              )
            }
          />
          <div className="collection-actions">
            <a className="button button-secondary" href={cardURL} download>
              <Download size={16} />
              Baixar PNG
            </a>
            <button className="button" onClick={() => void nativeShare()}>
              <Share2 size={16} />
              Compartilhar
            </button>
          </div>
          {!pro && (
            <Link className="text-button" href="/demo/pro">
              Ver modelos premium na demonstração →
            </Link>
          )}
        </section>
      </div>
      {message && (
        <p role="status" className="status-message">
          {message}
        </p>
      )}
      <p className="analytics-note">
        Despublicar interrompe novas gerações, mas não apaga imagens já baixadas
        ou enviadas a terceiros.
      </p>
    </div>
  );
}
