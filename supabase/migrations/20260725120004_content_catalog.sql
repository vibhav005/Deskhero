-- Content catalog: public-read, admin-write. Maps Phase 1's src/lib/data.ts
-- (QUESTS, ACHIEVEMENTS, LEVELS, the embedded workout routines) onto real tables.

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text,
  total_minutes smallint,
  difficulty text check (difficulty in ('easy','moderate','challenging')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workouts enable row level security;
create trigger set_workouts_updated_at before update on public.workouts for each row execute function public.set_updated_at();
create policy "workouts_public_read" on public.workouts for select using (is_active or public.is_admin());
create policy "workouts_admin_write" on public.workouts for all using (public.is_admin()) with check (public.is_admin());

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  instruction text not null,
  easier_variant text,
  icon text,
  equipment_free boolean not null default true,
  "position" text check ("position" in ('standing','seated','either')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.exercises enable row level security;
create trigger set_exercises_updated_at before update on public.exercises for each row execute function public.set_updated_at();
create policy "exercises_public_read" on public.exercises for select using (true);
create policy "exercises_admin_write" on public.exercises for all using (public.is_admin()) with check (public.is_admin());

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  "position" smallint not null,
  seconds integer,
  reps integer,
  unique (workout_id, "position")
);
alter table public.workout_exercises enable row level security;
create policy "workout_exercises_public_read" on public.workout_exercises for select using (true);
create policy "workout_exercises_admin_write" on public.workout_exercises for all using (public.is_admin()) with check (public.is_admin());

-- activities = Phase 1's "Quest"
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('mobility','walking','hydration','strength','posture','eye-care','breathing','sleep')),
  difficulty text not null check (difficulty in ('easy','moderate','challenging')),
  minutes smallint not null check (minutes > 0),
  xp_value smallint not null check (xp_value > 0),
  "position" text not null check ("position" in ('standing','seated','either')),
  equipment_free boolean not null default true,
  summary text not null,
  instructions text[] not null default '{}',
  safety_notes text,
  easier_alternative text,
  timer_seconds integer,
  workout_id uuid references public.workouts(id),
  -- Hard-excludes this activity for users whose user_preferences.limitation_tags overlap.
  contraindicated_tags text[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.activities enable row level security;
create trigger set_activities_updated_at before update on public.activities for each row execute function public.set_updated_at();
create index activities_category_idx on public.activities (category);
create policy "activities_public_read" on public.activities for select using (is_active or public.is_admin());
create policy "activities_admin_write" on public.activities for all using (public.is_admin()) with check (public.is_admin());

-- Fixed 7-row reference table (same thresholds as Phase 1 — no renumbering).
create table public.levels (
  level smallint primary key,
  name text not null,
  min_xp integer not null unique
);
alter table public.levels enable row level security;
create policy "levels_public_read" on public.levels for select using (true);
create policy "levels_admin_write" on public.levels for all using (public.is_admin()) with check (public.is_admin());

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text,
  target integer not null check (target > 0),
  metric text not null check (metric in (
    'questsCompleted','hydrationCompleted','walksCompleted','postureCompleted',
    'workoutsCompleted','mobilityCompleted','bestStreak','daysActive'
  )),
  -- Real stored rarity tier (fixes Phase 1 bug #5, which derived this client-side from target size).
  tier text not null check (tier in ('bronze','silver','gold')),
  xp_bonus integer not null default 0 check (xp_bonus >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.achievements enable row level security;
create trigger set_achievements_updated_at before update on public.achievements for each row execute function public.set_updated_at();
create policy "achievements_public_read" on public.achievements for select using (is_active or public.is_admin());
create policy "achievements_admin_write" on public.achievements for all using (public.is_admin()) with check (public.is_admin());

create table public.achievement_rules (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  metric text not null,
  comparator text not null default 'gte' check (comparator in ('gte','lte','eq')),
  threshold integer not null,
  sequence smallint not null default 1
);
alter table public.achievement_rules enable row level security;
create policy "achievement_rules_public_read" on public.achievement_rules for select using (true);
create policy "achievement_rules_admin_write" on public.achievement_rules for all using (public.is_admin()) with check (public.is_admin());
