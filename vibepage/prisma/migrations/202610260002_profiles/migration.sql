ALTER TABLE "Profile" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "backgroundColor" VARCHAR(7) NOT NULL DEFAULT '#100c1b',
ADD COLUMN "buttonStyle" TEXT NOT NULL DEFAULT 'soft',
ADD COLUMN "animation" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "hideBranding" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "Upload" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "kind" TEXT NOT NULL,
 "content" BYTEA NOT NULL,
 "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
 "width" INTEGER NOT NULL,
 "height" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Upload_userId_kind_key" ON "Upload"("userId","kind");
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_safe_media" CHECK (kind IN ('avatar','background') AND "mimeType"='image/webp' AND octet_length(content)<=1048576 AND width>0 AND height>0);
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_revision_positive" CHECK (revision>=0);
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_background_color" CHECK ("backgroundColor" ~ '^#[0-9a-fA-F]{6}$');
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_button_style" CHECK ("buttonStyle" IN ('soft','outline','pill'));
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_animation" CHECK (animation IN ('none','float','glow'));
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_username_reserved";
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_username_reserved" CHECK (username NOT IN ('api','dashboard','login','cadastro','recuperar-senha','redefinir-senha','privacidade','termos','admin','settings','themes','suporte','vibepage','www','account','auth','favicon','robots','sitemap','_next','go','demo'));
