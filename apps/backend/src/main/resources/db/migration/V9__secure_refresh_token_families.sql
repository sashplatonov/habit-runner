ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS "tokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "familyId" TEXT,
  ADD COLUMN IF NOT EXISTS "replacementTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "rotatedAt" TIMESTAMPTZ;

UPDATE refresh_tokens
SET "tokenHash" = encode(sha256(convert_to(token, 'UTF8')), 'hex'),
    "familyId" = id
WHERE "tokenHash" IS NULL
   OR "familyId" IS NULL;

ALTER TABLE refresh_tokens
  ALTER COLUMN "tokenHash" SET NOT NULL,
  ALTER COLUMN "familyId" SET NOT NULL,
  DROP COLUMN token;

CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_hash_idx
  ON refresh_tokens ("tokenHash");

CREATE INDEX IF NOT EXISTS refresh_tokens_family_id_idx
  ON refresh_tokens ("familyId");
