"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
export function ResetForm({ token }: { token?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="auth-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const data = new FormData(e.currentTarget);
        try {
          if (token) {
            const r = await authClient.resetPassword({
              token,
              newPassword: String(data.get("password")),
            });
            setMessage(
              r.error
                ? "Link inválido ou expirado. Solicite outro link."
                : "Senha atualizada. Você já pode entrar com a nova senha.",
            );
          } else {
            const r = await authClient.requestPasswordReset({
              email: String(data.get("email")),
              redirectTo: "/redefinir-senha",
            });
            setMessage(
              r.error
                ? "Não foi possível enviar agora. Aguarde e tente novamente."
                : "Se houver uma conta para esse e-mail, você receberá as instruções.",
            );
          }
        } catch {
          setMessage("Não foi possível conectar. Tente novamente.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {token ? "Nova senha" : "E-mail"}
        <input
          name={token ? "password" : "email"}
          type={token ? "password" : "email"}
          autoComplete={token ? "new-password" : "email"}
          required
          minLength={token ? 12 : undefined}
          maxLength={token ? 128 : 254}
        />
      </label>
      {message && (
        <p role="status" className="status-message">
          {message}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy
          ? "Só um instante…"
          : token
            ? "Salvar nova senha"
            : "Enviar instruções"}
      </button>
    </form>
  );
}
