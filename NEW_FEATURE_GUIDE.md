# Comprehensive Step-by-Step Guide for Adding a New Feature

This guide is designed for AI agents (and human developers) to implement end-to-end features in the **Truth Uncovered (CSE470)** codebase. Follow this exact workflow, coding standard, and directory structure to maintain consistency across the project.

---

## 1. Codebase Architecture & Tech Stack

### Overview
- **Repository Layout**: Monorepo-style structure containing `backend/`, `frontend/`, `supabase/`, and `docs/`.
- **Backend Stack**: Node.js, Express v5, TypeScript (ESM format), PostgreSQL (via `pg` Connection Pool).
- **Frontend Stack**: React 19, Vite, TypeScript, React Router v7, Tailwind CSS.
- **Database**: PostgreSQL (Migrations managed in `supabase/migrations/`).

---

## 2. Directory Structure Quick Reference

```
cse470-truth-uncovered/
├── supabase/
│   └── migrations/               # SQL schema migrations (0001_..., 0002_..., etc.)
├── backend/
│   ├── src/
│   │   ├── config.ts            # Environment variables configuration
│   │   ├── index.ts             # Express app entry point & route registrations
│   │   ├── middlewares/         # Middleware (authMiddleware.ts for requireAuth/requireAdmin)
│   │   ├── models/              # DB access layer using `pool.query` (pg pool)
│   │   ├── controllers/         # Express request handlers & payload validation
│   │   ├── routes/              # Express Router definitions
│   │   └── services/            # Pure business logic & unit test suites (*.test.ts)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main routing hub (React Router v7)
│   │   ├── main.tsx             # React entry point
│   │   ├── index.css            # Tailwind & global CSS styles
│   │   ├── pages/               # Full page components (*Page.tsx)
│   │   ├── components/          # Reusable UI components
│   │   └── services/            # Frontend API client methods using apiClient.ts
│   └── package.json
└── NEW_FEATURE_GUIDE.md         # (This file)
```

---

## 3. End-to-End Implementation Workflow

When adding a new feature, execute the following steps in sequence:

```
[1. SQL Migration] ➔ [2. Backend Model] ➔ [3. Backend Controller] ➔ [4. Backend Route & index.ts]
      ➔ [5. Backend Test] ➔ [6. Frontend API Service] ➔ [7. Frontend Page/Component] ➔ [8. Frontend Routing App.tsx]
```

---

### Step 1: Database Migration (If database changes are needed)

1. Navigate to `supabase/migrations/`.
2. Check the existing numeric prefix (e.g., `0006_anonymous_reports.sql`).
3. Create a new file with the incremented prefix: `supabase/migrations/0007_<feature_name>.sql`.
4. Write clear, explicit SQL statements:
   - Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, or `ALTER TABLE`.
   - Use `UUID` with `gen_random_uuid()` for primary keys when appropriate.
   - Use standard timestamps (`TIMESTAMPTZ DEFAULT now()`).

**Example (`supabase/migrations/0007_report_comments.sql`):**
```sql
CREATE TABLE IF NOT EXISTS report_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_report_id ON report_comments(report_id);
```

---

### Step 2: Backend Data Model (`backend/src/models/`)

1. Create a model file `backend/src/models/<feature>Model.ts` (or update an existing model).
2. Import `pool` from `./database.js` (Note: internal TypeScript imports in ESM use `.js` extension).
3. Define TypeScript interfaces for request/response payloads.
4. Export async functions using raw SQL queries with parameter substitution (`$1`, `$2`, etc.).

