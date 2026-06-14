-- WeDo migration 027 — file d'envoi SMS/WhatsApp (prête, INERTE par défaut).
-- Les notifications pertinentes sont mises en file ; l'edge fn wedo-send-sms les
-- expédie via le provider (WEDO_SMS_PROVIDER, défaut 'none' = aucun envoi externe).
-- Rien ne part tant qu'aucune clé n'est posée.

create table if not exists wedo.sms_outbox (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references wedo.profiles(id) on delete set null,
  phone        text not null,
  body         text not null,
  channel      text not null default 'sms' check (channel in ('sms','whatsapp')),
  status       text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  provider     text,
  provider_ref text,
  error        text,
  related_id   uuid,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);
create index if not exists idx_sms_outbox_pending on wedo.sms_outbox (status, created_at) where status='pending';

-- RLS activée SANS policy => seul le service role (edge fn) y accède. Aucun accès client.
alter table wedo.sms_outbox enable row level security;

-- Met en file les notifications "sortables" si l'utilisateur a un téléphone.
create or replace function wedo.enqueue_sms_from_notification()
returns trigger language plpgsql security definer set search_path=wedo as $$
declare v_phone text;
begin
  if NEW.type not in ('PaymentDue','PaymentLate','DistributionReceived','JoinApproved','TontineStarted') then
    return NEW;
  end if;
  select phone_number into v_phone from wedo.profiles where id = NEW.user_id;
  if v_phone is null or length(btrim(v_phone)) < 6 then
    return NEW;  -- pas de numéro -> in-app seulement
  end if;
  insert into wedo.sms_outbox(user_id, phone, body, channel, related_id)
    values (NEW.user_id, btrim(v_phone),
            left(coalesce(NEW.title,'WeDo') || ' — ' || coalesce(NEW.body,''), 480),
            'sms', NEW.related_id);
  return NEW;
end $$;

drop trigger if exists trg_enqueue_sms on wedo.notifications;
create trigger trg_enqueue_sms after insert on wedo.notifications
  for each row execute function wedo.enqueue_sms_from_notification();
