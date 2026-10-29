// Do not retain arbitrary labels (URI, tokens, IP, Host) or raw exposition text.
export function caddyMetrics(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const metric =
      /^caddy_http_request_duration_seconds_(count|sum)\{([^}]*)\} ([0-9.eE+-]+)$/.exec(
        line,
      );
    if (!metric) continue;
    const labels = Object.fromEntries(
      [...metric[2].matchAll(/([a-z_]+)="([^"\\]*)"/g)].map((m) => [
        m[1],
        m[2],
      ]),
    );
    if (
      !/^[0-9]{3}$/.test(labels.code || "") ||
      !/^[A-Z]{1,12}$/.test(labels.method || "") ||
      !/^[a-z0-9_-]{1,60}$/i.test(labels.handler || "")
    )
      continue;
    const value = Number(metric[3]);
    if (!Number.isFinite(value) || value < 0) continue;
    rows.push({
      measurement: metric[1],
      code: labels.code,
      method: labels.method,
      handler: labels.handler,
      value,
    });
    if (rows.length >= 500) break;
  }
  return rows;
}
