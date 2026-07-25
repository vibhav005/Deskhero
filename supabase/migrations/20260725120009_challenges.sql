create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  visibility text not null check (visibility in ('public','invite_code','private')),
  invite_code text unique,
  owner_id uuid not null references public.profiles(id),
  max_members smallint not null default 30 check (max_members between 20 and 50),
  status text not null default 'active' check (status in ('active','archived','disabled')),
  starts_at date,
  ends_at date,
  ranking_metric text not null default 'participation' check (ranking_metric in ('participation','contribution','consistency','team_progress')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.challenges enable row level security;
create trigger set_challenges_updated_at before update on public.challenges for each row execute function public.set_updated_at();

create table public.challenge_members (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);
alter table public.challenge_members enable row level security;
create index challenge_members_active_idx on public.challenge_members (challenge_id) where left_at is null;

-- Used throughout RLS below (and by the app) to check "am I an active member of this challenge".
create or replace function public.is_challenge_member(p_challenge_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.challenge_members
    where challenge_id = p_challenge_id and user_id = auth.uid() and left_at is null
  );
$$;

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

create trigger challenge_members_cap_check
  before insert on public.challenge_members
  for each row execute function public.enforce_challenge_member_cap();

-- Whoever creates a challenge is automatically its first member.
create or replace function public.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.challenge_members (challenge_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger challenges_add_owner_member
  after insert on public.challenges
  for each row execute function public.add_owner_as_member();

create policy "challenges_select_public" on public.challenges for select using (visibility = 'public');
create policy "challenges_select_member" on public.challenges for select using (public.is_challenge_member(id));
create policy "challenges_select_owner" on public.challenges for select using (auth.uid() = owner_id);
create policy "challenges_select_admin" on public.challenges for select using (public.is_admin());
create policy "challenges_insert_own" on public.challenges for insert with check (auth.uid() = owner_id);
create policy "challenges_update_owner" on public.challenges for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "challenges_update_admin" on public.challenges for update using (public.is_admin()) with check (public.is_admin());

create policy "challenge_members_select_self" on public.challenge_members for select using (auth.uid() = user_id);
create policy "challenge_members_select_fellow" on public.challenge_members for select using (public.is_challenge_member(challenge_id));
create policy "challenge_members_select_admin" on public.challenge_members for select using (public.is_admin());
create policy "challenge_members_insert_self" on public.challenge_members for insert with check (auth.uid() = user_id);
create policy "challenge_members_update_self" on public.challenge_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Never expose private membership or emails: contributions only ever join to
-- profiles.display_name in application queries, never auth.users.email.
create table public.challenge_contributions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('quest_completion','xp_transaction')),
  source_id uuid not null,
  contribution_points integer not null default 1,
  contributed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.challenge_contributions enable row level security;
create index challenge_contributions_challenge_idx on public.challenge_contributions (challenge_id);
create policy "challenge_contributions_select_fellow" on public.challenge_contributions for select using (public.is_challenge_member(challenge_id));
create policy "challenge_contributions_select_admin" on public.challenge_contributions for select using (public.is_admin());
revoke insert, update, delete on public.challenge_contributions from authenticated;
