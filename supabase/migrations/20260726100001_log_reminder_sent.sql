-- notification_logs has INSERT revoked from `authenticated` (system-only writes),
-- but reminders are checked client-side via a heartbeat, not a server cron, so
-- the reminder-sent log needs a narrow, security-definer door in for that one
-- case — scoped to kind='reminder', channel='in_app', and the caller's own id.
create or replace function public.log_reminder_sent(p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.notification_logs (user_id, kind, channel, payload)
  values (auth.uid(), 'reminder', 'in_app', jsonb_build_object('message', p_message));
end;
$$;

grant execute on function public.log_reminder_sent(text) to authenticated;
