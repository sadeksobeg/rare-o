# Postgres least-privilege application role (F3)

```sql
-- Run as superuser on production DB
CREATE ROLE rareoud_app LOGIN PASSWORD '...strong...';
GRANT CONNECT ON DATABASE rareoud TO rareoud_app;
GRANT USAGE ON SCHEMA public TO rareoud_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rareoud_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rareoud_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rareoud_app;
```

Production `DATABASE_URL` must include `sslmode=require` (or `verify-full` with CA):

```
DATABASE_URL=postgresql://rareoud_app:...@db-host:5432/rareoud?schema=public&sslmode=require
```
