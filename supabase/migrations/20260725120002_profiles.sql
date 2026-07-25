-- profiles: one row per auth user. Gamification/role columns are locked down
-- at the grant level below — only SECURITY DEFINER functions may change them,
-- never the user directly, regardless of what the RLS policy would otherwise permit.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_range text check (age_range in ('18-24','25-34','35-44','45-54','55-64','65+')),
  timezone text not null default 'UTC',
  onboarding_completed_at timestamptz,
  role text not null default 'user' check (role in ('user','admin')),
  current_xp integer not null default 0 check (current_xp >= 0),
  current_level smallint not null default 1,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  streak_freeze_available boolean not null default true,
  streak_freeze_reset_at timestamptz,
  last_active_day date,
  consent_tos_at timestamptz,
  consent_privacy_at timestamptz,
  consent_analytics boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Admin check helper, used throughout RLS policies in later migrations.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Column-level protection: users can only ever touch their own basic profile
-- fields. current_xp/current_streak/best_streak/current_level/role can only
-- be changed by award_xp(), process_daily_streaks(), or an audited admin
-- function — this is a DB-enforced boundary, not an app-code convention.
revoke update on public.profiles from authenticated;
grant update (display_name, age_range, timezone, consent_analytics, consent_tos_at, consent_privacy_at)
  on public.profiles to authenticated;
