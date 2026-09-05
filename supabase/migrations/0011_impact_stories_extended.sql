-- Impact Stories Wall extensions

alter table impact_stories
  add column if not exists outcome_type varchar(50) check (outcome_type in ('arrest', 'fine', 'reform', 'policy_change', 'other')),
  add column if not exists report_id uuid references reports(report_id) on delete set null,
  add column if not exists approved_by_admin_id uuid references admins(admin_id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists review_status varchar(20) not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists public_slug varchar(20) unique,
  add column if not exists share_count integer not null default 0;

-- Backfill review_status based on existing is_approved column
update impact_stories set review_status = 'approved' where is_approved = true and review_status = 'pending';

-- Drop the old is_approved column to avoid confusion
alter table impact_stories drop column if exists is_approved;

-- Create indexes for efficient querying on the public wall
create index if not exists idx_impact_stories_public on impact_stories(review_status, outcome_type, date_added desc);
create index if not exists idx_impact_stories_slug on impact_stories(public_slug);
