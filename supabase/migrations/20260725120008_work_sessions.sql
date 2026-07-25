create table public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  planned_minutes smallint not null check (planned_minutes between 15 and 90),
  actual_minutes smallint,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  break_taken boolean not null default false,
  break_activity_id uuid references public.activities(id),
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.work_sessions enable row level security;
create trigger set_work_sessions_updated_at before update on public.work_sessions for each row execute function public.set_updated_at();
create index work_sessions_user_idx on public.work_sessions (user_id, started_at desc);
create policy "work_sessions_owner_all" on public.work_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Now that work_sessions exists, wire up the FK deferred from the daily_loop migration.
alter table public.quest_completions
  add constraint quest_completions_work_session_id_fkey
  foreign key (work_session_id) references public.work_sessions(id) on delete cascade;
alter table public.quest_completions
  add constraint quest_completions_work_session_id_key unique (work_session_id);

-- ---------------------------------------------------------------------------
-- complete_work_session_break: the Work Mode equivalent of
-- complete_activity_and_award_xp. Routes through the same quest_completions
-- table, award_xp, and evaluate_achievements — this is the concrete fix for
-- Phase 1 bug #3 (Work Mode breaks were disconnected from stats/achievements).
-- Does NOT touch the daily streak — streaks are specifically about the daily
-- quest plan, matching Phase 1 semantics.
-- ---------------------------------------------------------------------------
create or replace function public.complete_work_session_break(
  p_user_id uuid,
  p_work_session_id uuid,
  p_activity_id uuid
)
returns table (completed boolean, completion_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_activity record;
  v_completion_id uuid;
begin
  select * into v_session
  from public.work_sessions
  where id = p_work_session_id and user_id = p_user_id;

  if not found or v_session.status <> 'active' then
    return query select false, null::uuid;
    return;
  end if;

  select * into v_activity from public.activities where id = p_activity_id;

  insert into public.quest_completions (user_id, work_session_id, activity_id)
  values (p_user_id, p_work_session_id, p_activity_id)
  on conflict (work_session_id) do nothing
  returning id into v_completion_id;

  if v_completion_id is null then
    return query select false, null::uuid;
    return;
  end if;

  update public.work_sessions
  set status = 'completed', ended_at = now(), break_taken = true, break_activity_id = p_activity_id
  where id = p_work_session_id;

  perform public.award_xp(
    p_user_id, 'quest_completion', v_completion_id, v_activity.xp_value,
    'quest_completion:' || v_completion_id::text
  );

  perform public.evaluate_achievements(p_user_id);

  return query select true, v_completion_id;
end;
$$;
