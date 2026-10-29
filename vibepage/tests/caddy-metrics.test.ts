import { expect, it } from "vitest";
import { caddyMetrics } from "../scripts/caddy-metrics.mjs";
it("extracts cumulative status/latency series without retaining arbitrary private labels", () => {
  const result = caddyMetrics(
    'caddy_http_request_duration_seconds_count{handler="reverse_proxy",code="429",method="POST",path="/reset?token=private",host="private.example"} 3\ncaddy_http_request_duration_seconds_sum{handler="reverse_proxy",code="500",method="GET"} 0.25',
  );
  expect(result).toEqual([
    {
      measurement: "count",
      code: "429",
      method: "POST",
      handler: "reverse_proxy",
      value: 3,
    },
    {
      measurement: "sum",
      code: "500",
      method: "GET",
      handler: "reverse_proxy",
      value: 0.25,
    },
  ]);
  expect(JSON.stringify(result)).not.toMatch(/private|token|path|host/);
});
it("rejects other metric families, malformed labels and non-finite values", () => {
  expect(
    caddyMetrics(
      'caddy_admin_http_requests_total{code="200"} 5\ncaddy_http_request_duration_seconds_count{handler="private.example/path",code="500",method="GET"} 1\ncaddy_http_request_duration_seconds_sum{handler="reverse_proxy",code="500",method="GET"} 1e999',
    ),
  ).toEqual([]);
});
