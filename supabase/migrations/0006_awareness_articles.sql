-- Migration 0006: Awareness Blog & Legal Rights Repository

-- 1. Create categories table
create table if not exists categories (
  category_id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  slug varchar(100) not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed default categories if not exist
insert into categories (name, slug) values
  ('Citizen Rights', 'citizen-rights'),
  ('Corruption Awareness', 'corruption-awareness'),
  ('Legal Information', 'legal-information'),
  ('Safety & Security', 'safety-security'),
  ('Reporting Guides', 'reporting-guides')
on conflict (name) do nothing;

-- 2. Create articles table
create table if not exists articles (
  article_id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  slug varchar(200) not null unique,
  description text not null,
  content text not null,
  category_id uuid not null references categories(category_id) on delete cascade,
  author_id uuid not null references app_users(user_id) on delete cascade,
  status content_status not null default 'draft',
  cover_image text,
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Create category_follows table
create table if not exists category_follows (
  follow_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(user_id) on delete cascade,
  category_id uuid not null references categories(category_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

-- 4. Alter notifications table to reference articles (conditional addition if column doesn't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='notifications' and column_name='article_id'
  ) then
    alter table notifications add column article_id uuid references articles(article_id) on delete cascade;
  end if;
end $$;
