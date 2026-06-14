-- Only add columns if they don't already exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.activity_log ADD COLUMN org_id TEXT NULL;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column org_id already exists in activity_log';
    END;

    BEGIN
        ALTER TABLE public.activity_log ADD COLUMN entity_id TEXT NULL;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column entity_id already exists in activity_log';
    END;

    BEGIN
        ALTER TABLE public.activity_log ADD COLUMN entity_type TEXT NULL;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column entity_type already exists in activity_log';
    END;
END $$;

