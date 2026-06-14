-- 1. Enable Row Level Security on the notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for users to read their own notifications
CREATE POLICY "Enable read access for user's own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = recipient_user_id);

-- 3. Ensure users can't insert notifications directly (they should only be created by the trigger)
-- By default, without an INSERT policy, inserts are denied when RLS is enabled.
