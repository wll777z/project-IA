"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BillingButton({
  action,
  label,
  className = "button",
}: {
  action: "checkout" | "portal";
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await fetch(`/api/billing/${action}`, { method: "POST" });
            const data = await r.json().catch(() => ({}));
            if (r.status === 401) {
              router.replace("/login");
              return;
            }
            if (!r.ok || !data.url)
              throw new Error(
                data.error || "Não foi possível abrir o pagamento.",
              );
            window.location.href = data.url;
          } catch (e) {
            setError(e instanceof Error ? e.message : "Tente novamente.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Só um instante…" : label}
      </button>
      {error && (
        <p role="alert" className="status-message">
          {error}
        </p>
      )}
    </>
  );
}
