create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in (
    'quest_completion','daily_bonus','achievement','challenge_contribution','admin_adjustment','streak_recovery'
  )),
  source_id uuid,
  xp_amount integer not null,
  idempotency_key text not null unique,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.xp_transactions enable row level security;
create index xp_transactions_user_idx on public.xp_transactions (user_id, created_at desc);
create policy "xp_transactions_owner_select" on public.xp_transactions for select using (auth.uid() = user_id);
create policy "xp_transactions_admin_select" on public.xp_transactions for select using (public.is_admin());
-- The ledger's only legitimate write path is award_xp() below. This is the
-- concrete, DB-enforced answer to "never trust client XP values" — not a
-- convention application code has to remember to follow.
revoke insert, update, delete on public.xp_transactions from authenticated;

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  -- Fixes Phase 1 bug #4 (no unlock timestamp existed before).
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
create index user_achievements_user_idx on public.user_achievements (user_id);
create policy "user_achievements_owner_select" on public.user_achievements for select using (auth.uid() = user_id);
revoke insert, update, delete on public.user_achievements from authenticated;

-- ---------------------------------------------------------------------------
-- award_xp: the single, idempotent entry point for all XP. The unique
-- constraint on idempotency_key (not an app-level check-then-insert) is what
-- actually prevents duplicate rewards under a double-tap or a retried request.
-- ---------------------------------------------------------------------------
create or replace function public.award_xp(
  p_user_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_xp_amount integer,
  p_idempotency_key text,
  p_note text default null
)
returns table (awarded boolean, xp_transaction_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_new_level smallint;
begin
  insert into public.xp_transactions (user_id, source_type, source_id, xp_amount, idempotency_key, note)
  values (p_user_id, p_source_type, p_source_id, p_xp_amount, p_idempotency_key, p_note)
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    return query select false, null::uuid;
    return;
  end if;

  select l.level into v_new_level
  from public.levels l
  where l.min_xp <= (select p.current_xp + p_xp_amount from public.profiles p where p.id = p_user_id)
  order by l.min_xp desc
  limit 1;

  update public.profiles
  set current_xp = current_xp + p_xp_amount,
      current_level = coalesce(v_new_level, current_level)
  where id = p_user_id;

  return query select true, v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- evaluate_achievements: shared by both complete_activity_and_award_xp and
-- complete_work_session_break (defined in the work_sessions migration) so the
-- criteria logic lives in exactly one place.
-- ---------------------------------------------------------------------------
create or replace function public.evaluate_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule record;
  v_progress integer;
  v_user_achievement_id uuid;
begin
  for v_rule in
    select ar.threshold, ar.metric, a.id as achievement_id, a.xp_bonus
    from public.achievement_rules ar
    join public.achievements a on a.id = ar.achievement_id
    where a.is_active
  loop
    v_progress := case v_rule.metric
      when 'questsCompleted' then (
        select count(*) from public.quest_completions where user_id = p_user_id
      )
      when 'hydrationCompleted' then (
        select count(*) from public.quest_completions qc
        join public.activities act on act.id = qc.activity_id
        where qc.user_id = p_user_id and act.category = 'hydration'
      )
      when 'walksCompleted' then (
        select count(*) from public.quest_completions qc
        join public.activities act on act.id = qc.activity_id
        where qc.user_id = p_user_id and act.category = 'walking'
      )
      when 'postureCompleted' then (
        select count(*) from public.quest_completions qc
        join public.activities act on act.id = qc.activity_id
        where qc.user_id = p_user_id and act.category = 'posture'
      )
      when 'mobilityCompleted' then (
        select count(*) from public.quest_completions qc
        join public.activities act on act.id = qc.activity_id
        where qc.user_id = p_user_id and act.category = 'mobility'
      )
      when 'workoutsCompleted' then (
        select count(*) from public.quest_completions qc
        join public.activities act on act.id = qc.activity_id
        where qc.user_id = p_user_id and act.workout_id is not null
      )
      when 'bestStreak' then (
        select best_streak from public.profiles where id = p_user_id
      )
      when 'daysActive' then (
        select count(distinct dp.plan_date) from public.daily_plans dp
        join public.daily_quests dq on dq.daily_plan_id = dp.id
        join public.quest_completions qc on qc.daily_quest_id = dq.id
        where dp.user_id = p_user_id
      )
      else 0
    end;

    if v_progress >= v_rule.threshold then
      insert into public.user_achievements (user_id, achievement_id)
      values (p_user_id, v_rule.achievement_id)
      on conflict (user_id, achievement_id) do nothing
      returning id into v_user_achievement_id;

      if v_user_achievement_id is not null then
        perform public.award_xp(
          p_user_id, 'achievement', v_user_achievement_id, v_rule.xp_bonus,
          'achievement:' || v_user_achievement_id::text
        );
        insert into public.notification_logs (user_id, kind, channel, payload)
        values (p_user_id, 'achievement_unlocked', 'in_app', jsonb_build_object('achievement_id', v_rule.achievement_id));
      end if;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_activity_and_award_xp: orchestrates a daily-quest completion —
-- ownership check, the completion row (its own unique(daily_quest_id) is a
-- second idempotency layer), marking the assignment done, quest XP, the
-- streak increment, the daily-plan bonus (safe to re-check every call), and
-- achievement evaluation.
-- ---------------------------------------------------------------------------
create or replace function public.complete_activity_and_award_xp(
  p_user_id uuid,
  p_daily_quest_id uuid,
  p_notes text default null
)
returns table (completed boolean, completion_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily_quest record;
  v_activity record;
  v_completion_id uuid;
  v_plan record;
  v_all_done boolean;
  v_completions_in_plan integer;
begin
  select * into v_daily_quest
  from public.daily_quests
  where id = p_daily_quest_id and user_id = p_user_id;

  if not found or v_daily_quest.status <> 'assigned' then
    return query select false, null::uuid;
    return;
  end if;

  select * into v_activity from public.activities where id = v_daily_quest.activity_id;

  insert into public.quest_completions (user_id, daily_quest_id, activity_id, notes)
  values (p_user_id, p_daily_quest_id, v_daily_quest.activity_id, p_notes)
  on conflict (daily_quest_id) do nothing
  returning id into v_completion_id;

  if v_completion_id is null then
    return query select false, null::uuid;
    return;
  end if;

  update public.daily_quests set status = 'completed' where id = p_daily_quest_id;

  perform public.award_xp(
    p_user_id, 'quest_completion', v_completion_id, v_activity.xp_value,
    'quest_completion:' || v_completion_id::text
  );

  select * into v_plan from public.daily_plans where id = v_daily_quest.daily_plan_id;

  -- Streak: increment only on the first completion of this plan/day.
  select count(*) into v_completions_in_plan
  from public.quest_completions qc
  join public.daily_quests dq on dq.id = qc.daily_quest_id
  where dq.daily_plan_id = v_plan.id;

  if v_completions_in_plan = 1 then
    update public.profiles
    set current_streak = current_streak + 1,
        best_streak = greatest(best_streak, current_streak + 1),
        last_active_day = v_plan.plan_date
    where id = p_user_id
      and (last_active_day is null or last_active_day < v_plan.plan_date);
  end if;

  -- Daily bonus: safe to re-check every completion, no-op via idempotency once awarded.
  select not exists (
    select 1 from public.daily_quests where daily_plan_id = v_plan.id and status = 'assigned'
  ) into v_all_done;

  if v_all_done then
    perform public.award_xp(
      p_user_id, 'daily_bonus', v_plan.id, 50,
      'daily_bonus:' || v_plan.id::text
    );
    update public.daily_plans set all_completed_bonus_awarded = true where id = v_plan.id;
  end if;

  perform public.evaluate_achievements(p_user_id);

  return query select true, v_completion_id;
end;
$$;
