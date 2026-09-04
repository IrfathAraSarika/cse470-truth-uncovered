-- Allow administrators to participate in case follow-up threads.

alter table follow_up_reports
  add column if not exists admin_id uuid references admins(admin_id) on delete set null;

create index if not exists idx_follow_up_admin
  on follow_up_reports(admin_id, follow_up_date desc);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'follow_up_single_author_check') then
    alter table follow_up_reports add constraint follow_up_single_author_check
      check (num_nonnulls(citizen_id, ngo_partner_id, admin_id) <= 1);
  end if;
end $$;
