"use client";
import { useEffect, useRef } from "react";
export function ViewRecorder({ username }: { username: string }) {
  const sent = useRef(false);
  useEffect(() => {
    function record() {
      if (sent.current || document.visibilityState !== "visible") return;
      sent.current = true;
      const key = `vibepage:view:${username}:${new Date().toISOString().slice(0, 10)}`;
      try {
        if (sessionStorage.getItem(key)) return;
      } catch {}
      void fetch(`/api/views/${username}`, { method: "POST", keepalive: true })
        .then((r) => {
          if (r.ok)
            try {
              sessionStorage.setItem(key, "1");
            } catch {}
        })
        .catch(() => {});
    }
    record();
    document.addEventListener("visibilitychange", record);
    return () => document.removeEventListener("visibilitychange", record);
  }, [username]);
  return null;
}
