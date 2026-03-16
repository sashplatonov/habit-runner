-- Add freezeDays to habits
ALTER TABLE habits ADD COLUMN "freezeDays" jsonb DEFAULT '[]';

-- Create push_subscriptions table
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL UNIQUE,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Create index on userId for efficient lookups
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");
