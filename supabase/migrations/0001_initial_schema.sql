-- Truth Uncovered - Initial Supabase PostgreSQL schema
-- Based on the provided draw.io class diagram.

create extension if not exists "pgcrypto";

create type user_role as enum (
  'citizen',
  'admin',
  'government_officer',
  'ngo_partner'
);

create type report_category as enum (
  'corruption',
  'bribery',
  'dowry',
  'harassment',
  'extortion',
  'land_grabbing',
  'hazard',
  'antisocial_activity',
  'other'
);

create type report_status as enum (
  'draft',
  'submitted',
  'pending_verification',
  'verified',
  'rejected',
  'hidden',
  'closed'
);

create type case_status as enum (
  'received',
  'verified',
  'under_investigation',
  'action_taken',
  'closed'
);

create type content_status as enum (
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived'
);

create type notification_channel as enum (
  'email',
  'sms',
  'push',
  'in_app'
);

create type notification_type as enum (
  'otp',
  'case_update',
  'regional_alert',
  'blog_update',
  'system'
);

create type flagged_target_type as enum (
  'report',
  'follow_up_report',
  'blog_post',
  'legal_resource',
  'impact_story',
  'user'
);

create table app_users (
  user_id uuid primary key default gen_random_uuid(),
  full_name varchar(120) not null,
  email varchar(160) not null unique,
  phone varchar(30) unique,
  password_hash text not null,
  role user_role not null,
  is_active boolean not null default true,
  registration_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table citizens (
  citizen_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(user_id) on delete cascade,
  date_of_birth date,
  nid_number varchar(40) unique,
  nid_photo_path text,
  civic_points integer not null default 0 check (civic_points >= 0),
  anonymous_mode boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table admins (
  admin_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(user_id) on delete cascade,
  employee_id varchar(80) unique,
  expertise_level varchar(80),
  hire_date date,
  created_at timestamptz not null default now()
);

create table government_officers (
  officer_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(user_id) on delete cascade,
  department varchar(160) not null,
  designation varchar(120),
  office_id varchar(80),
  created_at timestamptz not null default now()
);

create table ngo_partners (
  ngo_partner_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(user_id) on delete cascade,
  organization_name varchar(180) not null,
  registration_number varchar(100) unique,
  contact_person varchar(120),
  created_at timestamptz not null default now()
);

create table locations (
  location_id uuid primary key default gen_random_uuid(),
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  district varchar(100),
  division varchar(100),
  created_at timestamptz not null default now(),
  check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create table institutions (
  institution_id uuid primary key default gen_random_uuid(),
  name varchar(180) not null,
  type varchar(100),
  address text,
  trust_score numeric(5, 2) not null default 0,
  red_flag_score numeric(5, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table reports (
  report_id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(citizen_id) on delete restrict,
  location_id uuid references locations(location_id) on delete set null,
  institution_id uuid references institutions(institution_id) on delete set null,
  title varchar(180) not null,
  description text not null,
  category report_category not null,
  incident_datetime timestamptz,
  status report_status not null default 'submitted',
  is_anonymous boolean not null default false,
  submission_date timestamptz not null default now(),
  duplicate_score numeric(5, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table evidence_files (
  evidence_id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(report_id) on delete cascade,
  file_path text not null,
  file_type varchar(80) not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  watermark_id varchar(120) unique,
  extracted_gps jsonb,
  uploaded_at timestamptz not null default now()
);

create table cases (
  case_id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references reports(report_id) on delete cascade,
  assigned_officer_id uuid references government_officers(officer_id) on delete set null,
  assigned_ngo_partner_id uuid references ngo_partners(ngo_partner_id) on delete set null,
  status case_status not null default 'received',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closed_at is null or closed_at >= opened_at)
);

create table follow_up_reports (
  follow_up_id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(case_id) on delete cascade,
  citizen_id uuid references citizens(citizen_id) on delete set null,
  ngo_partner_id uuid references ngo_partners(ngo_partner_id) on delete set null,
  details text not null,
  follow_up_date timestamptz not null default now(),
  has_new_evidence boolean not null default false
);

create table duplicate_detections (
  detection_id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(report_id) on delete cascade,
  possible_duplicate_report_id uuid not null references reports(report_id) on delete cascade,
  similarity_score numeric(5, 2) not null check (similarity_score between 0 and 100),
  location_distance_km numeric(8, 3),
  detected_at timestamptz not null default now(),
  check (report_id <> possible_duplicate_report_id)
);

create table flagged_contents (
  flag_id uuid primary key default gen_random_uuid(),
  flagged_by_user_id uuid references app_users(user_id) on delete set null,
  target_type flagged_target_type not null,
  target_id uuid not null,
  report_id uuid references reports(report_id) on delete cascade,
  reason text not null,
  flagged_at timestamptz not null default now(),
  is_resolved boolean not null default false
);

create table badges (
  badge_id uuid primary key default gen_random_uuid(),
  badge_type varchar(80) not null unique,
  issued_date timestamptz,
  is_active boolean not null default true
);

create table citizen_badges (
  citizen_id uuid not null references citizens(citizen_id) on delete cascade,
  badge_id uuid not null references badges(badge_id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (citizen_id, badge_id)
);

create table gamification_records (
  record_id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(citizen_id) on delete cascade,
  badge_id uuid references badges(badge_id) on delete set null,
  points_earned integer not null check (points_earned >= 0),
  earned_date timestamptz not null default now(),
  reason text
);

create table trust_scores (
  score_id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(institution_id) on delete cascade,
  score numeric(5, 2) not null check (score between 0 and 100),
  calculated_date timestamptz not null default now(),
  metric_notes text
);

create table fame_shame_records (
  record_id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(institution_id) on delete set null,
  case_id uuid references cases(case_id) on delete set null,
  type varchar(20) not null check (type in ('fame', 'shame')),
  name varchar(180) not null,
  description text,
  date_added timestamptz not null default now(),
  is_approved boolean not null default false
);

create table impact_stories (
  story_id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(case_id) on delete set null,
  institution_id uuid references institutions(institution_id) on delete set null,
  title varchar(180) not null,
  description text not null,
  date_added timestamptz not null default now(),
  is_approved boolean not null default false
);

create table analytics_dashboards (
  dashboard_id uuid primary key default gen_random_uuid(),
  metric_type varchar(100) not null,
  value numeric(12, 2) not null default 0,
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

create table heatmap_data (
  data_id uuid primary key default gen_random_uuid(),
  region varchar(120) not null,
  category report_category not null,
  report_count integer not null default 0 check (report_count >= 0),
  severity_index numeric(5, 2) not null default 0,
  month date not null,
  generated_at timestamptz not null default now(),
  unique (region, category, month)
);

create table blog_posts (
  post_id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(admin_id) on delete set null,
  title varchar(180) not null,
  content text not null,
  category varchar(100),
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table legal_resources (
  resource_id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(admin_id) on delete set null,
  title varchar(180) not null,
  content text not null,
  law_type varchar(100),
  safety_type varchar(100),
  updated_at timestamptz not null default now()
);

create table notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(user_id) on delete cascade,
  report_id uuid references reports(report_id) on delete cascade,
  case_id uuid references cases(case_id) on delete cascade,
  type notification_type not null,
  channel notification_channel not null,
  message text not null,
  is_read boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create view public_report_directory as
select
  r.report_id,
  r.title,
  r.category,
  r.status,
  r.submission_date,
  l.district,
  l.division,
  i.name as institution_name,
  c.case_id,
  c.status as case_status
from reports r
left join locations l on l.location_id = r.location_id
left join institutions i on i.institution_id = r.institution_id
left join cases c on c.report_id = r.report_id
where r.status in ('verified', 'closed')
  and r.is_anonymous is true;

create index idx_users_role on app_users(role);
create index idx_reports_citizen_id on reports(citizen_id);
create index idx_reports_category on reports(category);
create index idx_reports_status on reports(status);
create index idx_reports_institution_id on reports(institution_id);
create index idx_reports_location_id on reports(location_id);
create index idx_evidence_report_id on evidence_files(report_id);
create index idx_cases_status on cases(status);
create index idx_cases_assigned_officer_id on cases(assigned_officer_id);
create index idx_follow_up_case_id on follow_up_reports(case_id);
create index idx_flags_target on flagged_contents(target_type, target_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_heatmap_region_category_month on heatmap_data(region, category, month);

