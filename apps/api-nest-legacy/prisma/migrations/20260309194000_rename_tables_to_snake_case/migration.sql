DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    ALTER TABLE "User" RENAME TO users;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Habit') THEN
    ALTER TABLE "Habit" RENAME TO habits;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Checkin') THEN
    ALTER TABLE "Checkin" RENAME TO checkins;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tombstone') THEN
    ALTER TABLE "Tombstone" RENAME TO tombstones;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SyncOpLog') THEN
    ALTER TABLE "SyncOpLog" RENAME TO sync_op_logs;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'OAuthState') THEN
    ALTER TABLE "OAuthState" RENAME TO oauth_states;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RefreshToken') THEN
    ALTER TABLE "RefreshToken" RENAME TO refresh_tokens;
  END IF;
END
$$;
