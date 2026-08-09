-- Citizen NID verification workflow.
-- Adds a status/notes/timestamp so a citizen can submit their NID photo for
-- admin review, and can re-submit after a rejection.

create type citizen_verification_status as enum (
  'not_submitted',
  'pending',
  'verified',
  'rejected'
);

alter table citizens
  add column if not exists verification_status citizen_verification_status not null default 'not_submitted',
  add column if not exists verification_notes text,
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_reviewed_by uuid references admins(admin_id) on delete set null;

-- Keep the legacy is_verified flag in sync for already-verified citizens.
update citizens set verification_status = 'verified' where is_verified = true;

create index if not exists idx_citizens_verification_status
  on citizens(verification_status, verification_submitted_at desc);
