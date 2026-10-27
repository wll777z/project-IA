"use client";
import { useState } from "react";

export function PixKeyCopy({ pixKey }: { pixKey: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setStatus("Chave copiada.");
    } catch {
      setStatus("Não foi possível copiar automaticamente. Selecione a chave.");
    }
  }
  return (
    <section className="workspace-card">
      <p><strong>Chave cadastrada pelo responsável:</strong></p>
      <p style={{ overflowWrap: "anywhere" }}><code>{pixKey}</code></p>
      <button type="button" className="button" onClick={copy}>Copiar chave Pix</button>
      <p role="status" aria-live="polite">{status}</p>
    </section>
  );
}
