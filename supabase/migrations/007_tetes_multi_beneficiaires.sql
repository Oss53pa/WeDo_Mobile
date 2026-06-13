-- WeDo migration 007 — "têtes" (shares) + multiple beneficiaries per round.
-- Applied to project easoqoswtmvtkdwwkqtc (schema wedo).
--
-- Model (validated by the user 2026-06-13):
--   * A member holds `nb_tetes` shares (default 1). 1 tête = 1 cotisation/round +
--     1 slot in the rotation. A member with n têtes pays n×cotisation each round and
--     receives n times over the cycle.
--   * `beneficiaires_par_tour` (K, default 1) têtes receive each round and SHARE the
--     round pot. Rounds R = (Σ têtes) / K  (we require Σ têtes to be a multiple of K).
--   * Split is equal PER TÊTE → automatically proportional per person (more têtes →
--     more money). Pot is shared at the FCFA près (floor + +1 reconciliation), so the
--     escrow stays zero-sum exactly, like the activation fee.
--
-- This reduces EXACTLY to the previous behaviour when every nb_tetes = 1 and K = 1.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Schema
-- ─────────────────────────────────────────────────────────────────────────────
alter table wedo.tontines
  add column if not exists beneficiaires_par_tour smallint not null default 1
    check (beneficiaires_par_tour >= 1);

alter table wedo.tontine_members
  add column if not exists nb_tetes smallint not null default 1
    check (nb_tetes >= 1);

-- Per-round rotation, built deterministically at activation. Auditable: one row per
-- (round, member) with how many of that member's têtes receive in that round.
create table if not exists wedo.tontine_rotation (
  id          uuid primary key default gen_random_uuid(),
  tontine_id  uuid not null references wedo.tontines(id) on delete cascade,
  round       int  not null,
  member_id   uuid not null references wedo.tontine_members(id) on delete cascade,
  user_id     uuid not null,
  tetes       int  not null check (tetes >= 1),
  ord         int  not null,          -- first tête index in the round (for fair remainder)
  created_at  timestamptz not null default now(),
  unique (tontine_id, round, member_id)
);
create index if not exists idx_rotation_tontine_round
  on wedo.tontine_rotation (tontine_id, round);

