create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Computed in the user's timezone at generation time (see timezone_snapshot).
  plan_date date not null,
  timezone_snapshot text not null,
  quest_count smallint not null,
  generated_reason text not null default 'standard' check (generated_reason in ('standard','easier','recovery')),
  all_completed_bonus_awarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);
alter table public.daily_plans enable row level security;
create trigger set_daily_plans_updated_at before update on public.daily_plans for each row execute function public.set_updated_at();
create index daily_plans_user_date_idx on public.daily_plans (user_id, plan_date desc);
create policy "daily_plans_owner_all" on public.daily_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.daily_quests (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references public.daily_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  "position" smallint not null,
  status text not null default 'assigned' check (status in ('assigned','completed','skipped')),
  assigned_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_plan_id, activity_id)
);
alter table public.daily_quests enable row level security;
create trigger set_daily_quests_updated_at before update on public.daily_quests for each row execute function public.set_updated_at();
create index daily_quests_user_idx on public.daily_quests (user_id, status);
create policy "daily_quests_owner_select" on public.daily_quests for select using (auth.uid() = user_id);
create policy "daily_quests_owner_insert" on public.daily_quests for insert with check (auth.uid() = user_id);
create policy "daily_quests_owner_update" on public.daily_quests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Note: completion (status -> 'completed') must always go through
-- complete_activity_and_award_xp (SECURITY DEFINER) so the paired
-- quest_completions/xp_transactions rows are written atomically. Plain owner
-- updates stay allowed here only for "skip" and "replace" (simple status/
-- activity swaps with no XP implications) — application code is responsible
-- for never taking the completion shortcut directly.

-- quest_completions is deliberately shared between daily-quest completions and
-- Work Mode break completions (exactly one of daily_quest_id/work_session_id is
-- set) so both count identically toward stats/achievements — this is the
-- concrete fix for Phase 1 bug #3 (Work Mode being disconnected from stats).
-- work_session_id's FK is added in the work_sessions migration once that table exists.
create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_quest_id uuid unique references public.daily_quests(id) on delete cascade,
  work_session_id uuid,
  activity_id uuid not null references public.activities(id) on delete restrict,
  completed_at timestamptz not null default now(),
  notes text,
  paused_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  constraint quest_completions_one_source check (
    (daily_quest_id is not null and work_session_id is null) or
    (daily_quest_id is null and work_session_id is not null)
  )
);
alter table public.quest_completions enable row level security;
create index quest_completions_user_idx on public.quest_completions (user_id, completed_at desc);
create policy "quest_completions_owner_select" on public.quest_completions for select using (auth.uid() = user_id);
create policy "quest_completions_owner_update_notes" on public.quest_completions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Insert only via complete_activity_and_award_xp / complete_work_session_break
-- (both SECURITY DEFINER) — no direct client insert, ever.
revoke insert on public.quest_completions from authenticated;
revoke update on public.quest_completions from authenticated;
grant update (notes) on public.quest_completions to authenticated;
