-- profiles RLS only allows self-select, so a plain join from
-- challenge_contributions/challenge_members to profiles.display_name would
-- return nothing for a fellow member. These two functions are the narrow,
-- audited exception: they expose only (user_id, display_name, ...) — never
-- email, never other profile columns — and only for challenges the caller is
-- actually an active member of.

create or replace function public.get_challenge_leaderboard(p_challenge_id uuid)
returns table (user_id uuid, display_name text, contribution_count bigint, contribution_points bigint)
language sql
security definer
stable
set search_path = public
as $$
  select
    cc.user_id,
    coalesce(p.display_name, 'Member'),
    count(*),
    coalesce(sum(cc.contribution_points), 0)
  from public.challenge_contributions cc
  join public.profiles p on p.id = cc.user_id
  where cc.challenge_id = p_challenge_id
    and public.is_challenge_member(p_challenge_id)
  group by cc.user_id, p.display_name
  order by coalesce(sum(cc.contribution_points), 0) desc;
$$;

create or replace function public.get_challenge_members(p_challenge_id uuid)
returns table (user_id uuid, display_name text, role text, joined_at timestamptz, left_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select cm.user_id, coalesce(p.display_name, 'Member'), cm.role, cm.joined_at, cm.left_at
  from public.challenge_members cm
  join public.profiles p on p.id = cm.user_id
  where cm.challenge_id = p_challenge_id
    and public.is_challenge_member(p_challenge_id)
  order by cm.left_at nulls first, cm.joined_at;
$$;

grant execute on function public.get_challenge_leaderboard(uuid) to authenticated;
grant execute on function public.get_challenge_members(uuid) to authenticated;
