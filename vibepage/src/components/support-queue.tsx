"use client";
import { useState } from "react";
import type { listSupportCases } from "@/lib/support";
const statusLabels: Record<string, string> = {
  OPEN: "Aberto",
  IN_REVIEW: "Em revisão",
  RESOLVED: "Resolvido",
  DISMISSED: "Arquivado",
};
const actionLabels: Record<string, string> = {
  review: "Revisão registrada",
  "hide-profile": "Perfil ocultado",
  "restore-profile": "Bloqueio retirado",
};
type Data = Awaited<ReturnType<typeof listSupportCases>>;
export function SupportQueue({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial),
    [status, setStatus] = useState("OPEN"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function reload(filter: string, cursor?: string) {
    const response = await fetch(
      `/api/admin/cases?status=${filter}${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setData(
      cursor ? { ...result, items: [...data.items, ...result.items] } : result,
    );
  }
  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="kicker">ADMINISTRAÇÃO</p>
          <h1>Suporte e denúncias.</h1>
          <p>
            Informações privadas. Decisões de moderação exigem justificativa e
            são registradas.
          </p>
        </div>
      </div>
      <label>
        Filtrar casos
        <select
          value={status}
          disabled={busy}
          onChange={async (e) => {
            const value = e.target.value;
            setBusy(true);
            try {
              await reload(value);
              setStatus(value);
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Falha ao consultar.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {[
            ["OPEN", "Abertos"],
            ["IN_REVIEW", "Em revisão"],
            ["RESOLVED", "Resolvidos"],
            ["DISMISSED", "Arquivados"],
            ["ALL", "Todos"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {!data.items.length && <p>Nenhum caso neste filtro.</p>}
      {data.items.map((item) => (
        <article className="workspace-card" key={item.id}>
          <p className="kicker">
            {item.kind === "REPORT" ? "DENÚNCIA" : "SUPORTE"} ·{" "}
            {statusLabels[item.status]}
          </p>
          <h2>{item.subject}</h2>
          <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {item.message}
          </p>
          <small>
            Protocolo {item.id} ·{" "}
            {new Date(item.createdAt).toLocaleDateString("pt-BR")} ·{" "}
            {item.category}
          </small>
          {item.targetUsername && (
            <p>Perfil informado: @{item.targetUsername}</p>
          )}
          {item.profile && (
            <p>
              <a
                href={`/${item.profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir perfil atual ↗
              </a>{" "}
              ·{" "}
              {item.profile.suspendedAt
                ? "Oculto por moderação"
                : "Sem bloqueio de moderação"}
            </p>
          )}
          {item.replyEmail && (
            <p>
              <a
                className="text-button"
                href={`mailto:${item.replyEmail}?subject=${encodeURIComponent("VibePage — protocolo " + item.id)}`}
              >
                Responder por e-mail
              </a>
            </p>
          )}
          <details>
            <summary>Últimas 20 decisões</summary>
            <p>{item.internalNote || "Ainda não há nota interna."}</p>
            {item.events.map((event, i) => (
              <p key={i}>
                {actionLabels[event.action.split(":")[0]] ??
                  "Decisão registrada"}{" "}
                · {new Date(event.createdAt).toLocaleDateString("pt-BR")}
              </p>
            ))}
          </details>
          <form
            key={item.id + ":" + item.revision}
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              const action = String(values.get("action"));
              if (
                action !== "review" &&
                !window.confirm(
                  action === "hide-profile"
                    ? "Ocultar este perfil de todas as rotas públicas até revisão administrativa?"
                    : "Retirar o bloqueio deste perfil? Ele só será público se o dono o mantiver publicado.",
                )
              )
                return;
              setBusy(true);
              setMessage("");
              try {
                const response = await fetch(`/api/admin/cases/${item.id}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...Object.fromEntries(values),
                    revision: item.revision,
                  }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                await reload(status);
                setMessage("Decisão registrada.");
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "Falha na revisão.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="manager-fieldset">
              <label>
                Estado
                <select name="status" defaultValue={item.status}>
                  {["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"].map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ação
                <select name="action">
                  <option value="review">Registrar revisão</option>
                  <option value="hide-profile" disabled={!item.profile}>
                    Ocultar perfil
                  </option>
                  <option value="restore-profile" disabled={!item.profile}>
                    Retirar bloqueio do perfil
                  </option>
                </select>
              </label>
              <label>
                Justificativa interna
                <textarea
                  name="note"
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={3}
                />
              </label>
              <button className="button" type="submit">
                Registrar decisão
              </button>
            </fieldset>
          </form>
        </article>
      ))}
      {data.cursor && (
        <button
          className="button button-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await reload(status, data.cursor!);
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Falha ao consultar.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Carregar mais casos
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
