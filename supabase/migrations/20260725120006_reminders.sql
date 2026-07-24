create table public.reminder_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  channel text[] not null default '{in_app}',
  quiet_hours_start time,
  quiet_hours_end time,
  snooze_until timestamptz,
  muted boolean not null default false,
  max_per_day smallint not null default 5 check (max_per_day > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reminder_preferences enable row level security;
create trigger set_reminder_preferences_updated_at before update on public.reminder_preferences for each row execute function public.set_updated_at();
create policy "reminder_preferences_owner_all" on public.reminder_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('reminder','streak_recovery','achievement_unlocked','challenge_activity')),
  channel text not null check (channel in ('in_app','email')),
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notification_logs enable row level security;
create index notification_logs_user_idx on public.notification_logs (user_id, sent_at desc);
create policy "notification_logs_owner_select" on public.notification_logs for select using (auth.uid() = user_id);
create policy "notification_logs_owner_update_read" on public.notification_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- System-inserted only (by evaluate_achievements, process_daily_streaks, etc.) —
-- users may only mark their own notifications read (read_at), nothing else.
revoke insert, delete on public.notification_logs from authenticated;
revoke update on public.notification_logs from authenticated;
grant update (read_at) on public.notification_logs to authenticated;
