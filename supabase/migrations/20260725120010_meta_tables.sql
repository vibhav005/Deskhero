create table public.user_favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, activity_id)
);
alter table public.user_favourites enable row level security;
create policy "user_favourites_owner_all" on public.user_favourites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_id is nullable + on delete set null deliberately: deleting an account
-- removes the identifying link while retaining anonymised feedback content,
-- honoring both "right to erasure" and not silently losing product feedback.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  category text not null check (category in ('bug','confusing_experience','feature_request','exercise_feedback','reminder_feedback','general')),
  comments text,
  page_context text,
  feature_context text,
  contact_ok boolean not null default false,
  target_type text,
  target_id uuid,
  status text not null default 'open' check (status in ('open','reviewed','resolved')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create index feedback_status_idx on public.feedback (status);
create policy "feedback_owner_select" on public.feedback for select using (auth.uid() = user_id);
create policy "feedback_admin_select" on public.feedback for select using (public.is_admin());
create policy "feedback_owner_insert" on public.feedback for insert with check (auth.uid() = user_id);
create policy "feedback_admin_update" on public.feedback for update using (public.is_admin()) with check (public.is_admin());

-- Truly immutable: no update/delete grants to the API-facing roles at all.
-- Inserted only by audited admin functions (added when M6 builds admin actions).
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  before jsonb,
  after jsonb,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create policy "audit_logs_admin_select" on public.audit_logs for select using (public.is_admin());
revoke insert, update, delete on public.audit_logs from authenticated, anon;

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid,
  event_name text not null check (event_name in (
    'signup_completed','onboarding_completed','daily_plan_generated',
    'quest_completed','quest_skipped','quest_replaced','make_today_easier_used',
    'work_session_started','work_session_completed','achievement_unlocked',
    'streak_freeze_used','streak_reset','challenge_joined','challenge_left',
    'reminder_snoozed','feedback_submitted'
  )),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.analytics_events enable row level security;
create index analytics_events_name_idx on public.analytics_events (event_name, occurred_at desc);
-- Gated by consent: an insert is only allowed if the user has opted into analytics.
create policy "analytics_events_owner_insert" on public.analytics_events for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.profiles where id = auth.uid() and consent_analytics = true)
  );
create policy "analytics_events_admin_select" on public.analytics_events for select using (public.is_admin());
