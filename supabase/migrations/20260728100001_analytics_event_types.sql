-- Replaces analytics_events.event_name's CHECK-constraint enum with a lookup
-- table, so Phase 3 milestones can register new event names with a plain
-- data insert instead of a schema migration each time.
create table public.analytics_event_types (
  name text primary key,
  category text not null default 'general',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.analytics_event_types enable row level security;
-- Reference data: readable by any authenticated user (so client code can
-- validate event names if needed), writable only by admins.
create policy "analytics_event_types_select" on public.analytics_event_types
  for select using (auth.role() = 'authenticated');
create policy "analytics_event_types_admin_write" on public.analytics_event_types
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.analytics_event_types (name, category) values
  ('signup_completed', 'auth'),
  ('onboarding_completed', 'auth'),
  ('daily_plan_generated', 'quests'),
  ('quest_completed', 'quests'),
  ('quest_skipped', 'quests'),
  ('quest_replaced', 'quests'),
  ('make_today_easier_used', 'quests'),
  ('work_session_started', 'work_mode'),
  ('work_session_completed', 'work_mode'),
  ('achievement_unlocked', 'gamification'),
  ('streak_freeze_used', 'gamification'),
  ('streak_reset', 'gamification'),
  ('challenge_joined', 'challenges'),
  ('challenge_left', 'challenges'),
  ('reminder_snoozed', 'reminders'),
  ('feedback_submitted', 'feedback'),
  ('check_in_submitted', 'personalisation');

-- Drop the existing CHECK constraint on event_name without hardcoding its
-- auto-generated name (defensive against naming drift across environments).
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'public.analytics_events'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%event_name%';
  if con_name is not null then
    execute format('alter table public.analytics_events drop constraint %I', con_name);
  end if;
end $$;

alter table public.analytics_events
  add constraint analytics_events_event_name_fkey
  foreign key (event_name) references public.analytics_event_types(name);
