"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export function Logout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="button button-small button-secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await authClient.signOut();
            if (r.error) throw new Error();
            router.replace("/login");
            router.refresh();
          } catch {
            setError("Não foi possível sair. Tente novamente.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Sair da conta
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <div className="workspace-card danger-zone">
      <h2>Seus dados, sua escolha.</h2>
      <p>
        Excluir a conta remove permanentemente seus dados, credenciais e
        sessões. Essa ação não pode ser desfeita.
      </p>
      {!open ? (
        <button className="danger-button" onClick={() => setOpen(true)}>
          Excluir minha conta
        </button>
      ) : (
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const r = await authClient.deleteUser({ password });
              if (r.error) throw new Error();
              router.replace("/");
              router.refresh();
            } catch {
              setError(
                "Não foi possível excluir. Confira sua senha e tente novamente.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Confirme sua senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button disabled={busy} type="submit" className="danger-button">
            {busy ? "Excluindo…" : "Confirmar exclusão permanente"}
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setOpen(false);
              setPassword("");
            }}
          >
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
