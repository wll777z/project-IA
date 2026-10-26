ALTER TABLE "Upload" ADD COLUMN "slot" INTEGER NOT NULL DEFAULT 0 CHECK (slot IN (0,1));
DROP INDEX "Upload_userId_kind_key";
CREATE UNIQUE INDEX "Upload_userId_kind_slot_key" ON "Upload"("userId","kind","slot");
