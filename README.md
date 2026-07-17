# Truth Uncovered

Truth Uncovered is structured as one GitHub repository with two deployable services and one Supabase PostgreSQL database.

```text
truth-uncovered/
|-- frontend/                # React + Vite frontend
|-- backend/                 # Node.js + Express API
|-- supabase/                # PostgreSQL schema and database migrations
|-- docs/                    # Architecture and database design notes
`-- README.md
```

## Architecture

```text
Same GitHub Repository
        |
        |----------------------|
        v                      v
Frontend Service        Backend Service
   (Render)                (Render)
        |                      |
        |----------|-----------|
                   v
          Supabase PostgreSQL
```

## Service Responsibilities

- `frontend`: React pages, reusable components, client-side state, and API services.
- `backend`: Express routes, controllers, models, middleware, and backend services.
- `supabase`: PostgreSQL schema, migrations, relational constraints, indexes, and database structure.

## Member 2 Feature Sector

- Offline PWA report drafts with a local queue and automatic reconnection sync.
- Database-backed five-stage case lifecycle tracking.
- Duplicate report detection with persisted similarity records.
- Multi-admin verification with review history and automatic case creation.
- Fraud and spam moderation with a hidden-report queue and resolvable flags.

## Local Development

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:5000`.

```powershell
npm run build
npm test --workspace=backend
npm run lint --workspace=frontend
npm run db:check --workspace=backend
```

Apply Supabase migrations in numeric order. Migration `0004_report_screening_indexes.sql` adds the indexes used by duplicate detection and moderation queues.
