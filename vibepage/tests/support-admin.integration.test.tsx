import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { setupDB } from "./setup-db";
import { SupportQueue } from "../src/components/support-queue";
let f: Awaited<ReturnType<typeof setupDB>>,
  auth: typeof import("../src/lib/auth").auth,
  p: typeof import("../src/lib/profiles"),
  service: typeof import("../src/lib/support"),
  admins: typeof import("../src/lib/administrators");
let intake: typeof import("../src/app/api/support/route"),
  queue: typeof import("../src/app/api/admin/cases/route"),
  review: typeof import("../src/app/api/admin/cases/[id]/route");
const origin = "http://localhost:3000",
  password = "isolated-support-password-123";
const users: Record<string, { id: string; cookie: string; email: string }> = {};
let reportId: string;
const notices = {
  SUPPORT_INTAKE_ENABLED: "true",
  SUPPORT_RETENTION_DAYS: "30",
  LEGAL_CONTROLLER_NAME: "Synthetic staging operator",
  LEGAL_CONTACT_EMAIL: "privacy@example.test",
  LEGAL_NOTICE_VERSION: "test-v1",
  LEGAL_RETENTION_NOTICE: "Synthetic retention notice for isolated tests only.",
  LEGAL_AGE_NOTICE: "Synthetic age policy for isolated tests only.",
};
const body = (extra = {}) => ({
  kind: "SUPPORT",
  category: "TECHNICAL",
  subject: "Ajuda com perfil",
  message: 'Texto <img src=x onerror="alert(1)">',
  replyEmail: "",
  username: "",
  noticeVersion: "test-v1",
  ...extra,
});
function req(
  path: string,
  data?: unknown,
  cookie = "",
  requestOrigin = origin,
) {
  return new Request(origin + path, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      origin: requestOrigin,
      cookie,
      "content-type": "application/json",
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
const action = (
  id: string,
  data: unknown,
  cookie = users.admin.cookie,
  requestOrigin = origin,
) =>
  review.POST(req("/api/admin/cases/" + id, data, cookie, requestOrigin), {
    params: Promise.resolve({ id }),
  });
beforeAll(async () => {
  f = await setupDB();
  auth = (await import("../src/lib/auth")).auth;
  p = await import("../src/lib/profiles");
  service = await import("../src/lib/support");
  admins = await import("../src/lib/administrators");
  intake = await import("../src/app/api/support/route");
  queue = await import("../src/app/api/admin/cases/route");
  review = await import("../src/app/api/admin/cases/[id]/route");
  Object.assign(process.env, notices);
  for (const name of ["admin", "normal", "pending"]) {
    const email = name + "@example.test";
    await auth.api.signUpEmail({ body: { name, email, password } });
    const user = await f.db.user.findUniqueOrThrow({ where: { email } });
    if (name !== "pending")
      await f.db.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    const login = await auth.handler(
      req("/api/auth/sign-in/email", { email, password }),
    );
    expect(login.status).toBe(200);
    users[name] = {
      id: user.id,
      email,
      cookie: login.headers.get("set-cookie")!.split(";")[0],
    };
  }
  await admins.grantAdministrator(users.admin.email, "+5511999999999");
  await p.saveProfile(users.normal.id, {
    ...p.emptyProfile("Normal"),
    username: "support_target",
    published: true,
  });
});
beforeEach(async () => {
  await f.db.rateLimit.deleteMany();
});
afterAll(async () => f?.close());
it("bootstrap rejeita senha curta e nunca altera senha no modo de conta existente", async () => {
  const { bootstrapSchema } = await import("../src/lib/admin-bootstrap");
  expect(
    bootstrapSchema.safeParse({
      email: "operator@example.test",
      phone: "+5511999999999",
      existing: false,
      password: "short-test",
    }).success,
  ).toBe(false);
  expect(
    bootstrapSchema.safeParse({
      email: "operator@example.test",
      phone: "+5511999999999",
      existing: true,
      password,
    }).success,
  ).toBe(false);
  expect(
    admins.administratorContactSchema.parse({
      email: "OPERATOR@example.test",
      phone: "11 999999999",
    }).phone,
  ).toBe("+5511999999999");
  await expect(
    admins.grantAdministrator(users.pending.email, "+5511888888888"),
  ).rejects.toThrow("Confirme");
});
it("canal incompleto não aceita solicitações nem promete recebimento", async () => {
  process.env.SUPPORT_INTAKE_ENABLED = "false";
  expect((await intake.POST(req("/api/support", body()))).status).toBe(503);
  expect(await f.db.supportCase.count()).toBe(0);
  process.env.SUPPORT_INTAKE_ENABLED = "true";
  delete process.env.LEGAL_CONTACT_EMAIL;
  expect((await intake.POST(req("/api/support", body()))).status).toBe(503);
  process.env.LEGAL_CONTACT_EMAIL = notices.LEGAL_CONTACT_EMAIL;
});
it("solicitação válida persiste e a resposta pública expõe somente protocolo", async () => {
  const response = await intake.POST(
    req("/api/support", body({ replyEmail: users.normal.email })),
  );
  expect(response.status).toBe(201);
  const receipt = await response.json();
  expect(Object.keys(receipt)).toEqual(["id"]);
  expect(await f.db.supportCase.count()).toBe(1);
  const stored = await f.db.supportCase.findUniqueOrThrow({
    where: { id: receipt.id },
  });
  expect(stored.replyEmail).toBe(users.normal.email);
  expect(
    stored.expiresAt.getTime() - stored.createdAt.getTime(),
  ).toBeGreaterThan(29 * 86400000);
});
it("recusa origem externa, versão antiga e perfil não publicado", async () => {
  expect(
    (
      await intake.POST(
        req("/api/support", body(), "", "https://attacker.example"),
      )
    ).status,
  ).toBe(403);
  expect(
    (await intake.POST(req("/api/support", body({ noticeVersion: "old" }))))
      .status,
  ).toBe(409);
  expect(
    (
      await intake.POST(
        req(
          "/api/support",
          body({ kind: "REPORT", username: "missing_target" }),
        ),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await intake.POST(
        req("/api/support", body({ message: "invalid\u0000text" })),
      )
    ).status,
  ).toBe(400);
});
it("denúncia publicada fica em fila privada sem divulgar telefone administrativo", async () => {
  const response = await intake.POST(
    req(
      "/api/support",
      body({
        kind: "REPORT",
        category: "PHISHING",
        username: "support_target",
      }),
    ),
  );
  expect(response.status).toBe(201);
  reportId = (await response.json()).id;
  expect((await queue.GET(req("/api/admin/cases"))).status).toBe(401);
  expect(
    (await queue.GET(req("/api/admin/cases", undefined, users.normal.cookie)))
      .status,
  ).toBe(403);
  await f.db.administrator.create({
    data: { userId: users.pending.id, phone: "+5511888888888" },
  });
  expect(
    (await queue.GET(req("/api/admin/cases", undefined, users.pending.cookie)))
      .status,
  ).toBe(403);
  const responseAdmin = await queue.GET(
    req("/api/admin/cases", undefined, users.admin.cookie),
  );
  expect(responseAdmin.status).toBe(200);
  expect(responseAdmin.headers.get("cache-control")).toContain("no-store");
  const json = await responseAdmin.json();
  expect(json.items.length).toBe(2);
  expect(JSON.stringify(json)).not.toContain("+5511999999999");
  const html = renderToStaticMarkup(
    <SupportQueue initial={await service.listSupportCases("ALL")} />,
  );
  expect(html).toContain("&lt;img");
  expect(html).not.toContain("<img src=x");
  const resolved = await service.listSupportCases("ALL");
  resolved.items = resolved.items.map((item) => ({
    ...item,
    status: "RESOLVED",
  }));
  const resolvedHTML = renderToStaticMarkup(
    <SupportQueue initial={resolved} />,
  );
  expect(resolvedHTML).toContain('<option value="RESOLVED" selected="">');
  const selectedStatuses = [
    ...resolvedHTML.matchAll(/<select name="status">([\s\S]*?)<\/select>/g),
  ];
  expect(selectedStatuses).toHaveLength(resolved.items.length);
  for (const [, options] of selectedStatuses) {
    expect(options).toContain('<option value="RESOLVED" selected="">');
    expect(options).not.toContain('<option value="OPEN" selected="">');
  }
});
it("não administrador e CSRF não executam moderação", async () => {
  const data = {
    action: "hide-profile",
    status: "IN_REVIEW",
    note: "Revisão em teste isolado",
    revision: 0,
  };
  expect((await action(reportId, data, users.normal.cookie)).status).toBe(403);
  expect(
    (
      await action(
        reportId,
        data,
        users.admin.cookie,
        "https://attacker.example",
      )
    ).status,
  ).toBe(403);
  expect(await f.db.supportCaseEvent.count()).toBe(0);
});
it("moderação bloqueia publicação, QR e VibeCard mesmo após save do dono", async () => {
  expect(
    (
      await action(reportId, {
        action: "hide-profile",
        status: "IN_REVIEW",
        note: "Ocultação de teste aprovada",
        revision: 0,
      })
    ).status,
  ).toBe(200);
  const pub = await import("../src/lib/public-profile");
  expect(await pub.getPublicProfile("support_target")).toBeNull();
  const qr = await import("../src/app/api/qr/[username]/route"),
    vibe = await import("../src/app/api/vibecard/[username]/route");
  const params = { params: Promise.resolve({ username: "support_target" }) };
  expect((await qr.GET(req("/api/qr/support_target"), params)).status).toBe(
    404,
  );
  expect(
    (await vibe.GET(req("/api/vibecard/support_target"), params)).status,
  ).toBe(404);
  let profile = (await p.getOwnedProfile(users.normal.id))!;
  profile = await p.saveProfile(users.normal.id, {
    ...profile,
    published: true,
    bio: "Edição permitida, bloqueio mantido",
  });
  expect(await pub.getPublicProfile("support_target")).toBeNull();
  await expect(
    p.saveProfile(users.normal.id, { ...profile, suspendedAt: null }),
  ).rejects.toThrow();
  expect(
    (
      await action(reportId, {
        action: "restore-profile",
        status: "RESOLVED",
        note: "Bloqueio retirado após teste",
        revision: 1,
      })
    ).status,
  ).toBe(200);
  expect((await pub.getPublicProfile("support_target"))?.profile.bio).toContain(
    "bloqueio mantido",
  );
  expect(await f.db.supportCaseEvent.count()).toBe(2);
});
it("revisão antiga é recusada e caso expirado não pode ser alterado", async () => {
  expect(
    (
      await action(reportId, {
        action: "review",
        status: "OPEN",
        note: "Revisão antiga de teste",
        revision: 0,
      })
    ).status,
  ).toBe(409);
  expect(await f.db.supportCaseEvent.count()).toBe(2);
  const item = await service.createSupportCase(body());
  await f.db.supportCase.update({
    where: { id: item.id },
    data: { expiresAt: new Date(0) },
  });
  expect(
    (
      await action(item.id, {
        action: "review",
        status: "RESOLVED",
        note: "Caso expirado em teste",
        revision: 0,
      })
    ).status,
  ).toBe(404);
});
it("paginação é limitada a vinte itens e não duplica o cursor", async () => {
  for (let i = 0; i < 21; i++)
    await service.createSupportCase(body({ subject: "Caso paginado " + i }));
  const first = await service.listSupportCases("ALL");
  expect(first.items).toHaveLength(20);
  expect(first.cursor).not.toBeNull();
  const second = await service.listSupportCases("ALL", first.cursor!);
  expect(
    second.items.every((i) => !first.items.some((f) => f.id === i.id)),
  ).toBe(true);
});
it("rate limit impede abuso do formulário público", async () => {
  for (let i = 0; i < 5; i++)
    expect((await intake.POST(req("/api/support", body()))).status).toBe(201);
  expect((await intake.POST(req("/api/support", body()))).status).toBe(429);
});
it("exclusão limpa contato, revoga administrador e cleanup remove casos expirados/eventos", async () => {
  expect(
    (
      await auth.handler(
        req("/api/auth/delete-user", { password }, users.normal.cookie),
      )
    ).status,
  ).toBe(200);
  expect(
    await f.db.supportCase.count({ where: { replyEmail: users.normal.email } }),
  ).toBe(0);
  expect(
    (await f.db.supportCase.findUniqueOrThrow({ where: { id: reportId } }))
      .profileId,
  ).toBeNull();
  expect(
    (
      await auth.handler(
        req("/api/auth/delete-user", { password }, users.admin.cookie),
      )
    ).status,
  ).toBe(200);
  expect(
    await f.db.administrator.count({ where: { userId: users.admin.id } }),
  ).toBe(0);
  expect(
    await f.db.supportCaseEvent.count({ where: { actorId: users.admin.id } }),
  ).toBe(0);
  await f.db.supportCase.updateMany({ data: { expiresAt: new Date(0) } });
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "scripts/cleanup.ts"],
      { env: { ...process.env }, stdio: "ignore" },
    );
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Cleanup falhou")),
    );
  });
  expect(await f.db.supportCase.count()).toBe(0);
  expect(await f.db.supportCaseEvent.count()).toBe(0);
});
