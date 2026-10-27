INSERT INTO "Theme" (id,name,premium) VALUES ('aurora-blue','Aurora Blue',true)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,premium=EXCLUDED.premium;
