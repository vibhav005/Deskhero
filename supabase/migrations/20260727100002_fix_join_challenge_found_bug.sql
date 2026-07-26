-- Bug fix: join_challenge_by_code used PL/pgSQL's ambient FOUND variable to
-- branch between INSERT (new member) and UPDATE (rejoin), but FOUND gets
-- overwritten by every subsequent SQL statement — the intervening
-- `select count(*) into v_active_count` always sets FOUND=true (COUNT(*)
-- always returns exactly one row), so every join silently took the UPDATE
-- branch and updated zero rows instead of inserting. New members' joins
-- reported success but never actually created a membership row. Confirmed
-- live: two test users "joined" a challenge and neither appeared in
-- challenge_members. Fixed by capturing membership existence into an
-- explicit boolean right after the lookup, instead of relying on FOUND.
create or replace function public.join_challenge_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.challenges%rowtype;
  v_existing public.challenge_members%rowtype;
  v_is_existing_member boolean;
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
  v_is_existing_member := v_existing.user_id is not null;

  if v_is_existing_member and v_existing.left_at is null then
    return v_challenge.id;
  end if;

  select count(*) into v_active_count from public.challenge_members
  where challenge_id = v_challenge.id and left_at is null;
  if v_active_count >= v_challenge.max_members then
    raise exception 'Challenge is full';
  end if;

  if v_is_existing_member then
    update public.challenge_members set left_at = null, joined_at = now()
    where challenge_id = v_challenge.id and user_id = auth.uid();
  else
    insert into public.challenge_members (challenge_id, user_id, role)
    values (v_challenge.id, auth.uid(), 'member');
  end if;

  return v_challenge.id;
end;
$$;
