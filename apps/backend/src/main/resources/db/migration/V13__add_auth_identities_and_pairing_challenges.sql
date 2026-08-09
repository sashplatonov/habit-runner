ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  "providerSubject" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auth_identity_provider_subject_unique UNIQUE(provider, "providerSubject")
);

CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx
  ON auth_identities("userId");

INSERT INTO auth_identities (id, provider, "providerSubject", "userId", email)
SELECT
  md5('legacy-google:' || id),
  'GOOGLE',
  'legacy-email:' || lower(trim(email)),
  id,
  email
FROM users
WHERE email IS NOT NULL
ON CONFLICT (provider, "providerSubject") DO NOTHING;

CREATE TABLE IF NOT EXISTS account_link_challenges (
  id TEXT PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "telegramUserId" TEXT,
  "telegramUsername" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS account_link_challenges_expiry_idx
  ON account_link_challenges("expiresAt");
