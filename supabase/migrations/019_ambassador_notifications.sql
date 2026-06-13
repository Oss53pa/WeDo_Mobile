-- WeDo migration 019 — WEDO-AMB-08: notifications du programme ambassadrices.
-- Filleule inscrite / tontine qualifiée / paiement envoyé → wedo.notifications
-- (type 'System'). Triggers SECURITY DEFINER.

create or replace function wedo.trg_amb_notify_referral()
returns trigger language plpgsql security definer set search_path = wedo as $$
declare v_user uuid;
begin
  select user_id into v_user from wedo.ambassador_profiles where id = new.ambassador_id;
  if v_user is not null then
    insert into wedo.notifications(user_id, title, body, type, related_id)
      values (v_user, 'Nouvelle filleule 🎉', 'Une filleule vient de rejoindre WeDo avec votre code.', 'System', new.id);
  end if;
  return new;
end $$;
drop trigger if exists amb_notify_referral on wedo.referrals;
create trigger amb_notify_referral after insert on wedo.referrals
  for each row execute function wedo.trg_amb_notify_referral();

create or replace function wedo.trg_amb_notify_reward()
returns trigger language plpgsql security definer set search_path = wedo as $$
declare v_user uuid;
begin
  select user_id into v_user from wedo.ambassador_profiles where id = new.ambassador_id;
  if v_user is not null then
    insert into wedo.notifications(user_id, title, body, type, related_id)
      values (v_user, 'Tontine qualifiée ✅',
        'Une tontine que vous avez parrainée est qualifiée. Récompense : '||new.reward_fcfa||' FCFA'||
        case when new.status='review' then ' (en vérification).' else '.' end,
        'System', new.tontine_id);
  end if;
  return new;
end $$;
drop trigger if exists amb_notify_reward on wedo.reward_events;
create trigger amb_notify_reward after insert on wedo.reward_events
  for each row execute function wedo.trg_amb_notify_reward();

create or replace function wedo.trg_amb_notify_payout()
returns trigger language plpgsql security definer set search_path = wedo as $$
declare v_user uuid;
begin
  if new.status = 'sent' and coalesce(old.status,'') <> 'sent' then
    select user_id into v_user from wedo.ambassador_profiles where id = new.ambassador_id;
    if v_user is not null then
      insert into wedo.notifications(user_id, title, body, type, related_id)
        values (v_user, 'Paiement envoyé 💸',
          'Votre récompense de '||new.total_fcfa||' FCFA a été envoyée par mobile money.', 'System', new.id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists amb_notify_payout on wedo.payouts;
create trigger amb_notify_payout after update on wedo.payouts
  for each row execute function wedo.trg_amb_notify_payout();
