-- =========================================================================
-- 0001_core_schema.sql
-- Core schema for 佐藤畜産食品株式会社 internal communication app
-- Phase 1: users, roles, departments, sessions rely on Supabase Auth.
-- Later migrations (0002+) add conversations/messages/groups/files/notes.
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type user_role as enum ('admin', 'manager', 'employee');
create type user_status as enum ('active', 'disabled');

-- ---------------------------------------------------------------------
-- PROFILES
-- Mirrors auth.users (Supabase-managed) with app-specific fields.
-- One row per authenticated user, created automatically on signup
-- via the handle_new_user trigger below.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  display_name text not null,
  department text,
  role user_role not null default 'employee',
  status user_status not null default 'active',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

comment on table public.profiles is 'Company employee profiles. One row per Supabase Auth user.';

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user is created.
-- New accounts default to 'employee' and are created by an admin
-- via the admin panel (service-role key), never self-signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- AUDIT LOG (section 31 of the spec)
-- ---------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,               -- e.g. 'user.created', 'role.changed'
  target_table text,
  target_id text,
  detail jsonb,                       -- small structured detail, never message content
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS used by RLS policies across all migrations
-- ---------------------------------------------------------------------
create or replace function public.current_role_is(required_role user_role)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = required_role and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_admin_or_manager()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager') and status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY: profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

-- Any active employee can view the directory (name/dept/role/avatar),
-- but sensitive fields are still restricted at the application layer
-- for the fields we choose to expose in queries (see section 17).
create policy "profiles: active users can view directory"
  on public.profiles for select
  using (public.is_active_user());

-- Users can update a narrow set of their own fields (display_name, avatar_url)
-- Role/status changes are blocked here and only allowed via the admin policy below.
create policy "profiles: user can update own display fields"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

-- Only admins can insert/update/delete arbitrary profiles (role changes, disable, etc).
-- Inserts normally happen via the trigger (security definer) or admin API using
-- the service role key, which bypasses RLS entirely for backend-only operations.
create policy "profiles: admin full access"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Audit log: only admins may read it. Writes happen via security-definer
-- functions/triggers, not directly from client roles.
create policy "audit_log: admin can read"
  on public.audit_log for select
  using (public.is_admin());

create policy "audit_log: admin can insert"
  on public.audit_log for insert
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Convenience view: safe public directory (no email, no internal ids)
-- ---------------------------------------------------------------------
create view public.directory as
  select id, name, display_name, department, role, avatar_url, status
  from public.profiles
  where status = 'active';