alter table wedo.tontine_rotation enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname='wedo' and tablename='tontine_rotation' and policyname='rotation_select') then
    create policy rotation_select on wedo.tontine_rotation for select to authenticated
      using (exists (select 1 from wedo.tontine_members m
        where m.tontine_id = tontine_rotation.tontine_id and m.user_id = auth.uid()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) activer_cycle v2 — têtes-aware fee + rounds + rotation build
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function wedo.activer_cycle(p_tontine_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'wedo'
as $$
declare
  t wedo.tontines%rowtype;
  v_is_organizer boolean;
  v_n bigint; v_k bigint; v_t bigint; v_tours bigint; v_cotisation bigint;
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

  select count(*), coalesce(sum(nb_tetes),0) into v_n, v_t
    from wedo.tontine_members
    where tontine_id = p_tontine_id and status = 'Active';
  if v_n < 1 then
    return jsonb_build_object('success', false, 'error', 'Aucun membre actif.');
  end if;

  v_k := greatest(1, coalesce(t.beneficiaires_par_tour, 1));
  if v_t % v_k <> 0 then
    return jsonb_build_object('success', false, 'error',
      'Le nombre total de têtes ('||v_t||') doit être un multiple du nombre de '||
      'bénéficiaires par tour ('||v_k||'). Ajustez les têtes ou les bénéficiaires/tour.');
  end if;
  v_tours := v_t / v_k;

  -- Fee: total money in system = cotisation × (Σ têtes) × rounds ; split per tête.
  v_cotisation  := t.contribution_amount;
  v_mts         := v_cotisation * v_t * v_tours;
  v_frais_total := (v_mts * t.taux_service_bps) / 10000;   -- integer division
  v_base        := v_frais_total / v_t;                    -- per tête
  v_reste       := v_frais_total - v_base * v_t;           -- 0 .. v_t-1

  -- Assign fee per member = base × nb_tetes, then +1 FCFA to the first `reste` têtes.
  with ordered as (
    select id, nb_tetes,
           sum(nb_tetes) over (order by reception_order nulls last, joined_at, id
                rows between unbounded preceding and current row) as cum
    from wedo.tontine_members
    where tontine_id = p_tontine_id and status = 'Active'
  )
  update wedo.tontine_members m
    set frais_du = v_base * o.nb_tetes
                 + greatest(0, least(o.cum, v_reste) - (o.cum - o.nb_tetes)),
        frais_paye = false, frais_paye_at = null
    from ordered o where m.id = o.id;

  -- Build the rotation: expand members into têtes (ordered), pack K per round.
  delete from wedo.tontine_rotation where tontine_id = p_tontine_id;
  insert into wedo.tontine_rotation (tontine_id, round, member_id, user_id, tetes, ord)
  with ordered as (
    select id as member_id, user_id, nb_tetes,
           sum(nb_tetes) over (order by reception_order nulls last, joined_at, id
                rows between unbounded preceding and current row) as cum
    from wedo.tontine_members
    where tontine_id = p_tontine_id and status = 'Active'
  ),
  tetes as (
    select o.member_id, o.user_id, (o.cum - o.nb_tetes + gs) as tno
    from ordered o, generate_series(1, o.nb_tetes::int) gs
  )
  select p_tontine_id, ((tno - 1) / v_k)::int + 1 as round,
         member_id, user_id, count(*)::int as tetes, min(tno)::int as ord
  from tetes
  group by ((tno - 1) / v_k)::int + 1, member_id, user_id;

  update wedo.tontines
    set frais_total = v_frais_total, total_rounds = v_tours,
        status = 'Active', current_round = 1
    where id = p_tontine_id;

  -- Flag the first round's beneficiaries.
  update wedo.tontine_members set is_current_beneficiary = false where tontine_id = p_tontine_id;
  update wedo.tontine_members m set is_current_beneficiary = true
    from wedo.tontine_rotation r
    where r.tontine_id = p_tontine_id and r.round = 1 and r.member_id = m.id;

  return jsonb_build_object('success', true, 'n', v_n, 'tetes', v_t, 'k', v_k,
    'cotisation', v_cotisation, 'tours', v_tours, 'mts', v_mts,
    'fraisTotal', v_frais_total, 'fraisParTeteBase', v_base, 'reste', v_reste);
end $$;

revoke all on function wedo.activer_cycle(uuid) from public, anon;
grant execute on function wedo.activer_cycle(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) distribuer_tour v2 — split the round pot among the round's K beneficiary têtes
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function wedo.distribuer_tour(p_tontine_id uuid, p_round int)
returns uuid language plpgsql security definer set search_path = wedo, extensions as $$
declare
  t wedo.tontines%rowtype; v_active int; v_paid int; v_pot bigint;
  v_k int; v_base bigint; v_rem bigint; v_seen int := 0; v_extra bigint; v_amt bigint;
  seq_id uuid; v_personne uuid; v_compte uuid; v_dist uuid; v_last uuid;
  rec record;
begin
  perform pg_advisory_xact_lock(hashtext('wedo_dist'), hashtext(p_tontine_id::text));
  select * into t from wedo.tontines where id = p_tontine_id;
  if t.status <> 'Active' then return null; end if;
  if exists (select 1 from wedo.distributions where tontine_id = p_tontine_id and round = p_round and status = 'Completed') then
    return null;
  end if;

  select count(*) into v_active from wedo.tontine_members where tontine_id = p_tontine_id and status = 'Active';
  select count(*) into v_paid  from wedo.contributions  where tontine_id = p_tontine_id and round = p_round and status = 'Paid';
  if v_active = 0 or v_paid < v_active then return null; end if;
  select coalesce(sum(amount),0) into v_pot from wedo.contributions where tontine_id = p_tontine_id and round = p_round and status = 'Paid';

  -- Beneficiary têtes for this round (built at activation).
  select coalesce(sum(tetes),0) into v_k from wedo.tontine_rotation
    where tontine_id = p_tontine_id and round = p_round;
  -- Fallback for legacy tontines without a rotation row: single beneficiary by order.
  if v_k = 0 then
    insert into wedo.tontine_rotation (tontine_id, round, member_id, user_id, tetes, ord)
    select p_tontine_id, p_round, m.id, m.user_id, 1, p_round
      from wedo.tontine_members m
      where m.tontine_id = p_tontine_id and m.status='Active'
        and coalesce(m.reception_order, 999999) = p_round
      limit 1;
    select coalesce(sum(tetes),0) into v_k from wedo.tontine_rotation
      where tontine_id = p_tontine_id and round = p_round;
    if v_k = 0 then return null; end if;
  end if;

  v_base := v_pot / v_k;
  v_rem  := v_pot - v_base * v_k;            -- 0 .. v_k-1, reconciled below
  seq_id := wedo.ensure_sequestre(p_tontine_id);

  for rec in
    select r.member_id, r.user_id, r.tetes
      from wedo.tontine_rotation r
      where r.tontine_id = p_tontine_id and r.round = p_round
      order by r.ord
  loop
    -- How many of this member's têtes fall within the first `v_rem` têtes of the round.
    v_extra := greatest(0, least(v_seen + rec.tetes, v_rem) - v_seen);
    v_amt   := v_base * rec.tetes + v_extra;
    v_seen  := v_seen + rec.tetes;

    select personne_id, id into v_personne, v_compte from wedo.comptes where profile_id = rec.user_id limit 1;

    insert into wedo.distributions (tontine_id, recipient_id, amount, round, scheduled_date, distributed_date, status)
      values (p_tontine_id, rec.user_id, v_amt, p_round, now()::date, now(), 'Completed') returning id into v_dist;
    v_last := v_dist;

    update wedo.sequestres set solde_cantonne = solde_cantonne - v_amt where id = seq_id;
    update wedo.tontines    set current_balance = current_balance - v_amt where id = p_tontine_id;
    update wedo.tontine_members
       set total_received = total_received + v_amt, has_received = true, is_current_beneficiary = false
       where id = rec.member_id;

    insert into wedo.mouvements (tontine_id, sequestre_id, type, sens, montant, personne_id, compte_id, round, reference_externe, meta)
      values (p_tontine_id, seq_id, 'distribution', 'debit', v_amt, v_personne, v_compte, p_round,
              'SBX-DIST-'||left(v_dist::text,8),
              jsonb_build_object('distribution_id', v_dist, 'beneficiaire', rec.user_id, 'tetes', rec.tetes));

    insert into wedo.notifications (user_id, title, body, type, related_id)
      values (rec.user_id, 'Distribution reçue',
              'Vous avez reçu '||v_amt||' '||coalesce(t.currency,'XOF')||' au tour '||p_round||'.',
              'DistributionReceived', p_tontine_id);
  end loop;

  if p_round >= t.total_rounds then
    update wedo.tontines set status = 'Completed', current_round = p_round where id = p_tontine_id;
  else
    update wedo.tontines set current_round = p_round + 1 where id = p_tontine_id;
    update wedo.tontine_members m set is_current_beneficiary = true
      from wedo.tontine_rotation r
      where r.tontine_id = p_tontine_id and r.round = p_round + 1 and r.member_id = m.id
        and m.status = 'Active';
  end if;

  return v_last;
end;
$$;
