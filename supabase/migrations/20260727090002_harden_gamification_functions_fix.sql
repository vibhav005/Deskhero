-- Follow-up to 20260727090001: that migration revoked EXECUTE from PUBLIC,
-- but Supabase's public schema carries a default privilege that also grants
-- EXECUTE to `anon`/`authenticated` explicitly and separately on every new
-- function (confirmed via pg_default_acl) — so the PUBLIC-only revoke had no
-- effect; a direct RPC call still worked after that migration. Revoking from
-- the actual grantee roles this time.
revoke execute on function public.award_xp(uuid, text, uuid, integer, text, text) from anon, authenticated;
revoke execute on function public.evaluate_achievements(uuid) from anon, authenticated;
revoke execute on function public.process_daily_streaks() from anon, authenticated;
