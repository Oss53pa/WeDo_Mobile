-- WeDo migration 020 — WEDO-AMB-11: analytics & KPIs.
-- Events émis aux bons moments via triggers : referral_attached, tontine_qualified,
-- reward_accrued (ou fraud_flagged si review), payout_sent. Vue KPI (admin/service).

create table if not exists wedo.ambassador_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  ambassador_id uuid,
  ref_id uuid,
  amount_fcfa bigint not null default 0,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_amb_events_event on wedo.ambassador_events (event, created_at);
alter table wedo.ambassador_events enable row level security;  -- service-role only (aucune policy)

create or replace function wedo.trg_amb_evt_referral()
returns trigger language plpgsql security definer set search_path = wedo as $$
begin
  insert into wedo.ambassador_events(event, ambassador_id, ref_id)
    values ('referral_attached', new.ambassador_id, new.id);
  return new;
end $$;
drop trigger if exists amb_evt_referral on wedo.referrals;
create trigger amb_evt_referral after insert on wedo.referrals
  for each row execute function wedo.trg_amb_evt_referral();

create or replace function wedo.trg_amb_evt_reward()
returns trigger language plpgsql security definer set search_path = wedo as $$
begin
  insert into wedo.ambassador_events(event, ambassador_id, ref_id, amount_fcfa)
    values ('tontine_qualified', new.ambassador_id, new.tontine_id, new.reward_fcfa);
  if new.status = 'review' then
    insert into wedo.ambassador_events(event, ambassador_id, ref_id, amount_fcfa)
      values ('fraud_flagged', new.ambassador_id, new.tontine_id, new.reward_fcfa);
  else
    insert into wedo.ambassador_events(event, ambassador_id, ref_id, amount_fcfa)
      values ('reward_accrued', new.ambassador_id, new.tontine_id, new.reward_fcfa);
  end if;
  return new;
end $$;
drop trigger if exists amb_evt_reward on wedo.reward_events;
create trigger amb_evt_reward after insert on wedo.reward_events
  for each row execute function wedo.trg_amb_evt_reward();

create or replace function wedo.trg_amb_evt_payout()
returns trigger language plpgsql security definer set search_path = wedo as $$
begin
  if new.status='sent' and coalesce(old.status,'')<>'sent' then
    insert into wedo.ambassador_events(event, ambassador_id, ref_id, amount_fcfa)
      values ('payout_sent', new.ambassador_id, new.id, new.total_fcfa);
  end if;
  return new;
end $$;
drop trigger if exists amb_evt_payout on wedo.payouts;
create trigger amb_evt_payout after update on wedo.payouts
  for each row execute function wedo.trg_amb_evt_payout();

create or replace view wedo.ambassador_kpis as
select
  count(*) filter (where event='referral_attached')           as referrals,
  count(*) filter (where event='tontine_qualified')           as tontines_qualified,
  count(*) filter (where event='reward_accrued')              as rewards_accrued,
  count(*) filter (where event='fraud_flagged')               as fraud_flagged,
  count(*) filter (where event='payout_sent')                 as payouts_sent,
  coalesce(sum(amount_fcfa) filter (where event='payout_sent'),0) as total_paid_fcfa,
  case when count(*) filter (where event='referral_attached') > 0
    then round(100.0 * count(*) filter (where event='tontine_qualified')
              / count(*) filter (where event='referral_attached'), 1)
    else 0 end as conversion_pct,
  case when count(*) filter (where event='tontine_qualified') > 0
    then (coalesce(sum(amount_fcfa) filter (where event='payout_sent'),0)
          / count(*) filter (where event='tontine_qualified'))
    else 0 end as cac_cooptation_fcfa
from wedo.ambassador_events;
