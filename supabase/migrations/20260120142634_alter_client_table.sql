ALTER TABLE clients
DROP CONSTRAINT clients_user_id_fkey;

ALTER TABLE clients
RENAME COLUMN user_id TO clerk_user_id;

