-- WeDo migration 006 — activation fee (paid once at cycle launch, equal for all members).
-- Applied to project easoqoswtmvtkdwwkqtc on 2026-06-12
-- (mcp: `wedo_add_fee_transaction_type` then `wedo_activation_fee`).
--
--   MTS        = cotisation × N × tours
--   frais_total = taux_service_bps × MTS / 10000     (integer division, bigint)
--   per member  = frais_total / N, +1 FCFA to the first `reste` members (reception_order)
-- Invariant Σ frais_du === frais_total (covered by jest test src/utils/__tests__/activationFee.test.ts).
-- Fees are service revenue: NOT added to the séquestre / distributed pot.

-- 1) New transaction type for the fee (own statement — enum ADD VALUE can't be used same-tx).
ALTER TYPE wedo.transaction_type ADD VALUE IF NOT EXISTS 'Fee';

-- 2) Columns: rate + frozen total on the tontine; due + paid flags on the membership.
alter table wedo.tontines
  add column if not exists taux_service_bps smallint not null default 80,
  add column if not exists frais_total bigint not null default 0;

alter table wedo.tontine_members
  add column if not exists frais_du bigint not null default 0,
  add column if not exists frais_paye boolean not null default false,
  add column if not exists frais_paye_at timestamptz;

-- 3) Activate the cycle: compute + assign the fee, flip status to Active.
create or replace function wedo.activer_cycle(p_tontine_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'wedo'
as $$
declare
  t wedo.tontines%rowtype;
  v_is_organizer boolean;
  v_n bigint; v_cotisation bigint; v_tours bigint;
  v_mts bigint; v_frais_total bigint; v_base bigint; v_reste bigint;
begin
  select * into t from wedo.tontines where id = p_tontine_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Tontine introuvable.');
  end if;

  v_is_organizer := (t.creator_id = auth.uid()) or exists (
    select 1 from wedo.tontine_members m
    where m.tontine_id = p_tontine_id and m.user_id = auth.uid()
      and m.status = 'Active' and m.role in ('Admin', 'Treasurer'));
  if not v_is_organizer then
    return jsonb_build_object('success', false, 'error',
      'Seul l''organisateur peut lancer le cycle.');
  end if;

  if t.status <> 'Open' then
    return jsonb_build_object('success', true, 'already', true, 'fraisTotal', t.frais_total);
  end if;

  select count(*) into v_n from wedo.tontine_members
    where tontine_id = p_tontine_id and status = 'Active';
  if v_n < 1 then
    return jsonb_build_object('success', false, 'error', 'Aucun membre actif.');
  end if;

  v_cotisation := t.contribution_amount;
  v_tours := case when t.total_rounds > 0 then t.total_rounds else t.total_members end;

  v_mts         := v_cotisation * v_n * v_tours;
  v_frais_total := (v_mts * t.taux_service_bps) / 10000;   -- integer division
  v_base        := v_frais_total / v_n;
  v_reste       := v_frais_total - v_base * v_n;            -- 0 .. N-1

  with ranked as (
    select id, row_number() over (order by reception_order nulls last, joined_at, id) as rn
    from wedo.tontine_members
    where tontine_id = p_tontine_id and status = 'Active'
  )
  update wedo.tontine_members m
    set frais_du = v_base + (case when r.rn <= v_reste then 1 else 0 end),
        frais_paye = false, frais_paye_at = null
    from ranked r where m.id = r.id;

  update wedo.tontines
    set frais_total = v_frais_total, total_rounds = v_tours,
        status = 'Active', current_round = 1
    where id = p_tontine_id;

  return jsonb_build_object('success', true, 'n', v_n, 'cotisation', v_cotisation,
    'tours', v_tours, 'mts', v_mts, 'fraisTotal', v_frais_total,
    'fraisParMembreBase', v_base, 'reste', v_reste);
end $$;

revoke all on function wedo.activer_cycle(uuid) from public, anon;
grant execute on function wedo.activer_cycle(uuid) to authenticated;
