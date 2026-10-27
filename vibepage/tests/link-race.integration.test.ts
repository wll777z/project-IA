import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { setupDB } from "./setup-db";
let fixture: Awaited<ReturnType<typeof setupDB>>;
beforeAll(async () => {
  fixture = await setupDB();
});
afterAll(async () => fixture?.close());
it("uma colisão de id após a pré-validação não altera um link de outro dono", async () => {
  const { db } = fixture;
  const { saveProfile, emptyProfile } = await import("../src/lib/profiles");
  await db.user.createMany({
    data: [
      { id: "writer", name: "Writer", email: "writer@example.com" },
      { id: "victim", name: "Victim", email: "victim@example.com" },
    ],
  });
  await db.theme.create({
    data: { id: "midnight-purple", name: "Midnight Purple" },
  });
  const victim = await db.profile.create({
    data: {
      userId: "victim",
      username: "victim_player",
      displayName: "Victim",
    },
  });
  const contended = randomUUID();
  const transaction = db.$transaction.bind(db);
  const intercept = vi
    .spyOn(db, "$transaction")
    .mockImplementation((action, options) =>
      transaction(async (tx) => {
        const findFirst = tx.profileLink.findFirst.bind(tx.profileLink);
        const interleave = async (args: Parameters<typeof findFirst>[0]) => {
          const before = await findFirst(args);
          // Deterministic interleaving: another owner claims an otherwise new id
          // after the ownership preflight. Constraints and writes are real PostgreSQL.
          await tx.profileLink.create({
            data: {
              id: contended,
              profileId: victim.id,
              title: "Victim destination",
              url: "https://example.org/victim",
              position: 0,
            },
          });
          return before;
        };
        // The service awaits this method; it does not use Prisma's relation chaining.
        vi.spyOn(tx.profileLink, "findFirst").mockImplementationOnce(
          interleave as unknown as typeof tx.profileLink.findFirst,
        );
        return action(tx);
      }, options),
    );
  try {
    await expect(
      saveProfile("writer", {
        ...emptyProfile("Writer"),
        username: "writer_player",
        links: [
          {
            id: contended,
            title: "Injected",
            url: "https://example.com/injected",
          },
        ],
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  } finally {
    intercept.mockRestore();
  }
  expect(await db.profile.count({ where: { userId: "writer" } })).toBe(0);
  expect(await db.profileLink.count()).toBe(0);
  expect(
    (await db.profile.findUniqueOrThrow({ where: { id: victim.id } }))
      .displayName,
  ).toBe("Victim");
});
