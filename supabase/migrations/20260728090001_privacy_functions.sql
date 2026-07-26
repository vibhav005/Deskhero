-- M7: data export, progress reset, account deletion support.

-- analytics_events had no owner-select policy at all (only admin could read
-- it back) — a real gap for "export everything I own," since users could
-- write their own events but never read them.
create policy "analytics_events_owner_select" on public.analytics_events for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reset_my_progress: returns the caller to a fresh Level 1 without touching
-- the account itself, settings/preferences, or social relationships
-- (challenge membership, favourites, reminder prefs all survive). Wipes the
-- progress-specific rows: completions, the XP ledger, unlocked achievements,
-- daily plans (cascades daily_quests), work sessions, and this user's own
-- challenge contribution history (their standing on any leaderboard resets
-- along with everything else). Parameter-free by design — operates only on
-- auth.uid(), so a raw RPC call can never reset anyone else's progress.
-- ---------------------------------------------------------------------------
create or replace function public.reset_my_progress()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.quest_completions where user_id = v_uid;
  delete from public.xp_transactions where user_id = v_uid;
  delete from public.user_achievements where user_id = v_uid;
  delete from public.work_sessions where user_id = v_uid;
  delete from public.daily_plans where user_id = v_uid; -- cascades daily_quests
  delete from public.challenge_contributions where user_id = v_uid;

  update public.profiles
  set current_xp = 0,
      current_level = 1,
      current_streak = 0,
      best_streak = 0,
      last_active_day = null,
      streak_freeze_available = true,
      streak_freeze_reset_at = now()
  where id = v_uid;
end;
$$;

grant execute on function public.reset_my_progress() to authenticated;
