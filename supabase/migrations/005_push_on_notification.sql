-- WeDo migration 005 — auto-send a push when a notification row is inserted.
-- Applied to project easoqoswtmvtkdwwkqtc on 2026-06-12 (mcp `wedo_push_on_notification`).
--
-- Uses pg_net to call the send-push edge function. SAFE/INERT until both GUCs are
-- configured (current_setting returns NULL → trigger returns early), so it has zero
-- effect today. ACTIVATION (once Firebase/FCM + the expo-notifications client land and
-- device tokens are being stored):
--   1) Edge Function secret: WEDO_PUSH_SECRET = <random secret>
--   2) ALTER DATABASE postgres SET app.wedo_push_url    = 'https://easoqoswtmvtkdwwkqtc.supabase.co/functions/v1/send-push';
--      ALTER DATABASE postgres SET app.wedo_push_secret = '<same WEDO_PUSH_SECRET value>';

create or replace function wedo.tg_notify_push()
returns trigger
language plpgsql
security definer
set search_path to 'wedo'
as $$
declare
  v_url text := current_setting('app.wedo_push_url', true);
  v_secret text := current_setting('app.wedo_push_secret', true);
begin
  if v_url is null or v_secret is null then
    return new;  -- not configured → no-op
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-wedo-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'userId', new.user_id,
      'title', new.title,
      'body', new.body,
      'data', jsonb_build_object('type', new.type, 'relatedId', new.related_id)
    )
  );
  return new;
exception when others then
  return new;  -- never let push failure block the notification insert
end $$;

drop trigger if exists trg_notify_push on wedo.notifications;
create trigger trg_notify_push
  after insert on wedo.notifications
  for each row execute function wedo.tg_notify_push();
