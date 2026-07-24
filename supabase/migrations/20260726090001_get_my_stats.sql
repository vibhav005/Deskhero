-- get_my_stats: aggregate counts backing both the achievements progress bars
-- and the progress dashboard's stat tiles. SECURITY INVOKER (Postgres
-- default) and parameter-free by design — it reads auth.uid() internally, so
-- it can only ever return the caller's own stats no matter what.
create or replace function public.get_my_stats()
returns table (
  quests_completed bigint,
  hydration_completed bigint,
  walks_completed bigint,
  posture_completed bigint,
  mobility_completed bigint,
  workouts_completed bigint,
  best_streak integer,
  days_active bigint
)
language sql
stable
set search_path = public
as $$
  select
    (select count(*) from quest_completions where user_id = auth.uid()),
    (select count(*) from quest_completions qc join activities a on a.id = qc.activity_id where qc.user_id = auth.uid() and a.category = 'hydration'),
    (select count(*) from quest_completions qc join activities a on a.id = qc.activity_id where qc.user_id = auth.uid() and a.category = 'walking'),
    (select count(*) from quest_completions qc join activities a on a.id = qc.activity_id where qc.user_id = auth.uid() and a.category = 'posture'),
    (select count(*) from quest_completions qc join activities a on a.id = qc.activity_id where qc.user_id = auth.uid() and a.category = 'mobility'),
    (select count(*) from quest_completions qc join activities a on a.id = qc.activity_id where qc.user_id = auth.uid() and a.workout_id is not null),
    (select best_streak from profiles where id = auth.uid()),
    (select count(distinct dp.plan_date) from daily_plans dp
       join daily_quests dq on dq.daily_plan_id = dp.id
       join quest_completions qc on qc.daily_quest_id = dq.id
       where dp.user_id = auth.uid());
$$;
