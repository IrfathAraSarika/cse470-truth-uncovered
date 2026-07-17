-- Independent audit history for the Multi-Admin Report Verification Panel.
create type admin_review_decision as enum (
  'verified',
  'rejected',
  'request_evidence'
);

create table admin_report_reviews (
  review_id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(report_id) on delete cascade,
  admin_id uuid not null references admins(admin_id) on delete restrict,
  decision admin_review_decision not null,
  notes text not null check (char_length(notes) between 3 and 2000),
  created_at timestamptz not null default now()
);

create index idx_admin_reviews_report on admin_report_reviews(report_id, created_at desc);
create index idx_admin_reviews_admin on admin_report_reviews(admin_id, created_at desc);
