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

## Member 3 Transparency Features

- Recursive case follow-up threads: `/case-follow-ups`
- Interactive corruption aggregate map: `/corruption-heatmap`
- Red-flag institution rankings: `/institution-rankings`
- Community trust scores and case outcomes: `/trust-scores`
- Moderated Fame and Shame wall: `/fame-shame`

The teammate GPS incident map remains available at `/heatmap`.

## Privacy and Accountability Features

- Privacy-safe public reference and keyword search: `/repository`
- Whistleblower safety check-ins, case appeals, regional alerts, and protected witness contributions: `/accountability`
- Admin safety response, appeal/witness review, public metadata approval, and external institution notice tracking: `/admin/accountability`

Public search returns only approved summaries, victim context, generalized location, category, institution, and public keywords. It never returns reporter or witness identities, private narratives, evidence, contact details, or internal UUIDs. Institution notices open an official HTTPS website or a prefilled email and require an administrator to record the external receipt; government offices do not need accounts in this application.

```powershell
npm run db:migrate --workspace=backend -- 0007_member3_transparency_features.sql
npm run db:migrate --workspace=backend -- 0008_admin_case_follow_ups.sql
npm run db:migrate --workspace=backend -- 0009_privacy_safety_appeals_alerts_witnesses.sql
npm run test:member3:smoke --workspace=backend
npm run test:accountability:smoke --workspace=backend
npm run demo:member3:seed --workspace=backend
npm run demo:member3:clear --workspace=backend
```

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
