create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  hours_sitting smallint,
  activity_level text check (activity_level in ('inactive','light','moderate')),
  goal text check (goal in ('energy','posture','strength','flexibility','sleep','general')),
  session_duration smallint check (session_duration in (5,10,15,20)),
  activity_preference text check (activity_preference in ('walking','stretching','strength','breathing','mixed')),
  work_schedule jsonb not null default '{}'::jsonb,
  reminder_preference text check (reminder_preference in ('work','morning','evening','none')),
  quiet_hours_start time,
  quiet_hours_end time,
  -- Fixed, non-diagnostic limitation tags (validated again in the Zod schema).
  limitation_tags text[] not null default '{}',
  accessibility_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

create policy "user_preferences_owner_all" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
