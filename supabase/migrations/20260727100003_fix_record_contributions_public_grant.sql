-- record_challenge_contributions still had an implicit PUBLIC EXECUTE grant
-- from CREATE FUNCTION itself (Postgres's standard default for new
-- functions), separate from the anon/authenticated grants revoked in the
-- previous migration — confirmed live: it was still callable directly via
-- RPC. Closing that gap too.
revoke execute on function public.record_challenge_contributions(uuid, text, uuid, integer) from public;
