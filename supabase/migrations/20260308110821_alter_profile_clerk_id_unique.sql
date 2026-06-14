ALTER TABLE profiles
ADD CONSTRAINT unique_clerk_user_id UNIQUE (clerk_user_id);