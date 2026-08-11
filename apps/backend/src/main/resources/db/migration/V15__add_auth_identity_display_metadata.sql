ALTER TABLE auth_identities
  ADD COLUMN IF NOT EXISTS "displayName" TEXT;
