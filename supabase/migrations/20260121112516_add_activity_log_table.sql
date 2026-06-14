-- Skip creating the table if it already exists, just ensure indexes exist for any columns that do exist
DO $$
BEGIN
    -- Check if user_id column exists before creating index
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'activity_log' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
    END IF;

    -- Check if timestamp column exists before creating index
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'activity_log' AND column_name = 'timestamp') THEN
        CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp);
    END IF;
END $$;