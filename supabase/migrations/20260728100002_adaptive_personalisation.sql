-- M9: adaptive personalisation core — persisted, explainable recommendation
-- factors and an optional daily readiness check-in. None of these tables
-- carry reward/XP implications, so plain owner RLS is sufficient (no
-- SECURITY DEFINER wrapper needed, unlike the gamification tables).

create table public.recommendation_scores (
  id uuid primary key default gen_random_uuid(),
  daily_quest_id uuid not null unique references public.daily_quests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  total_score integer not null,
  factors jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.recommendation_scores enable row level security;
create index recommendation_scores_user_idx on public.recommendation_scores (user_id);
create policy "recommendation_scores_owner_select" on public.recommendation_scores
  for select using (auth.uid() = user_id);
create policy "recommendation_scores_owner_insert" on public.recommendation_scores
  for insert with check (auth.uid() = user_id);
create policy "recommendation_scores_owner_update" on public.recommendation_scores
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.recommendation_explanations (
  id uuid primary key default gen_random_uuid(),
  recommendation_score_id uuid not null references public.recommendation_scores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  headline text not null,
  detail text,
  factor_key text not null,
  sequence smallint not null default 1,
  created_at timestamptz not null default now()
);
alter table public.recommendation_explanations enable row level security;
create index recommendation_explanations_score_idx on public.recommendation_explanations (recommendation_score_id, sequence);
create policy "recommendation_explanations_owner_select" on public.recommendation_explanations
  for select using (auth.uid() = user_id);
create policy "recommendation_explanations_owner_insert" on public.recommendation_explanations
  for insert with check (auth.uid() = user_id);
create policy "recommendation_explanations_owner_delete" on public.recommendation_explanations
  for delete using (auth.uid() = user_id);

create table public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_date date not null,
  energy_level smallint not null check (energy_level between 1 and 5),
  soreness_level smallint check (soreness_level between 1 and 5),
  -- Fixed, non-diagnostic mood tags (never a free-text symptom/diagnosis field) —
  -- same "no diagnosis" convention as user_preferences.limitation_tags.
  mood text check (mood in ('great', 'okay', 'tired', 'stressed', 'sore')),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);
alter table public.daily_check_ins enable row level security;
create index daily_check_ins_user_date_idx on public.daily_check_ins (user_id, check_in_date desc);
create policy "daily_check_ins_owner_all" on public.daily_check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
