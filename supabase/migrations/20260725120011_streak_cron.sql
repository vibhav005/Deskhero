-- Isolated in its own migration: if pg_cron needs to be enabled via the
-- Supabase dashboard first on this project, only this file is affected —
-- every other table/function above still applies cleanly.
create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;

-- ---------------------------------------------------------------------------
-- process_daily_streaks: runs hourly (not once at UTC midnight — 100-500 users
-- span many timezones), processing only users whose local time just crossed
-- midnight. Per missed day: consume the freeze if available (streak preserved,
-- gentle notification logged) else reset current_streak to 0 (best_streak
-- untouched). Never a failure screen — matches "no failure-shame" product
-- principle. Also replenishes the freeze on its rolling 7-day window.
-- ---------------------------------------------------------------------------
create or replace function public.process_daily_streaks()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_yesterday date;
  v_completions integer;
begin
  for v_profile in
    select * from public.profiles
    where extract(hour from (now() at time zone timezone)) = 0
  loop
    v_yesterday := ((now() at time zone v_profile.timezone)::date - interval '1 day')::date;

    select count(*) into v_completions
    from public.daily_plans dp
    join public.daily_quests dq on dq.daily_plan_id = dp.id
    join public.quest_completions qc on qc.daily_quest_id = dq.id
    where dp.user_id = v_profile.id and dp.plan_date = v_yesterday;

    if v_completions = 0
       and v_profile.last_active_day is not null
       and v_profile.last_active_day < v_yesterday then
      if v_profile.streak_freeze_available then
        update public.profiles
        set streak_freeze_available = false,
            streak_freeze_reset_at = now() + interval '7 days'
        where id = v_profile.id;

        insert into public.notification_logs (user_id, kind, channel, payload)
        values (
          v_profile.id, 'streak_recovery', 'in_app',
          jsonb_build_object('message', 'We used your weekly streak freeze to protect your progress.')
        );
      else
        update public.profiles
        set current_streak = 0
        where id = v_profile.id;

        insert into public.notification_logs (user_id, kind, channel, payload)
        values (
          v_profile.id, 'streak_recovery', 'in_app',
          jsonb_build_object('message', 'A small step today still counts. Let''s restart gently.')
        );
      end if;
    end if;

    if not v_profile.streak_freeze_available
       and v_profile.streak_freeze_reset_at is not null
       and now() >= v_profile.streak_freeze_reset_at then
      update public.profiles set streak_freeze_available = true where id = v_profile.id;
    end if;
  end loop;
end;
$$;

select cron.schedule('process-daily-streaks', '5 * * * *', $$select public.process_daily_streaks();$$);
