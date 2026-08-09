-- Standalone anonymous reporting pipeline: its own table with NO citizen
-- link and no identifying fields stored at all. The citizen receives a
-- tracking code to follow the report status without an account.

create table anonymous_reports (
  anonymous_report_id uuid primary key default gen_random_uuid(),
  tracking_code varchar(24) not null unique,
  title varchar(180) not null,
  description text not null,
  category report_category not null,
  incident_datetime timestamptz,
  district varchar(100),
  address text,
  status report_status not null default 'submitted',
  duplicate_score numeric(5, 2),
  submission_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_anonymous_reports_tracking
  on anonymous_reports(tracking_code);

create index idx_anonymous_reports_status
  on anonymous_reports(status, submission_date desc);
