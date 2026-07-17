# Truth Uncovered

Truth Uncovered is structured as one GitHub repository with two deployable services and one Supabase PostgreSQL database.

```text
truth-uncovered/
├── frontend/                # React + Vite frontend
├── backend/                 # Node.js + Express API
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

- `frontend`: React pages, reusable components, layouts, client-side state, and API services.
- `backend`: Express routes, controllers, models, middleware, and backend services.
- `supabase`: PostgreSQL schema, migrations, relational constraints, indexes, and database-level structure.
