-- M6: admin dashboard aggregate stats, audited XP adjustment, and a
-- display-name-only user search (never email — same "never expose emails"
-- rule followed throughout this schema). All three self-gate via is_admin()
-- and raise an exception for non-admins, so they're safe to leave callable
-- by `authenticated` (Supabase's default grant) rather than needing a revoke.

create or replace function public.get_admin_dashboard_stats()
returns table (
  total_users bigint,
  active_users_7d bigint,
  total_quest_completions bigint,
  total_xp_awarded bigint,
  total_workouts_completed bigint,
  active_challenges bigint,
  open_feedback bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from profiles),
    (select count(*) from profiles where last_active_day >= (current_date - interval '7 days')),
    (select count(*) from quest_completions),
    (select coalesce(sum(xp_amount), 0) from xp_transactions),
    (select count(*) from quest_completions qc join activities a on a.id = qc.activity_id where a.workout_id is not null),
    (select count(*) from challenges where status = 'active'),
    (select count(*) from feedback where status = 'open');
end;
$$;

create or replace function public.search_profiles_admin(p_query text)
returns table (user_id uuid, display_name text, current_xp integer, current_level smallint)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select p.id, p.display_name, p.current_xp, p.current_level
  from public.profiles p
  where p.display_name ilike '%' || p_query || '%'
  order by p.display_name
  limit 20;
end;
$$;

-- Routes through award_xp (idempotent ledger, level recompute) then writes
-- the one audit_logs row this action is required to produce. p_xp_amount can
-- be negative (a correction). A fresh random source_id per call means every
-- click is a distinct, real adjustment — no accidental idempotency no-op for
-- what's meant to be a deliberate one-off action.
create or replace function public.admin_adjust_xp(p_user_id uuid, p_xp_amount integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_after jsonb;
  v_source_id uuid := gen_random_uuid();
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if p_xp_amount = 0 then
    raise exception 'xp_amount must not be zero';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'a reason is required';
  end if;

  select jsonb_build_object('current_xp', current_xp, 'current_level', current_level) into v_before
  from public.profiles where id = p_user_id;
  if v_before is null then
    raise exception 'user not found';
  end if;

  perform public.award_xp(
    p_user_id, 'admin_adjustment', v_source_id, p_xp_amount,
    'admin_adjustment:' || v_source_id::text, p_reason
  );

  select jsonb_build_object('current_xp', current_xp, 'current_level', current_level) into v_after
  from public.profiles where id = p_user_id;

  insert into public.audit_logs (actor_id, action, target_type, target_id, before, after, reason)
  values (v_actor, 'xp_adjustment', 'profile', p_user_id, v_before, v_after, p_reason);
end;
$$;

grant execute on function public.get_admin_dashboard_stats() to authenticated;
grant execute on function public.search_profiles_admin(text) to authenticated;
grant execute on function public.admin_adjust_xp(uuid, integer, text) to authenticated;
