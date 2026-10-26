ALTER TABLE "PageView" ADD COLUMN "clicks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_clicks_positive" CHECK (clicks >= 0);
CREATE TABLE "LinkClick" (
 "linkId" TEXT NOT NULL REFERENCES "ProfileLink"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "day" DATE NOT NULL,
 "count" INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
 PRIMARY KEY ("linkId","day")
);
CREATE INDEX "LinkClick_day_idx" ON "LinkClick"("day");
