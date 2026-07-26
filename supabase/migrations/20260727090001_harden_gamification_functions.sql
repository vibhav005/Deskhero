-- Security fix: award_xp, evaluate_achievements, and process_daily_streaks
-- were created with Postgres's default EXECUTE-to-PUBLIC grant, and
-- complete_activity_and_award_xp / complete_work_session_break trusted their
-- p_user_id parameter instead of the caller's actual session. Together this
-- let any authenticated user call award_xp directly via the PostgREST RPC
-- endpoint (bypassing the app entirely) and grant themselves or anyone else
-- arbitrary XP — confirmed live against the hosted project before this fix.
--
-- Two-part fix:
--  1. complete_activity_and_award_xp / complete_work_session_break now assert
--     p_user_id = auth.uid(), so even a raw RPC call can only ever act on the
--     caller's own data (both call sites already pass auth.getUser()'s id,
--     so legitimate usage is unaffected).
--  2. award_xp, evaluate_achievements, and process_daily_streaks are
--     internal-only — never called directly by the app, only via `perform`
--     from other SECURITY DEFINER functions (which run as the function
--     owner, unaffected by this revoke) or by pg_cron. EXECUTE is revoked
--     from PUBLIC so no authenticated/anon client can invoke them directly.

revoke execute on function public.award_xp(uuid, text, uuid, integer, text, text) from public;
revoke execute on function public.evaluate_achievements(uuid) from public;
revoke execute on function public.process_daily_streaks() from public;

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
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorized';
  end if;

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
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorized';
  end if;

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
