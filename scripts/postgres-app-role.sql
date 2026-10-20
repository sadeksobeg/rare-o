-- Least-privilege app role for RARE OUD (run as superuser / migration owner).
-- See docs/security/POSTGRES-APP-ROLE.md

CREATE ROLE rareoud_app LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';

GRANT CONNECT ON DATABASE rareoud TO rareoud_app;
GRANT USAGE ON SCHEMA public TO rareoud_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rareoud_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rareoud_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rareoud_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO rareoud_app;

-- Do NOT grant CREATE, DROP, or superuser to rareoud_app.
-- Migrations run with a separate owner role.
