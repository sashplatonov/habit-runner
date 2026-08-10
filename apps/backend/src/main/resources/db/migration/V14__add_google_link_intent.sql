ALTER TABLE oauth_states
  ADD COLUMN IF NOT EXISTS "linkUserId" TEXT REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS oauth_states_link_user_idx
  ON oauth_states("linkUserId");
