"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
export function ShareLink({
  username,
  url,
}: {
  username: string;
  url: string;
}) {
  const [status, setStatus] = useState("");
  return (
    <div className="share-link">
      <span title={url}>/{username}</span>
      <button
        type="button"
        aria-label="Copiar link do perfil"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setStatus("Copiado!");
          } catch {
            setStatus("Copie o endereço da página pública pelo navegador.");
          }
        }}
      >
        {status === "Copiado!" ? <Check size={16} /> : <Copy size={16} />}{" "}
        {status || "Copiar link"}
      </button>
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  );
}
