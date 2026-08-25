-- Privacy-safe references and accountability workflows.

alter table reports
  add column if not exists reference_no varchar(24),
  add column if not exists public_summary text,
  add column if not exists victim_context varchar(300),
  add column if not exists public_keywords text[] not null default '{}',
  add column if not exists is_public boolean not null default false;

alter table cases add column if not exists reference_no varchar(24);

update reports
   set reference_no = 'TU-R-' || upper(substr(replace(report_id::text, '-', ''), 1, 10))
 where reference_no is null;
update cases
   set reference_no = 'TU-C-' || upper(substr(replace(case_id::text, '-', ''), 1, 10))
 where reference_no is null;
update reports set is_public = true where is_anonymous and status in ('verified', 'closed');

alter table reports alter column reference_no set not null;
alter table cases alter column reference_no set not null;
create unique index if not exists idx_reports_reference_no on reports(reference_no);
create unique index if not exists idx_cases_reference_no on cases(reference_no);
create index if not exists idx_reports_public_search on reports(is_public, status, submission_date desc);
create index if not exists idx_reports_public_keywords on reports using gin(public_keywords);

create or replace function assign_truth_uncovered_reference()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'reports' and new.reference_no is null then
    new.reference_no := 'TU-R-' || upper(substr(replace(new.report_id::text, '-', ''), 1, 10));
  elsif tg_table_name = 'cases' and new.reference_no is null then
    new.reference_no := 'TU-C-' || upper(substr(replace(new.case_id::text, '-', ''), 1, 10));
  end if;
  return new;
end $$;

drop trigger if exists reports_assign_reference on reports;
create trigger reports_assign_reference before insert on reports
for each row execute function assign_truth_uncovered_reference();
drop trigger if exists cases_assign_reference on cases;
create trigger cases_assign_reference before insert on cases
for each row execute function assign_truth_uncovered_reference();

create table if not exists safety_check_ins (
  check_in_id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(citizen_id) on delete cascade,
  case_id uuid references cases(case_id) on delete cascade,
  scheduled_for timestamptz not null,
  status varchar(20) not null default 'scheduled' check (status in ('scheduled', 'safe', 'needs_help', 'missed', 'resolved')),
  private_message text,
  emergency_requested boolean not null default false,
  resolved_by_admin_id uuid references admins(admin_id) on delete set null,
  resolution_note text,
  responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_safety_checkins_owner on safety_check_ins(citizen_id, scheduled_for desc);
create index if not exists idx_safety_checkins_urgent on safety_check_ins(status, emergency_requested, scheduled_for);

create table if not exists case_appeals (
  appeal_id uuid primary key default gen_random_uuid(),
  reference_no varchar(24) not null unique default ('TU-A-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  case_id uuid not null references cases(case_id) on delete cascade,
  citizen_id uuid not null references citizens(citizen_id) on delete cascade,
  reason text not null,
  requested_outcome varchar(300) not null,
  status varchar(20) not null default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  reviewed_by_admin_id uuid references admins(admin_id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(case_id, citizen_id, status)
);
create index if not exists idx_appeals_status on case_appeals(status, created_at desc);

create table if not exists regional_alert_subscriptions (
  subscription_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(user_id) on delete cascade,
  district varchar(100) not null,
  category report_category,
  channel notification_channel not null default 'in_app',
  frequency varchar(20) not null default 'instant' check (frequency in ('instant', 'daily', 'weekly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, district, category, channel)
);
create index if not exists idx_alert_subscriptions_match on regional_alert_subscriptions(is_active, district, category);

create table if not exists witness_contributions (
  contribution_id uuid primary key default gen_random_uuid(),
  reference_no varchar(24) not null unique default ('TU-W-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  report_id uuid not null references reports(report_id) on delete cascade,
  citizen_id uuid not null references citizens(citizen_id) on delete restrict,
  relationship_to_incident varchar(120) not null,
  statement text not null,
  evidence_url text,
  consent_to_contact boolean not null default false,
  status varchar(20) not null default 'submitted' check (status in ('submitted', 'under_review', 'accepted', 'rejected')),
  reviewed_by_admin_id uuid references admins(admin_id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(report_id, citizen_id)
);
create index if not exists idx_witness_contributions_report on witness_contributions(report_id, status, created_at desc);

alter table institutions
  add column if not exists website_url text,
  add column if not exists contact_email varchar(160);

create table if not exists institution_notifications (
  notification_id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(institution_id) on delete set null,
  report_id uuid references reports(report_id) on delete set null,
  case_id uuid references cases(case_id) on delete set null,
  office_name varchar(180) not null,
  website_url text,
  contact_email varchar(160),
  subject varchar(200) not null,
  public_message text not null,
  method varchar(20) not null check (method in ('website', 'email', 'letter', 'phone')),
  status varchar(20) not null default 'draft' check (status in ('draft', 'sent', 'acknowledged', 'failed', 'closed')),
  external_reference varchar(160),
  sent_by_admin_id uuid references admins(admin_id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (report_id is not null or case_id is not null)
);
create index if not exists idx_institution_notifications_status on institution_notifications(status, created_at desc);
