-- M5: invite-code join flow + automatic contribution tracking.

-- ---------------------------------------------------------------------------
-- Raw self-insert into challenge_members was previously allowed for ANY
-- challenge_id with no check on visibility or invite code — meaning anyone
-- who learned a challenge's id (e.g. a leaked link) could join an
-- invite_code/private challenge without ever proving they had the code.
-- Restrict the raw-insert RLS path to public+active challenges only; joining
-- invite_code/private challenges now requires join_challenge_by_code below.
-- ---------------------------------------------------------------------------
drop policy "challenge_members_insert_self" on public.challenge_members;
create policy "challenge_members_insert_self" on public.challenge_members
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.visibility = 'public' and c.status = 'active'
    )
  );

-- The member-cap trigger only ran on INSERT; a rejoin after leaving goes
-- through UPDATE (clearing left_at) and could silently bypass the cap.
create or replace function public.enforce_challenge_member_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_count integer;
  v_max smallint;
begin
  select max_members into v_max from public.challenges where id = new.challenge_id;
  select count(*) into v_active_count from public.challenge_members where challenge_id = new.challenge_id and left_at is null;
  if v_active_count >= v_max then
    raise exception 'Challenge is full';
  end if;
  return new;
end;
$$;

create trigger challenge_members_rejoin_cap_check
  before update of left_at on public.challenge_members
  for each row
  when (old.left_at is not null and new.left_at is null)
  execute function public.enforce_challenge_member_cap();

-- The existing UPDATE policy has no column restriction, so a member could
-- otherwise rewrite their own `role` to 'owner' in the row directly (cosmetic
-- only — nothing in RLS or the app trusts this column for authorization,
-- challenges.owner_id is the real authority — but there's no reason to leave
-- it open). Only left_at (leaving/rejoining) is meant to be self-service.
revoke update on public.challenge_members from authenticated;
grant update (left_at) on public.challenge_members to authenticated;

-- ---------------------------------------------------------------------------
-- join_challenge_by_code: the only way into an invite_code/private challenge.
-- Resolves the code server-side (RLS would otherwise hide the row from a
-- non-member), re-checks the member cap explicitly (the INSERT/UPDATE
-- triggers above are a second layer, not the only one), and handles both a
-- first-time join and a rejoin-after-leaving.
-- ---------------------------------------------------------------------------
create or replace function public.join_challenge_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.challenges%rowtype;
  v_existing public.challenge_members%rowtype;
  v_active_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_challenge from public.challenges
  where invite_code = p_invite_code and status = 'active';
  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  select * into v_existing from public.challenge_members
  where challenge_id = v_challenge.id and user_id = auth.uid();

  if found and v_existing.left_at is null then
    return v_challenge.id;
  end if;

  select count(*) into v_active_count from public.challenge_members
  where challenge_id = v_challenge.id and left_at is null;
  if v_active_count >= v_challenge.max_members then
    raise exception 'Challenge is full';
  end if;

  if found then
    update public.challenge_members set left_at = null, joined_at = now()
    where challenge_id = v_challenge.id and user_id = auth.uid();
  else
    insert into public.challenge_members (challenge_id, user_id, role)
    values (v_challenge.id, auth.uid(), 'member');
  end if;

  return v_challenge.id;
end;
$$;

grant execute on function public.join_challenge_by_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- record_challenge_contributions: internal-only helper, invoked via `perform`
-- from complete_activity_and_award_xp / complete_work_session_break below.
-- Logs one contribution row per active membership in a currently-active,
-- in-window challenge. Not directly callable by clients (see revoke below) —
-- letting a user pick their own p_points would let them inflate their own
-- leaderboard standing.
-- ---------------------------------------------------------------------------
create or replace function public.record_challenge_contributions(
  p_user_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.challenge_contributions (challenge_id, user_id, source_type, source_id, contribution_points)
  select cm.challenge_id, p_user_id, p_source_type, p_source_id, greatest(p_points, 1)
  from public.challenge_members cm
  join public.challenges c on c.id = cm.challenge_id
  where cm.user_id = p_user_id
    and cm.left_at is null
    and c.status = 'active'
    and (c.starts_at is null or c.starts_at <= current_date)
    and (c.ends_at is null or c.ends_at >= current_date);
end;
$$;

revoke execute on function public.record_challenge_contributions(uuid, text, uuid, integer) from anon, authenticated;

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
  perform public.record_challenge_contributions(p_user_id, 'quest_completion', v_completion_id, v_activity.xp_value);

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
  perform public.record_challenge_contributions(p_user_id, 'quest_completion', v_completion_id, v_activity.xp_value);

  perform public.evaluate_achievements(p_user_id);

  return query select true, v_completion_id;
end;
$$;