**Example (`backend/src/models/commentModel.ts`):**
```typescript
import { pool } from './database.js';

export interface Comment {
  commentId: string;
  reportId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export async function createComment(reportId: string, userId: string, content: string): Promise<Comment> {
  const result = await pool.query(
    `INSERT INTO report_comments (report_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING comment_id AS "commentId", report_id AS "reportId", user_id AS "userId", content, created_at AS "createdAt"`,
    [reportId, userId, content]
  );
  return result.rows[0];
}

export async function getCommentsByReport(reportId: string): Promise<Comment[]> {
  const result = await pool.query(
    `SELECT comment_id AS "commentId", report_id AS "reportId", user_id AS "userId", content, created_at AS "createdAt"
     FROM report_comments
     WHERE report_id = $1
     ORDER BY created_at ASC`,
    [reportId]
  );
  return result.rows;
}
```

---

### Step 3: Backend Controller (`backend/src/controllers/`)

1. Create `backend/src/controllers/<feature>Controller.ts`.
2. Import type `AuthenticatedRequest` from `../middlewares/authMiddleware.js` if auth is required.
3. Implement input validation, authorization checks, and error catching passing errors to `next(error)`.

**Example (`backend/src/controllers/commentController.ts`):**
```typescript
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { createComment, getCommentsByReport } from '../models/commentModel.js';

export async function postComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const { reportId, content } = req.body;
    if (typeof reportId !== 'string' || !reportId.trim() || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'reportId and content are required.' });
      return;
    }

    const comment = await createComment(reportId, req.auth.userId, content.trim());
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
}

export async function fetchComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { reportId } = req.params;
    if (!reportId) {
      res.status(400).json({ error: 'reportId parameter is required.' });
      return;
    }
    const comments = await getCommentsByReport(reportId);
    res.json({ comments });
  } catch (error) {
    next(error);
  }
}
```

---

### Step 4: Backend Route Registration (`backend/src/routes/` & `index.ts`)

1. Create `backend/src/routes/<feature>Routes.ts`.
2. Apply middlewares like `requireAuth` or `requireAdmin` from `../middlewares/authMiddleware.js`.
3. Register the router in `backend/src/index.ts`.

**Example Router (`backend/src/routes/commentRoutes.ts`):**
```typescript
import { Router } from 'express';
import { postComment, fetchComments } from '../controllers/commentController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const commentRoutes = Router();

commentRoutes.post('/', requireAuth, postComment);
commentRoutes.get('/:reportId', fetchComments);

export default commentRoutes;
```

**Register in `backend/src/index.ts`:**
```typescript
import commentRoutes from './routes/commentRoutes.js';

// Under route middleware definitions:
app.use('/api/comments', commentRoutes);
```

---

### Step 5: Backend Service Logic & Testing (Optional / Recommended)

- If pure business logic or calculation is involved, place it in `backend/src/services/<feature>Service.ts`.
- Write unit tests in `backend/src/services/<feature>Service.test.ts`.
- Run tests using `npm test` in the `backend/` folder (runs Node test runner via `tsx --test`).

---

### Step 6: Frontend API Service (`frontend/src/services/`)

1. Create `frontend/src/services/<feature>Api.ts`.
2. Use `apiRequest<T>` from `./apiClient.ts` to execute HTTP calls to the backend endpoints.

**Example (`frontend/src/services/commentApi.ts`):**
```typescript
import { apiRequest } from './apiClient';

export interface Comment {
  commentId: string;
  reportId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export async function addComment(reportId: string, content: string): Promise<{ comment: Comment }> {
  return apiRequest<{ comment: Comment }>('/comments', {
    method: 'POST',
    body: JSON.stringify({ reportId, content }),
  });
}

export async function getComments(reportId: string): Promise<{ comments: Comment[] }> {
  return apiRequest<{ comments: Comment[] }>(`/comments/${reportId}`);
}
```

---

### Step 7: Frontend Page & Components (`frontend/src/pages/` & `frontend/src/components/`)

1. Create modular UI components in `frontend/src/components/`.
2. Create or update page components in `frontend/src/pages/<FeaturePage>.tsx`.
3. Adhere strictly to the **Frontend Design System & Theme Guidelines** detailed in Section 4 below.

---

### Step 8: Frontend Route Registration (`frontend/src/App.tsx`)

1. Open `frontend/src/App.tsx`.
2. Import the new Page component.
3. Add a `<Route>` inside `<Routes>`.

**Example:**
```tsx
import CommentPage from './pages/CommentPage';

// Inside <Routes>:
<Route path="/reports/:reportId/comments" element={<CommentPage />} />
```

---

## 4. Frontend Design System & Visual Theme Guidelines

To ensure all new feature pages maintain visual consistency with the rest of the **Truth Uncovered** application, AI agents must strictly implement the theme tokens, color codes, typography, and UI component blueprints specified below.

### 4.1 Visual Aesthetic & Design Concept
- **Style**: Modern Dark Mode / High-Tech Cyberpunk Glassmorphism.
- **Vibe**: High-contrast, sleek, security & truth-focused interface with glass cards, glowing borders, and vibrant teal/red accents.

### 4.2 Exact Color Palette & HEX Codes

| Token Name | Class / Tailwind Utility | HEX / Value | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Dark Background** | `bg-bg-dark` / `bg-[#080808]` | `#080808` | Primary page & container background |
| **On-Surface Text** | `text-on-surface` | `#e5e2e1` | Main body text, subheadings, labels |
| **Brand Teal** | `bg-brand-teal` / `text-brand-teal` | `#00adb5` | Primary action buttons, active tabs, focus borders, primary badges |
| **Brand Red** | `bg-brand-red` / `text-brand-red` | `#ff4c29` | Alerts, destructive actions, highlight badges, warning accents |
| **Glass Surface** | `.glass-card` | `rgba(255, 255, 255, 0.03)` | Card, modal, & panel background fill (`backdrop-blur-2xl`) |
| **Glass Border** | `.glass-border` | `rgba(255, 255, 255, 0.1)` | Subtle border for cards, inputs, and section dividers |
| **Teal Glow Hover** | `.interactive-hover:hover` | `rgba(0, 173, 181, 0.4)` | Interactive hover state for cards & clickable items |

---

### 4.3 Typography & Google Fonts

1. **Heading Font (`Sora`)**:
   - Class: `font-sora`
   - Weight: `font-bold` (600/700)
   - Color: `text-white`
   - Usage: Page headers (`h1`), card titles (`h2`, `h3`), hero text, brand title.
2. **Body Font (`Inter`)**:
   - Class: `font-inter`
   - Weight: `font-normal` (400) / `font-medium` (500) / `font-semibold` (600)
   - Color: `text-on-surface` (`#e5e2e1`) or `text-zinc-400`
   - Usage: Body copy, form input text, table contents, metadata labels.

---

### 4.4 Status & Badge Color Palette

When building status badges or indicators, use these established color combinations:

- **Verified / Active / Success**:
  - Class: `border border-emerald-400/30 bg-emerald-400/10 text-emerald-400`
- **Pending / In Review / Warning**:
  - Class: `border border-amber-400/30 bg-amber-400/10 text-amber-400`
- **Rejected / Flagged / Danger**:
  - Class: `border border-brand-red/30 bg-brand-red/10 text-brand-red`
- **Category / Neutral Badge**:
  - Class: `border border-brand-teal/30 bg-brand-teal/10 text-brand-teal`

---

### 4.5 Component Blueprints for New Pages

AI agents building new UI components should copy and utilize these component code patterns:

#### Page Wrapper & Navigation Structure
```tsx
export default function NewFeaturePage() {
  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-bg-dark/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-white text-lg">Truth Uncovered</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1000px] mx-auto px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-2">Feature Category</p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white mb-6">Page Title</h1>
        
        {/* Glassmorphic Container */}
        <div className="glass-card glass-border rounded-xl p-6 interactive-hover">
          {/* Component Content */}
        </div>
      </main>
    </div>
  );
}
```

#### Form Elements Blueprint
```tsx
{/* Label */}
<label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
  Input Label
</label>

{/* Input Field */}
<input 
  type="text" 
  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder-zinc-500 focus:outline-none focus:border-brand-teal transition-colors"
  placeholder="Enter value..."
/>

{/* Textarea */}
<textarea 
  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder-zinc-500 focus:outline-none focus:border-brand-teal transition-colors min-h-[120px]"
  placeholder="Enter description..."
/>
```

#### Buttons Blueprint
```tsx
{/* Primary CTA Button */}
<button className="px-6 py-3 bg-brand-teal text-bg-dark font-sora font-bold rounded-lg hover:bg-brand-teal/90 transition-colors shadow-lg shadow-brand-teal/20">
  Submit Action
</button>

{/* Secondary Outlined Button */}
<button className="px-5 py-2.5 border border-white/10 text-on-surface font-bold rounded-lg hover:border-brand-teal/50 hover:text-white transition-colors">
  Cancel / Secondary Action
</button>

{/* Destructive Action Button */}
<button className="px-5 py-2.5 bg-brand-red/10 border border-brand-red/30 text-brand-red font-bold rounded-lg hover:bg-brand-red hover:text-white transition-colors">
  Delete / Reject
</button>
```

---

## 5. Key Rules & Coding Standards

1. **ESM Import Extension Rule**:
   - In `backend`, when importing local TS files, append `.js` to the module path (e.g., `import { pool } from './database.js';`).
   - In `frontend`, use standard relative paths without extensions (e.g., `import { apiRequest } from './apiClient';`).

2. **Authentication Handling**:
   - The backend `requireAuth` middleware verifies authorization cookies/headers and attaches `req.auth = { userId, role, ... }`.
   - Request handlers requiring auth must check `if (!req.auth) return res.status(401)...`.

3. **Error Handling**:
   - Always wrap controller logic in `try { ... } catch (error) { next(error); }`.
   - Return structured error JSON: `{ error: 'Descriptive message.' }`.

4. **Database Querying**:
   - Always use parameterized queries (`$1`, `$2`) to prevent SQL injection.
   - Use table aliases where appropriate and return mapped property names using SQL column aliases (`RETURNING comment_id AS "commentId"`).

5. **Frontend API Client**:
   - Always use `apiRequest<T>` from `frontend/src/services/apiClient.ts` which automatically handles base URL (`VITE_API_URL`), JSON headers, credentials (`credentials: 'include'`), and response error parsing.

---

## 6. Verification Commands

Before completing any task, execute these verification commands to ensure no build or runtime errors exist:

### Backend Verification
```bash
cd backend
npm run build      # Verifies TypeScript compilation
npm test           # Runs test suite
```

### Frontend Verification
```bash
cd frontend
npm run build      # Verifies Vite & TypeScript build
npm run lint       # Runs ESLint checks
```

---

## 7. AI Agent Checklist

When implementing a feature, complete each item in this checklist:

- [ ] Database migration script created in `supabase/migrations/` (if schema changes needed)
- [ ] Backend model defined in `backend/src/models/`
- [ ] Backend controller created in `backend/src/controllers/` with validation & error handling
- [ ] Backend routes defined in `backend/src/routes/` and registered in `backend/src/index.ts`
- [ ] Frontend API wrapper written in `frontend/src/services/`
- [ ] Frontend UI component/page written in `frontend/src/components/` / `frontend/src/pages/`
- [ ] Visual styling follows theme specifications (Dark `#080808`, Sora font headers, Brand Teal `#00adb5`, Glassmorphic cards)
- [ ] Route added to `frontend/src/App.tsx`
- [ ] TypeScript compilation passed in both `backend` and `frontend`
