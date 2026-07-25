-- Bug fix: the M0 profiles migration's column-level UPDATE grant omitted
-- onboarding_completed_at, so completeOnboarding()'s UPDATE (which sets it
-- alongside consent_tos_at/consent_privacy_at in one statement) was rejected
-- outright — Postgres requires every column in an UPDATE's SET clause to be
-- grantable. Harmless for a user to set on their own row (no XP/cheat vector),
-- so it belongs in this grant rather than behind a SECURITY DEFINER function.
grant update (onboarding_completed_at) on public.profiles to authenticated;
