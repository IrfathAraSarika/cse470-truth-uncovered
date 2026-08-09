# How to Check the Database

Use Supabase as the database interface. You do not need to install PostgreSQL locally.

## 1. Create a Supabase Project

1. Go to Supabase.
2. Create a new project.
3. Open the project dashboard.

## 2. Apply the Schema

1. Open `SQL Editor` in Supabase.
2. Copy the full SQL from:

   ```text
   supabase/migrations/0001_initial_schema.sql
   ```

3. Paste it into the SQL Editor.
4. Run it.
5. Open `Table Editor` and confirm that tables such as `app_users`, `reports`, `cases`, and `institutions` exist.

## 3. Add the Database URL Locally

In Supabase:

```text
Project Settings -> Database -> Connection string -> URI
```

Copy the URI connection string. Prefer `Session pooler` or `Transaction pooler` if available. This avoids local IPv6/DNS issues with the direct `db.<project-ref>.supabase.co` host.

Then create this file:

```text
backend/.env.development
```

Use this format:

```env
DATABASE_URL="postgresql://postgres.zpsciwuqwvnimktpedri:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
```

## 4. Run the Database Check

From `backend`:

```bash
npm run db:check
```

Expected successful output:

```text
Connected to PostgreSQL.
Found ... public tables/views.
Required schema is present and basic queries work.
```

## 5. What This Checks

- PostgreSQL connection works.
- Supabase credentials are valid.
- Required project tables exist.
- Basic queries against core tables work.
