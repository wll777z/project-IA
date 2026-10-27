import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { expect, it } from "vitest";
it("oitava migration preserva banco legado e adiciona cascatas/índices de operação", async () => {
  const pg = await PGlite.create();
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    const names = (await readdir(root))
      .filter((n) => n !== "migration_lock.toml")
      .sort();
    expect(names).toHaveLength(8);
    for (const name of names.slice(0, 7))
      await pg.exec(
        await readFile(new URL(name + "/migration.sql", root), "utf8"),
      );
    await pg.exec(
      `INSERT INTO "User" (id,name,email,"emailVerified","updatedAt") VALUES ('legacy','Legacy','legacy@example.test',true,NOW()); INSERT INTO "Theme"(id,name) VALUES ('midnight-purple','Midnight Purple'); INSERT INTO "Profile"(id,"userId",username,"displayName","updatedAt") VALUES('profile','legacy','legacy_ops','Legacy',NOW()); INSERT INTO "ProfileLink"(id,"profileId",title,url,position) VALUES('legacy-link','profile','Link','https://example.com/',0);`,
    );
    await pg.exec(
      await readFile(new URL(names[7] + "/migration.sql", root), "utf8"),
    );
    expect(
      (
        await pg.query<{ username: string; suspendedAt: unknown }>(
          `SELECT username,"suspendedAt" FROM "Profile"`,
        )
      ).rows[0],
    ).toEqual({ username: "legacy_ops", suspendedAt: null });
    expect((await pg.query(`SELECT * FROM "ProfileLink"`)).rows).toHaveLength(
      1,
    );
    await pg.exec(
      `INSERT INTO "Administrator"("userId",phone) VALUES ('legacy','+5511999999999'); INSERT INTO "SupportCase"(id,kind,category,subject,message,"profileId","updatedAt","expiresAt") VALUES ('case','REPORT','ABUSE','Test','Synthetic only','profile',NOW(),NOW()+INTERVAL '30 days'); INSERT INTO "SupportCaseEvent"(id,"caseId","actorId",action) VALUES ('event','case','legacy','review:OPEN');`,
    );
    const indexes = (
      await pg.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE tablename IN ('SupportCase','SupportCaseEvent')`,
      )
    ).rows.map((x) => x.indexname);
    expect(indexes).toContain("SupportCase_status_createdAt_id_idx");
    expect(indexes).toContain("SupportCase_expiresAt_idx");
    expect(indexes).toContain("SupportCaseEvent_actorId_idx");
    await pg.exec(`DELETE FROM "User" WHERE id='legacy'`);
    expect((await pg.query(`SELECT * FROM "Administrator"`)).rows).toHaveLength(
      0,
    );
    expect(
      (
        await pg.query<{ profileId: unknown }>(
          `SELECT "profileId" FROM "SupportCase"`,
        )
      ).rows[0].profileId,
    ).toBeNull();
    expect(
      (
        await pg.query<{ actorId: unknown }>(
          `SELECT "actorId" FROM "SupportCaseEvent"`,
        )
      ).rows[0].actorId,
    ).toBeNull();
    await pg.exec(`DELETE FROM "SupportCase" WHERE id='case'`);
    expect(
      (await pg.query(`SELECT * FROM "SupportCaseEvent"`)).rows,
    ).toHaveLength(0);
  } finally {
    await pg.close();
  }
});
