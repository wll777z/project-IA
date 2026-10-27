ALTER TABLE "Profile" ADD COLUMN "suspendedAt" TIMESTAMP(3);
CREATE TABLE "Administrator" (
 "userId" TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
 phone VARCHAR(16) NOT NULL CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "SupportCase" (
 id TEXT PRIMARY KEY,
 kind VARCHAR(10) NOT NULL CHECK(kind IN ('SUPPORT','REPORT')),
 category VARCHAR(24) NOT NULL CHECK(category IN ('ACCOUNT','PRIVACY','TECHNICAL','PHISHING','ABUSE','ILLEGAL','OTHER')),
 subject VARCHAR(120) NOT NULL CHECK(length(subject)>0), message VARCHAR(2000) NOT NULL CHECK(length(message)>0),
 "replyEmail" VARCHAR(254), "targetUsername" VARCHAR(24),
 "profileId" TEXT REFERENCES "Profile"(id) ON DELETE SET NULL ON UPDATE CASCADE,
 status VARCHAR(16) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','IN_REVIEW','RESOLVED','DISMISSED')),
 "internalNote" VARCHAR(1000) NOT NULL DEFAULT '', revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "SupportCase_status_createdAt_id_idx" ON "SupportCase"(status,"createdAt",id);
CREATE INDEX "SupportCase_expiresAt_idx" ON "SupportCase"("expiresAt");
CREATE INDEX "SupportCase_profileId_idx" ON "SupportCase"("profileId");
CREATE TABLE "SupportCaseEvent" (
 id TEXT PRIMARY KEY,"caseId" TEXT NOT NULL REFERENCES "SupportCase"(id) ON DELETE CASCADE ON UPDATE CASCADE,
 "actorId" TEXT REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
 action VARCHAR(32) NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "SupportCaseEvent_caseId_createdAt_idx" ON "SupportCaseEvent"("caseId","createdAt");
CREATE INDEX "SupportCaseEvent_actorId_idx" ON "SupportCaseEvent"("actorId");
