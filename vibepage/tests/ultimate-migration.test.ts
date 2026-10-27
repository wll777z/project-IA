import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { it, expect } from "vitest";
it("aplica a migration aditiva em perfil existente sem apagar identidade ou links", async () => {
  const pg = await PGlite.create();
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    const migrations = (await readdir(root))
      .filter((n) => n !== "migration_lock.toml")
      .sort();
    for (const name of migrations.filter((n) => n < "202610270001_ultimate"))
      await pg.exec(
        await readFile(new URL(name + "/migration.sql", root), "utf8"),
      );
    await pg.exec(
      `INSERT INTO "User"(id,name,email,"updatedAt") VALUES ('legacy','Legacy','legacy@example.com',NOW()); INSERT INTO "Theme"(id,name) VALUES ('midnight-purple','Midnight Purple'); INSERT INTO "Profile"(id,"userId",username,"displayName","updatedAt") VALUES ('profile','legacy','legacy','Legacy',NOW()); INSERT INTO "ProfileLink"(id,"profileId",title,url,position) VALUES ('link','profile','Canal','https://example.com',0);`,
    );
    for (const name of migrations.filter((n) => n >= "202610270001_ultimate"))
      await pg.exec(
        await readFile(new URL(name + "/migration.sql", root), "utf8"),
      );
    expect(
      (
        await pg.query<{ premium: boolean }>(
          `SELECT premium FROM "Theme" WHERE id='aurora-blue'`,
        )
      ).rows[0].premium,
    ).toBe(true);
    const result = await pg.query<{
      username: string;
      backgroundEffect: string;
      entranceEffect: string;
      studio: { layout: string };
      vibeCardStyle: string;
      previousAppearance: unknown;
    }>(
      `SELECT username,"backgroundEffect","entranceEffect",studio,"vibeCardStyle","previousAppearance" FROM "Profile"`,
    );
    expect(result.rows[0]).toEqual({
      username: "legacy",
      backgroundEffect: "none",
      entranceEffect: "fade",
      studio: expect.objectContaining({ layout: "classic", columns: 1 }),
      vibeCardStyle: "minimal",
      previousAppearance: null,
    });
    for (const table of [
      "ProfileBlock",
      "SavedAppearance",
      "AppearanceSchedule",
      "CardClick",
    ])
      expect((await pg.query(`SELECT * FROM "${table}"`)).rows).toHaveLength(0);
    // New dashboard routes must not reserve a formerly valid root username.
    await pg.exec(`UPDATE "Profile" SET username='pro' WHERE id='profile'`);
    expect(
      (await pg.query<{ username: string }>(`SELECT username FROM "Profile"`))
        .rows[0].username,
    ).toBe("pro");
    expect((await pg.query(`SELECT * FROM "ProfileLink"`)).rows).toHaveLength(
      1,
    );
  } finally {
    await pg.close();
  }
});
