# Project Architecture

Truth Uncovered uses a single GitHub repository with two Render services and one Supabase PostgreSQL database.

## Deployment Shape

```text
GitHub Repository
├── frontend-service  -> Render Web Service for Next.js
├── backend-service   -> Render Web Service for Express.js
└── supabase          -> Supabase PostgreSQL migrations
```

## Request Flow

1. Users interact with the Next.js frontend.
2. The frontend calls the Express backend API.
3. The backend validates requests, applies role-based permissions, and reads/writes data in Supabase PostgreSQL.
4. Supabase stores normalized relational data for users, reports, evidence metadata, cases, institutions, analytics, content, and notifications.

## Database Principle

The database is normalized around the class diagram. Shared user data is stored once in `app_users`, while role-specific tables extend it through one-to-one relationships.

