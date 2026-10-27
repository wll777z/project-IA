"use client";
import { ProfileView } from "@/components/profile-view";
import {
  applyAppearance,
  appearanceConfigSchema,
} from "@/lib/appearance-config";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Copy, Palette, CalendarClock, Trash2, RotateCcw } from "lucide-react";
import type { listAppearances } from "@/lib/appearance-store";
const subscribeZone = () => () => {};
const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => "";
export function AppearanceManager({
  initial,
}: {
  initial: Awaited<ReturnType<typeof listAppearances>>;
}) {
  const [data, setData] = useState(initial),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [collection, setCollection] = useState(initial.items[0]?.id ?? ""),
    [starts, setStarts] = useState(""),
    [ends, setEnds] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const selected = data.items.find((item) => item.id === previewId);
  const valid = selected
    ? appearanceConfigSchema.safeParse(selected.config)
    : null;
  const zone = useSyncExternalStore(subscribeZone, deviceZone, serverZone);
  async function action(body: unknown, schedule = false) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        schedule ? "/api/schedules" : "/api/appearances",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const fresh = await fetch("/api/appearances");
      if (!fresh.ok)
        throw new Error("Recarregue para consultar a atualização.");
      setData(await fresh.json());
      setMessage("Alteração salva. O conteúdo do perfil foi preservado.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  const instant = (value: string) => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
      throw new Error("Informe datas válidas.");
    const roundtrip = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    if (roundtrip !== value)
      throw new Error(
        "Esse horário não existe no fuso do dispositivo. Escolha outro horário.",
      );
    return date.toISOString();
  };
  return (
    <div className="collections-page">
      <div className="page-heading">
        <div>
          <p className="kicker">SEU GUARDA-ROUPA DIGITAL</p>
          <h1>Aparências e temporadas.</h1>
          <p>
            Salve primeiro o perfil no editor. Coleções guardam somente sua
            personalização, sem copiar ou excluir conteúdo.
          </p>
        </div>
        <Link href="/dashboard/editor" className="button button-secondary">
          Abrir Profile Studio
        </Link>
      </div>
      {!data.pro && (
        <div className="workspace-card">
          <h2>Coleções são um recurso Pro.</h2>
          <p>
            Seus dados já salvos continuam privados. Agendamentos ficam
            suspensos sem Pro e podem ser cancelados abaixo.
          </p>
          <Link href="/demo/pro" className="text-button">
            Conhecer os recursos reais →
          </Link>
        </div>
      )}
      {selected && valid?.success && data.profile && (
        <section className="workspace-card">
          <h2>Prévia · {selected.name}</h2>
          <p>
            Somente visualização. Aplicar exige Pro e confirmação de revisão no
            servidor.
          </p>
          <button className="text-button" onClick={() => setPreviewId(null)}>
            Fechar prévia
          </button>
          <ProfileView
            profile={applyAppearance(data.profile, valid.data)}
            preview
            pro
          />
        </section>
      )}
      <fieldset disabled={busy} className="manager-fieldset">
        <section className="workspace-card">
          <h2>
            <Palette size={20} /> Salvar aparência atual
          </h2>
          <div className="manager-inline">
            <label>
              Nome
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Minha vibe espacial"
              />
            </label>
            <button
              className="button"
              disabled={
                !data.pro ||
                !data.profile ||
                !name.trim() ||
                data.items.length >= 10
              }
              onClick={() => void action({ action: "create", name })}
            >
              Salvar coleção
            </button>
          </div>
          <small>
            {data.items.length}/10 coleções. Avatar e imagens continuam
            vinculados ao conteúdo atual.
          </small>
        </section>
        <div className="collection-grid">
          {data.items.map((item) => (
            <article className="workspace-card" key={item.id}>
              <span className="outline-pill">APARÊNCIA SALVA</span>
              <h2>{item.name}</h2>
              <button
                className="text-button"
                onClick={() => setPreviewId(item.id)}
              >
                Prévia da coleção
              </button>
              <div className="collection-actions">
                <button
                  className="button button-secondary"
                  disabled={!data.pro}
                  onClick={() =>
                    void action({
                      action: "apply",
                      id: item.id,
                      profileRevision: data.profile?.revision,
                    })
                  }
                >
                  Aplicar
                </button>
                <button
                  className="text-button"
                  disabled={!data.pro}
                  onClick={() => {
                    const next = window.prompt("Novo nome", item.name);
                    if (next?.trim())
                      void action({
                        action: "rename",
                        id: item.id,
                        name: next,
                        revision: item.revision,
                      });
                  }}
                >
                  Renomear
                </button>
                <button
                  className="text-button"
                  disabled={!data.pro}
                  onClick={() =>
                    void action({
                      action: "duplicate",
                      id: item.id,
                      name: `${item.name.slice(0, 50)} — cópia`,
                    })
                  }
                >
                  <Copy size={14} />
                  Duplicar
                </button>
                <button
                  className="text-button"
                  disabled={!data.pro}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Excluir esta coleção e seus agendamentos? O perfil atual e seu conteúdo serão preservados.",
                      )
                    )
                      void action({
                        action: "remove",
                        id: item.id,
                        revision: item.revision,
                      });
                  }}
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
        {!data.items.length && (
          <section className="workspace-card">
            <h2>Sua primeira coleção começa no editor.</h2>
            <p>
              Personalize, salve o perfil e volte para guardar uma combinação.
            </p>
          </section>
        )}
        <button
          className="button button-secondary"
          disabled={!data.pro || !data.profile || !data.canUndo}
          onClick={() =>
            void action({
              action: "undo",
              profileRevision: data.profile?.revision,
            })
          }
        >
          <RotateCcw size={16} />
          Restaurar aparência anterior
        </button>
        <section className="workspace-card">
          <h2>
            <CalendarClock size={20} /> Agenda sazonal
          </h2>
          <p>
            A aparência padrão não é alterada. O servidor resolve a temporada
            por data, mesmo com o navegador fechado, e volta ao padrão ao
            terminar.
          </p>
          <label>
            Aparência
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              <option value="">Selecione</option>
              {data.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="card-form-grid">
            <label>
              Início · {zone}
              <input
                type="datetime-local"
                value={starts}
                onChange={(e) => setStarts(e.target.value)}
              />
            </label>
            <label>
              Término · {zone}
              <input
                type="datetime-local"
                value={ends}
                onChange={(e) => setEnds(e.target.value)}
              />
            </label>
          </div>
          {starts && ends && (
            <p className="analytics-note">
              Instantes UTC:{" "}
              {Number.isFinite(new Date(starts).getTime())
                ? new Date(starts).toISOString()
                : "Data inválida"}{" "}
              →{" "}
              {Number.isFinite(new Date(ends).getTime())
                ? new Date(ends).toISOString()
                : "Data inválida"}
            </p>
          )}
          <button
            className="button"
            disabled={!data.pro || !collection || !starts || !ends || !zone}
            onClick={() => {
              try {
                void action(
                  {
                    action: "create",
                    appearanceId: collection,
                    startsAt: instant(starts),
                    endsAt: instant(ends),
                    timeZone: zone,
                  },
                  true,
                );
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Datas inválidas.");
              }
            }}
          >
            Agendar
          </button>
          <p>
            Até cinco intervalos futuros sem sobreposição, com duração máxima de
            90 dias.
          </p>
        </section>
        {data.schedules.map((item) => (
          <article className="workspace-card" key={item.id}>
            <h3>{item.name}</h3>
            <p>
              {new Date(item.startsAt).toLocaleString("pt-BR", {
                timeZone: item.timeZone,
              })}{" "}
              →{" "}
              {new Date(item.endsAt).toLocaleString("pt-BR", {
                timeZone: item.timeZone,
              })}{" "}
              · {item.timeZone}
            </p>
            <span className="outline-pill">
              {new Date(item.startsAt) <= new Date() &&
              new Date(item.endsAt) > new Date()
                ? data.pro
                  ? "ATIVO"
                  : "SUSPENSO SEM PRO"
                : new Date(item.endsAt) <= new Date()
                  ? "ENCERRADO"
                  : "AGENDADO"}
            </span>
            <button
              className="text-button"
              onClick={() => {
                if (window.confirm("Cancelar este agendamento?"))
                  void action({ action: "cancel", id: item.id }, true);
              }}
            >
              Cancelar
            </button>
          </article>
        ))}
      </fieldset>
      {message && (
        <p className="status-message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
