"use client";
import { useState } from "react";
export function SupportForm({
  username,
  version,
}: {
  username: string;
  version: string;
}) {
  const [kind, setKind] = useState(username ? "REPORT" : "SUPPORT"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [receipt, setReceipt] = useState("");
  return (
    <form
      className="auth-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = new FormData(form);
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...Object.fromEntries(fields),
              kind,
              noticeVersion: version,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          setReceipt(result.id);
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Não foi possível enviar.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {receipt ? (
        <p role="status">
          Solicitação recebida. Protocolo: <strong>{receipt}</strong>. Guarde-o
          para informar à equipe. Se deixou e-mail, o responsável poderá
          responder por ele.
        </p>
      ) : (
        <fieldset disabled={busy} className="manager-fieldset">
          <label>
            Tipo
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="SUPPORT">Suporte ou privacidade</option>
              <option value="REPORT">Denunciar perfil público</option>
            </select>
          </label>
          <label>
            Perfil (username, obrigatório para denúncia)
            <input
              name="username"
              defaultValue={username}
              maxLength={24}
              required={kind === "REPORT"}
              autoCapitalize="none"
            />
          </label>
          <label>
            Categoria
            <select name="category">
              <option value="TECHNICAL">Problema técnico</option>
              <option value="ACCOUNT">Conta</option>
              <option value="PRIVACY">Privacidade e dados</option>
              <option value="PHISHING">Link suspeito ou fraude</option>
              <option value="ABUSE">Abuso</option>
              <option value="ILLEGAL">Conteúdo ilegal</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>
          <label>
            Assunto
            <input name="subject" required maxLength={120} />
          </label>
          <label>
            Descrição
            <textarea name="message" required maxLength={2000} rows={5} />
          </label>
          <p>
            Não envie senhas, tokens, documentos ou dados privados de outras
            pessoas. Não há envio de arquivos neste formulário.
          </p>
          <label>
            E-mail para resposta (opcional)
            <input
              name="replyEmail"
              type="email"
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <button type="submit" className="button">
            {busy ? "Enviando…" : "Enviar solicitação"}
          </button>
        </fieldset>
      )}
      {message && <p role="alert">{message}</p>}
    </form>
  );
}
