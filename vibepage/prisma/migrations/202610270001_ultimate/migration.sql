ALTER TABLE "Profile"
 ADD COLUMN "backgroundEffect" TEXT NOT NULL DEFAULT 'none' CHECK ("backgroundEffect" IN ('none','particles','stars','gradient','aurora','digital','nebula','waves','parallax')),
 ADD COLUMN "avatarEffect" TEXT NOT NULL DEFAULT 'none' CHECK ("avatarEffect" IN ('none','pulse','halo','ring','holographic','hover')),
 ADD COLUMN "buttonEffect" TEXT NOT NULL DEFAULT 'none' CHECK ("buttonEffect" IN ('none','neon','magnetic','gradient','glass','shine','press')),
 ADD COLUMN "entranceEffect" TEXT NOT NULL DEFAULT 'fade' CHECK ("entranceEffect" IN ('none','fade','slide','zoom','sequence')),
 ADD COLUMN "fontFamily" TEXT NOT NULL DEFAULT 'modern' CHECK ("fontFamily" IN ('modern','mono','rounded'));
CREATE TABLE "GamerCard" (
 "id" TEXT PRIMARY KEY,
 "profileId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "game" TEXT NOT NULL CHECK (game IN ('roblox','discord','minecraft','fortnite','valorant','free-fire','league-of-legends','pokemon','custom')),
 "displayName" VARCHAR(60) NOT NULL CHECK (length("displayName")>0),
 "handle" VARCHAR(60) NOT NULL DEFAULT '', "detail" VARCHAR(100) NOT NULL DEFAULT '',
 "edition" TEXT NOT NULL DEFAULT '' CHECK (edition IN ('','java','bedrock')),
 "url" VARCHAR(2048) NOT NULL DEFAULT '' CHECK (url='' OR url LIKE 'https://%'),
 "avatarKey" TEXT,
 "color" VARCHAR(7) NOT NULL DEFAULT '#a78bfa' CHECK (color ~ '^#[a-fA-F0-9]{6}$'),
 "style" TEXT NOT NULL DEFAULT 'minimal' CHECK (style IN ('neon','minimal','glass','cyberpunk','holographic','pixel')),
 "layout" TEXT NOT NULL DEFAULT 'compact' CHECK (layout IN ('compact','banner')),
 "icon" TEXT NOT NULL DEFAULT 'gamepad' CHECK (icon IN ('gamepad','swords','blocks','sparkles','headset')),
 "glow" BOOLEAN NOT NULL DEFAULT false, "animated" BOOLEAN NOT NULL DEFAULT false,
 "position" INTEGER NOT NULL
);
CREATE UNIQUE INDEX "GamerCard_profileId_position_key" ON "GamerCard"("profileId","position");
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_safe_media";
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_safe_media" CHECK (kind IN ('avatar','background','gamer-avatar') AND "mimeType"='image/webp' AND octet_length(content)<=1048576 AND width>0 AND height>0);
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_slot_check";
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_slot_check" CHECK ((kind IN ('avatar','background') AND slot IN (0,1)) OR (kind='gamer-avatar' AND slot>=0 AND slot<20));
