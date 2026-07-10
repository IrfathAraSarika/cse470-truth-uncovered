# Truth Uncovered

Truth Uncovered is structured as one GitHub repository with two deployable services and one Supabase PostgreSQL database.

```text
truth-uncovered/
├── frontend-service/        # Next.js + React frontend, deployable on Render
├── backend-service/         # Node.js + Express API, deployable on Render
├── supabase/                # PostgreSQL schema and database migrations
├── docs/                    # Architecture and database design notes
└── README.md
```

## Architecture

```text
Same GitHub Repository
        |
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

- `frontend-service`: Next.js pages, React components, dashboards, public views, forms, maps, and authentication UI.
- `backend-service`: Express API, business logic, validation, authorization, report workflow, case workflow, analytics endpoints, and notification triggers.
- `supabase`: PostgreSQL schema, migrations, relational constraints, indexes, and database-level structure.

