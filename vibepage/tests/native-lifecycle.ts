// Executed only by scripts/native-acceptance.mjs in its new synthetic container.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { nativeTestURL } from "../scripts/native-test-env.mjs";
assert(nativeTestURL(), "Native fixture URL required");
process.env.DATABASE_URL = nativeTestURL()!;
const { db } = await import("../src/lib/db");
const profiles = await import("../src/lib/profiles");
const appearance = await import("../src/lib/appearance-store");
const { getPublicProfile } = await import("../src/lib/public-profile");
const userId = "native-acceptance-owner";
try {
  if (process.argv[2] === "create") {
    await db.user.create({
      data: { id: userId, name: "Native QA", email: "native@example.test" },
    });
    await db.entitlement.create({ data: { userId, plan: "PRO" } });
    const { demoProfile } = await import("../src/lib/demo-profile");
    let profile = await profiles.saveProfile(userId, {
      ...demoProfile,
      username: "native_acceptance",
      published: true,
      blocks: [
        {
          id: randomUUID(),
          kind: "achievement",
          title: "Native",
          description: "Synthetic",
          icon: "sparkles",
          url: "",
          imageKeys: [],
          items: [],
          game: "Minecraft",
          date: "2026-10-28",
          cardId: null,
          hidden: false,
          width: 1,
        },
      ],
    });
    const race = await Promise.allSettled([
      profiles.saveProfile(userId, { ...profile, bio: "First session" }),
      profiles.saveProfile(userId, { ...profile, bio: "Second session" }),
    ]);
    assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(race.filter((r) => r.status === "rejected").length, 1);
    profile = (await profiles.getOwnedProfile(userId))!;
    assert.equal(profile.links.length, 2);
    assert.equal(profile.gamerCards.length, 1);
    assert.equal(profile.blocks.length, 1);
    const collection = await appearance.changeAppearance(userId, {
      action: "create",
      name: "Native collection",
    });
    assert("id" in collection);
    const start = new Date(Date.now() + 3600000),
      end = new Date(start.getTime() + 3600000);
    await appearance.changeSchedule(userId, {
      action: "create",
      appearanceId: collection.id,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      timeZone: "UTC",
    });
    await db.entitlement.update({
      where: { userId },
      data: { expiresAt: new Date(0) },
    });
    assert.equal(
      (await getPublicProfile(profile.username))!.profile.blocks.length,
      0,
    );
    assert.equal((await profiles.getOwnedProfile(userId))!.blocks.length, 1);
    assert.equal((await appearance.listAppearances(userId)).items.length, 1);
    for (const [id, expiresAt] of [
      ["expired", new Date(0)],
      ["live", new Date(Date.now() + 86400000)],
    ] as const) {
      await db.session.create({
        data: {
          id: `native-${id}`,
          token: `native-token-${id}`,
          userId,
          expiresAt,
        },
      });
      await db.verification.create({
        data: {
          id: `native-${id}`,
          identifier: `native-${id}`,
          value: "synthetic",
          expiresAt,
        },
      });
    }
  } else if (process.argv[2] === "restart") {
    const probe = createServer();
    await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
    const address = probe.address();
    assert(address && typeof address !== "string");
    const port = address.port;
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    const origin = `http://127.0.0.1:${port}`;
    const child = spawn(process.execPath, [".next/standalone/launch.mjs"], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: String(port),
        BETTER_AUTH_URL: origin,
      },
      stdio: "ignore",
    });
    try {
      const deadline = Date.now() + 30000;
      while (true) {
        try {
          assert.equal((await fetch(origin + "/api/health")).status, 200);
          break;
        } catch (error) {
          if (Date.now() >= deadline || child.exitCode !== null) throw error;
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      const page = await fetch(origin + "/native_acceptance");
      assert.equal(page.status, 200);
      assert((await page.text()).includes("native_acceptance"));
    } finally {
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once("exit", () => resolve());
        setTimeout(() => {
          child.kill("SIGKILL");
          resolve();
        }, 5000).unref();
      });
    }
  } else if (process.argv[2] === "cleanup") {
    assert.equal(
      await db.session.count({ where: { id: "native-expired" } }),
      0,
    );
    assert.equal(
      await db.verification.count({ where: { id: "native-expired" } }),
      0,
    );
    assert.equal(await db.session.count({ where: { id: "native-live" } }), 1);
    assert.equal(
      await db.verification.count({ where: { id: "native-live" } }),
      1,
    );
    assert.equal((await profiles.getOwnedProfile(userId))!.links.length, 2);
  } else if (process.argv[2] === "delete") {
    const profile = await db.profile.findUniqueOrThrow({ where: { userId } });
    await db.user.delete({ where: { id: userId } });
    for (const count of await Promise.all([
      db.profileLink.count({ where: { profileId: profile.id } }),
      db.gamerCard.count({ where: { profileId: profile.id } }),
      db.profileBlock.count({ where: { profileId: profile.id } }),
      db.savedAppearance.count({ where: { userId } }),
      db.appearanceSchedule.count({ where: { userId } }),
      db.session.count({ where: { userId } }),
    ]))
      assert.equal(count, 0);
  } else throw new Error("Unknown native lifecycle phase");
  console.log(`PASS native lifecycle ${process.argv[2]}`);
} finally {
  await db.$disconnect();
}
