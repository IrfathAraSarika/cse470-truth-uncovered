-- Member 3: recursive follow-ups and public transparency support.

alter table follow_up_reports
  add column if not exists parent_follow_up_id uuid
    references follow_up_reports(follow_up_id) on delete cascade;

alter table follow_up_reports
  add column if not exists updated_at timestamptz not null default now();

alter table fame_shame_records
  add column if not exists reviewed_by_admin_id uuid references admins(admin_id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_status varchar(20) not null default 'pending';

update fame_shame_records
   set review_status = 'approved'
 where is_approved = true and review_status = 'pending';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fame_shame_review_status_check') then
    alter table fame_shame_records add constraint fame_shame_review_status_check
      check (review_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists idx_follow_up_parent
  on follow_up_reports(parent_follow_up_id, follow_up_date);

create index if not exists idx_reports_public_heatmap
  on reports(status, submission_date, category, location_id);

create unique index if not exists idx_institutions_name_unique
  on institutions(lower(name));

create index if not exists idx_trust_scores_institution_date
  on trust_scores(institution_id, calculated_date desc);

create index if not exists idx_fame_shame_public
  on fame_shame_records(review_status, type, date_added desc);
