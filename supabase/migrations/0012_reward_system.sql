-- Migration: Reward System
-- Adds anonymous leaderboard opt-in, redeemable badge costs, and seeds badge catalogue.

-- 1. Add anonymous leaderboard preference to citizens
alter table citizens
  add column if not exists anonymous_leaderboard boolean not null default false;

-- 2. Add point_cost column to badges (null = automatic/non-redeemable)
alter table badges
  add column if not exists point_cost integer check (point_cost is null or point_cost > 0);

-- 3. Seed redeemable badges (idempotent)
insert into badges (badge_type, is_active, point_cost) values
  ('civic_champion',       true, 500),
  ('trusted_contributor',  true, 1000),
  ('community_hero',       true, 2000)
on conflict (badge_type) do update
  set point_cost = excluded.point_cost,
      is_active   = true;

-- 4. Seed milestone/automatic badges (no cost)
insert into badges (badge_type, is_active, point_cost) values
  ('corruption_crusader',  true, null),
  ('evidence_expert',      true, null),
  ('community_guardian',   true, null)
on conflict (badge_type) do nothing;

-- 5. Performance index for leaderboard queries
create index if not exists idx_citizens_civic_points_desc
  on citizens (civic_points desc);
