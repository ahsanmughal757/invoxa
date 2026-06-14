ALTER TABLE "notifications"
DROP CONSTRAINT IF EXISTS "notifications_recipient_user_id_fkey";

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "profiles" ("id") ON DELETE CASCADE;