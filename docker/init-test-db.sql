-- Creates the test database on first container initialization.
-- This script runs automatically via docker-entrypoint-initdb.d on a fresh volume.
-- If you already have an existing volume and the database is missing, run:
--   docker compose down -v && docker compose up -d
-- or manually: psql -U $DB_USER -c "CREATE DATABASE app_test;"

SELECT 'CREATE DATABASE app_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'app_test')\gexec
