-- M10: weekly planning — a per-day-of-week "intention" (workout / light /
-- recovery / rest / work-heavy) that generateDailyPlan() consults as one more
-- input signal, the same way it already consults consistency streaks and
-- daily check-ins (M9). It never pre-assigns specific activities for future
-- days, so it can't go stale or bypass the skip-history/scoring logic.

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Monday of the ISO week, in the user's timezone (see tz.currentWeekStartInTimezone).
  week_start_date date not null,
  active_days_target smallint not null default 5 check (active_days_target between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);
alter table public.weekly_plans enable row level security;
create trigger set_weekly_plans_updated_at before update on public.weekly_plans for each row execute function public.set_updated_at();
create policy "weekly_plans_owner_all" on public.weekly_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.weekly_plan_items (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- 0=Monday .. 6=Sunday (see tz.isoDayOfWeek).
  day_of_week smallint not null check (day_of_week between 0 and 6),
  day_type text not null check (day_type in ('workout', 'light', 'recovery', 'rest', 'work_heavy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (weekly_plan_id, day_of_week)
);
alter table public.weekly_plan_items enable row level security;
create trigger set_weekly_plan_items_updated_at before update on public.weekly_plan_items for each row execute function public.set_updated_at();
create index weekly_plan_items_plan_idx on public.weekly_plan_items (weekly_plan_id);
create policy "weekly_plan_items_owner_all" on public.weekly_plan_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Smart custom goals — realism-capped weekly targets. Progress is computed
-- read-only from existing quest_completions/work_sessions data (no new
-- tracking table), so a goal can never itself be falsified by the client.
create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_type text not null check (goal_type in (
    'stand_breaks', 'mobility_sessions', 'walking_days', 'work_mode_breaks', 'consistency_days'
  )),
  target_value smallint not null check (target_value between 1 and 35),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_goals enable row level security;
create trigger set_user_goals_updated_at before update on public.user_goals for each row execute function public.set_updated_at();
create index user_goals_user_active_idx on public.user_goals (user_id, is_active);
create policy "user_goals_owner_all" on public.user_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
