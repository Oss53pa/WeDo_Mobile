-- ============================================================
-- WeDo MVP Trust Layer — "0 perte de fonds + 0 litige"
-- Additive, isolated in the `wedo` schema. Applied live as three
-- migrations: wedo_mvp_trust_layer_{a_schema,b_rls,c_rpcs}.
--
-- Brings the trust primitives the MVP scope requires:
--   - personnes / scores / comptes : portable identity keyed on the PERSON
--     (hash CNI), not the account. Reliability score follows the personne.
--   - sequestres : EME "cantonnement" escrow (funds never held by us).
--   - mouvements : SHA-256 hash-chained, append-only ledger (registre
--     infalsifiable) — makes every dispute tranchable.
--   - confirmer_cotisation / distribuer_tour : cotisation -> séquestre ->
--     distribution automatique (0 human intervention on the funds).
--   - verifier_registre : independent chain + escrow-conservation proof.
--   - RLS : registre readable by members; séquestre gated to palier >= 2 (P2).
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- SHA-256 helper ----------
create or replace function wedo.sha256_hex(p text)
returns text language sql immutable as $$
  select encode(extensions.digest(p, 'sha256'), 'hex')
$$;

-- ============================================================
-- IDENTITY LAYER (keyed on the PERSON, not the account)
-- ============================================================

-- palier: 0 = phone/OTP (P0), 1 = wallet+selfie (P1), 2 = CNI+face-match+liveness (P2)
create table if not exists wedo.personnes (
  id            uuid primary key default gen_random_uuid(),
  cni_hash      text unique,                        -- hash(CNI/NNI) — biometric dedup key (set at P2)
  display_name  text,
  palier        smallint not null default 0 check (palier between 0 and 2),
  parraine_par  uuid references wedo.personnes(id), -- sponsor (ancrage social)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_personnes_parrain on wedo.personnes(parraine_par);

-- Reliability score v1 — indexed on the personne, portable across tontines
create table if not exists wedo.scores (
  personne_id        uuid primary key references wedo.personnes(id) on delete cascade,
  valeur             smallint not null default 50 check (valeur between 0 and 100),
  total_cotisations  integer not null default 0,
  cotisations_heure  integer not null default 0,
  retards            integer not null default 0,
  defauts            integer not null default 0,
  updated_at         timestamptz not null default now()
);

create table if not exists wedo.score_events (
  id           uuid primary key default gen_random_uuid(),
  personne_id  uuid not null references wedo.personnes(id) on delete cascade,
  delta        smallint not null,
  raison       text not null,
  tontine_id   uuid references wedo.tontines(id),
  created_at   timestamptz not null default now()
);
create index if not exists idx_score_events_personne on wedo.score_events(personne_id);

-- Accounts (app login / wallet) attached to a personne. Score follows the personne.
create table if not exists wedo.comptes (
  id            uuid primary key default gen_random_uuid(),
  personne_id   uuid not null references wedo.personnes(id) on delete cascade,
  profile_id    uuid unique references wedo.profiles(id) on delete cascade,
  type          text not null default 'app' check (type in ('app','wallet')),
  operator      text,
  msisdn_hash   text,
  kyc_inherited boolean not null default false,     -- KYC inherited from the EME wallet (P1)
  created_at    timestamptz not null default now()
);
create index if not exists idx_comptes_personne on wedo.comptes(personne_id);

alter table wedo.profiles add column if not exists personne_id uuid references wedo.personnes(id);

-- ============================================================
-- TONTINE additions: escrow flag + reliability gate
-- ============================================================
alter table wedo.tontines add column if not exists sequestre_active boolean not null default true;
alter table wedo.tontines add column if not exists score_minimum smallint not null default 0 check (score_minimum between 0 and 100);
alter table wedo.tontines add column if not exists eme_account_ref text;

-- ============================================================
-- SEQUESTRE (EME cantonnement) — one escrow per tontine
-- ============================================================
create table if not exists wedo.sequestres (
  id              uuid primary key default gen_random_uuid(),
  tontine_id      uuid not null unique references wedo.tontines(id) on delete cascade,
  eme_account_ref text not null,
  provider        text not null default 'sandbox',
  solde_cantonne  bigint not null default 0 check (solde_cantonne >= 0),  -- never negative => no overdraw
  devise          text not null default 'XOF',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- MOUVEMENTS — the infalsifiable, SHA-256 hash-chained ledger.
-- Append-only. Each row chains to the previous one of the same tontine.
-- ============================================================
create table if not exists wedo.mouvements (
  id                 uuid primary key default gen_random_uuid(),
  tontine_id         uuid not null references wedo.tontines(id) on delete cascade,
  sequestre_id       uuid references wedo.sequestres(id),
  seq                bigint not null,                          -- 1-based per-tontine sequence
  type               text not null check (type in
                       ('cotisation','distribution','penalite','remboursement',
                        'depot_sequestre','retrait_sequestre')),
  sens               text not null check (sens in ('credit','debit')),  -- relative to the séquestre
  montant            bigint not null check (montant >= 0),
  personne_id        uuid references wedo.personnes(id),
  compte_id          uuid references wedo.comptes(id),
  round              integer,
  reference_externe  text,                                     -- EME transaction id
  meta               jsonb not null default '{}'::jsonb,
  prev_hash          text not null,
  hash               text not null,
  created_at         timestamptz not null default now(),
  unique (tontine_id, seq)
);
create index if not exists idx_mouvements_tontine on wedo.mouvements(tontine_id, seq);
create index if not exists idx_mouvements_personne on wedo.mouvements(personne_id);

-- Canonical payload (single source of truth for hash + verifier)
create or replace function wedo.mouvement_payload(
  p_seq bigint, p_tontine uuid, p_type text, p_sens text, p_montant bigint,
  p_personne uuid, p_round integer, p_ref text, p_created timestamptz, p_prev text)
returns text language sql immutable as $$
  select p_seq::text || '|' || p_tontine::text || '|' || p_type || '|' || p_sens || '|'
      || p_montant::text || '|' || coalesce(p_personne::text,'') || '|'
      || coalesce(p_round::text,'') || '|' || coalesce(p_ref,'') || '|'
      || to_char(p_created at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || p_prev
$$;

-- BEFORE INSERT: assign seq, link prev_hash, compute hash (serialized per tontine)
create or replace function wedo.fn_mouvement_chain()
returns trigger language plpgsql security definer set search_path = wedo, extensions as $$
declare v_last wedo.mouvements%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('wedo_mvt'), hashtext(new.tontine_id::text));
  select * into v_last from wedo.mouvements where tontine_id = new.tontine_id order by seq desc limit 1;
  new.seq := coalesce(v_last.seq, 0) + 1;
  new.created_at := coalesce(new.created_at, now());
  new.prev_hash := coalesce(v_last.hash, wedo.sha256_hex('GENESIS:' || new.tontine_id::text));
  new.hash := wedo.sha256_hex(wedo.mouvement_payload(
    new.seq, new.tontine_id, new.type, new.sens, new.montant,
    new.personne_id, new.round, new.reference_externe, new.created_at, new.prev_hash));
  return new;
end;
$$;
drop trigger if exists trg_mouvement_chain on wedo.mouvements;
create trigger trg_mouvement_chain before insert on wedo.mouvements
  for each row execute function wedo.fn_mouvement_chain();

-- Append-only: block UPDATE and DELETE entirely
create or replace function wedo.fn_mouvement_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'wedo.mouvements is append-only: % is forbidden (registre infalsifiable)', tg_op;
end;
$$;
drop trigger if exists trg_mouvement_immutable on wedo.mouvements;
create trigger trg_mouvement_immutable before update or delete on wedo.mouvements
  for each row execute function wedo.fn_mouvement_immutable();

-- ============================================================
-- AUTO-PROVISION identity when a profile is created
-- ============================================================
create or replace function wedo.fn_provision_personne()
returns trigger language plpgsql security definer set search_path = wedo as $$
declare v_personne uuid;
begin
  insert into wedo.personnes (display_name, palier)
    values (new.full_name, coalesce(new.kyc_level, 0)) returning id into v_personne;
  insert into wedo.scores (personne_id) values (v_personne);
  insert into wedo.comptes (personne_id, profile_id, type) values (v_personne, new.id, 'app');
  update wedo.profiles set personne_id = v_personne where id = new.id;
  return new;
end;
$$;
drop trigger if exists trg_provision_personne on wedo.profiles;
create trigger trg_provision_personne after insert on wedo.profiles
  for each row execute function wedo.fn_provision_personne();

drop trigger if exists personnes_updated_at on wedo.personnes;
create trigger personnes_updated_at before update on wedo.personnes
  for each row execute function wedo.update_updated_at_column();
drop trigger if exists sequestres_updated_at on wedo.sequestres;
create trigger sequestres_updated_at before update on wedo.sequestres
  for each row execute function wedo.update_updated_at_column();

-- Backfill existing profiles into the identity layer
do $$
declare r record; v_personne uuid;
begin
  for r in select * from wedo.profiles where personne_id is null loop
    insert into wedo.personnes (display_name, palier)
      values (r.full_name, coalesce(r.kyc_level,0)) returning id into v_personne;
    insert into wedo.scores (personne_id, valeur) values (v_personne, 50) on conflict do nothing;
    insert into wedo.comptes (personne_id, profile_id, type) values (v_personne, r.id, 'app')
      on conflict (profile_id) do nothing;
    update wedo.profiles set personne_id = v_personne where id = r.id;
  end loop;
end $$;

-- ============================================================
-- RLS
-- ============================================================
create or replace function wedo.current_personne_id()
returns uuid language sql stable security definer set search_path = wedo as $$
  select personne_id from wedo.comptes where profile_id = auth.uid() limit 1
$$;

create or replace function wedo.current_palier()
returns smallint language sql stable security definer set search_path = wedo as $$
  select coalesce(p.palier, 0) from wedo.personnes p where p.id = wedo.current_personne_id()
$$;

create or replace function wedo.personne_shares_tontine(p_personne uuid)
returns boolean language sql stable security definer set search_path = wedo as $$
  select exists (
    select 1 from wedo.tontine_members me
    join wedo.comptes c on c.profile_id = me.user_id and c.personne_id = p_personne
    join wedo.tontine_members mine on mine.tontine_id = me.tontine_id
    where mine.user_id = auth.uid()
  )
$$;

alter table wedo.personnes    enable row level security;
alter table wedo.scores       enable row level security;
alter table wedo.score_events enable row level security;
alter table wedo.comptes      enable row level security;
alter table wedo.sequestres   enable row level security;
alter table wedo.mouvements   enable row level security;

drop policy if exists personnes_select on wedo.personnes;
create policy personnes_select on wedo.personnes for select
  using (id = wedo.current_personne_id() or wedo.personne_shares_tontine(id));

drop policy if exists scores_select on wedo.scores;
create policy scores_select on wedo.scores for select
  using (personne_id = wedo.current_personne_id() or wedo.personne_shares_tontine(personne_id));

drop policy if exists score_events_select on wedo.score_events;
create policy score_events_select on wedo.score_events for select
  using (personne_id = wedo.current_personne_id());

drop policy if exists comptes_select on wedo.comptes;
create policy comptes_select on wedo.comptes for select using (profile_id = auth.uid());

-- Séquestre: members only, AND requester must be P2.
drop policy if exists sequestres_select on wedo.sequestres;
create policy sequestres_select on wedo.sequestres for select
  using (wedo.is_tontine_member(tontine_id, auth.uid()) and wedo.current_palier() >= 2);

-- Mouvements: the transparent registre — readable by every member of the tontine.
-- No write policy: only SECURITY DEFINER RPCs append; the immutability trigger
-- blocks any UPDATE/DELETE even by the service role.
drop policy if exists mouvements_select on wedo.mouvements;
create policy mouvements_select on wedo.mouvements for select
  using (wedo.is_tontine_member(tontine_id, auth.uid()));

-- ============================================================
-- BUSINESS RPCs
-- ============================================================

create or replace function wedo.appliquer_score(p_personne uuid, p_delta int, p_raison text, p_tontine uuid default null)
returns void language plpgsql security definer set search_path = wedo as $$
begin
  if p_personne is null then return; end if;
  update wedo.scores set valeur = greatest(0, least(100, valeur + p_delta)), updated_at = now()
   where personne_id = p_personne;
  insert into wedo.score_events (personne_id, delta, raison, tontine_id)
    values (p_personne, p_delta, p_raison, p_tontine);
end;
$$;

create or replace function wedo.ensure_sequestre(p_tontine uuid)
returns uuid language plpgsql security definer set search_path = wedo as $$
declare seq_id uuid; t wedo.tontines%rowtype;
begin
  select id into seq_id from wedo.sequestres where tontine_id = p_tontine;
  if seq_id is null then
    select * into t from wedo.tontines where id = p_tontine;
    insert into wedo.sequestres (tontine_id, eme_account_ref, provider, devise)
      values (p_tontine, coalesce(t.eme_account_ref, 'SBX-CANTON-'||left(p_tontine::text,8)),
              'sandbox', coalesce(t.currency,'XOF')) returning id into seq_id;
  end if;
  return seq_id;
end;
$$;

-- AUTOMATIC distribution of a completed round (0 human intervention).
create or replace function wedo.distribuer_tour(p_tontine_id uuid, p_round int)
returns uuid language plpgsql security definer set search_path = wedo, extensions as $$
declare
  t wedo.tontines%rowtype; v_active int; v_paid int; v_pot bigint;
  benef wedo.tontine_members%rowtype; seq_id uuid; v_personne uuid; v_compte uuid; v_dist uuid;
begin
  perform pg_advisory_xact_lock(hashtext('wedo_dist'), hashtext(p_tontine_id::text));
  select * into t from wedo.tontines where id = p_tontine_id;
  if t.status <> 'Active' then return null; end if;
  if exists (select 1 from wedo.distributions where tontine_id = p_tontine_id and round = p_round and status = 'Completed') then
    return null;
  end if;
  select count(*) into v_active from wedo.tontine_members where tontine_id = p_tontine_id and status = 'Active';
  select count(*) into v_paid from wedo.contributions where tontine_id = p_tontine_id and round = p_round and status = 'Paid';
  if v_active = 0 or v_paid < v_active then return null; end if;
  select coalesce(sum(amount),0) into v_pot from wedo.contributions where tontine_id = p_tontine_id and round = p_round and status = 'Paid';

  select * into benef from wedo.tontine_members where tontine_id = p_tontine_id and status='Active' and reception_order = p_round limit 1;
  if not found then
    select * into benef from wedo.tontine_members where tontine_id = p_tontine_id and status='Active' and has_received = false
      order by reception_order nulls last, joined_at limit 1;
  end if;
  if not found then return null; end if;

  select personne_id, id into v_personne, v_compte from wedo.comptes where profile_id = benef.user_id limit 1;
  seq_id := wedo.ensure_sequestre(p_tontine_id);

  insert into wedo.distributions (tontine_id, recipient_id, amount, round, scheduled_date, distributed_date, status)
    values (p_tontine_id, benef.user_id, v_pot, p_round, now()::date, now(), 'Completed') returning id into v_dist;
  update wedo.sequestres set solde_cantonne = solde_cantonne - v_pot where id = seq_id;
  update wedo.tontines  set current_balance = current_balance - v_pot where id = p_tontine_id;
  update wedo.tontine_members
     set total_received = total_received + v_pot, has_received = true, is_current_beneficiary = false where id = benef.id;

  insert into wedo.mouvements (tontine_id, sequestre_id, type, sens, montant, personne_id, compte_id, round, reference_externe, meta)
    values (p_tontine_id, seq_id, 'distribution', 'debit', v_pot, v_personne, v_compte, p_round,
            'SBX-DIST-'||left(v_dist::text,8), jsonb_build_object('distribution_id', v_dist, 'beneficiaire', benef.user_id));

  if p_round >= t.total_rounds then
    update wedo.tontines set status = 'Completed', current_round = p_round where id = p_tontine_id;
  else
    update wedo.tontines set current_round = p_round + 1 where id = p_tontine_id;
    update wedo.tontine_members set is_current_beneficiary = true
      where tontine_id = p_tontine_id and status='Active' and reception_order = p_round + 1;
  end if;

  insert into wedo.notifications (user_id, title, body, type, related_id)
    values (benef.user_id, 'Distribution reçue',
            'Vous avez reçu la cagnotte du tour '||p_round||' : '||v_pot||' '||coalesce(t.currency,'XOF')||'.',
            'DistributionReceived', p_tontine_id);
  return v_dist;
end;
$$;

-- Confirm a contribution settled at the EME => deposit into escrow, append to the
-- ledger, update score, then attempt automatic distribution of the round.
create or replace function wedo.confirmer_cotisation(p_contribution_id uuid)
returns jsonb language plpgsql security definer set search_path = wedo, extensions as $$
declare
  c wedo.contributions%rowtype; seq_id uuid; v_personne uuid; v_compte uuid; v_ontime boolean; v_dist uuid;
begin
  select * into c from wedo.contributions where id = p_contribution_id for update;
  if not found then return jsonb_build_object('success',false,'error','Cotisation introuvable'); end if;
  if c.status = 'Paid' then return jsonb_build_object('success',true,'already',true); end if;

  select personne_id, id into v_personne, v_compte from wedo.comptes where profile_id = c.user_id limit 1;
  seq_id := wedo.ensure_sequestre(c.tontine_id);
  v_ontime := (now()::date <= c.due_date);

  update wedo.contributions set status = 'Paid', paid_date = now() where id = c.id;
  update wedo.sequestres     set solde_cantonne = solde_cantonne + c.amount where id = seq_id;
  update wedo.tontines       set current_balance = current_balance + c.amount where id = c.tontine_id;
  update wedo.tontine_members set total_contributed = total_contributed + c.amount where id = c.member_id;

  insert into wedo.mouvements (tontine_id, sequestre_id, type, sens, montant, personne_id, compte_id, round, reference_externe, meta)
    values (c.tontine_id, seq_id, 'cotisation', 'credit', c.amount, v_personne, v_compte, c.round,
            coalesce(c.transaction_id::text, 'SBX-COT-'||left(c.id::text,8)),
            jsonb_build_object('contribution_id', c.id, 'ontime', v_ontime));

  update wedo.scores set total_cotisations = total_cotisations + 1 where personne_id = v_personne;
  if v_ontime then
    update wedo.scores set cotisations_heure = cotisations_heure + 1 where personne_id = v_personne;
    perform wedo.appliquer_score(v_personne, 2, 'Cotisation à l''heure', c.tontine_id);
  else
    update wedo.scores set retards = retards + 1 where personne_id = v_personne;
    update wedo.tontine_members set late_payments_count = late_payments_count + 1 where id = c.member_id;
    perform wedo.appliquer_score(v_personne, -5, 'Cotisation payée en retard', c.tontine_id);
  end if;

  v_dist := wedo.distribuer_tour(c.tontine_id, c.round);
  return jsonb_build_object('success',true,'ontime',v_ontime,'distribution',v_dist);
end;
$$;

-- Detect late / defaulting contributions, apply reputational sanction + alerts.
create or replace function wedo.detecter_defauts()
returns integer language plpgsql security definer set search_path = wedo as $$
declare r record; n int := 0; v_personne uuid;
begin
  for r in
    select c.id, c.user_id, c.tontine_id, c.round, c.due_date, t.grace_period_days, t.creator_id
    from wedo.contributions c join wedo.tontines t on t.id = c.tontine_id
    where c.status = 'Pending'
      and now()::date > (c.due_date + (coalesce(t.grace_period_days,0) || ' days')::interval)
  loop
    select personne_id into v_personne from wedo.comptes where profile_id = r.user_id limit 1;
    if now()::date > (r.due_date + ((coalesce(r.grace_period_days,0)+7) || ' days')::interval) then
      update wedo.contributions set status = 'Failed' where id = r.id;
      update wedo.scores set defauts = defauts + 1 where personne_id = v_personne;
      perform wedo.appliquer_score(v_personne, -15, 'Défaut de cotisation', r.tontine_id);
      insert into wedo.notifications (user_id, title, body, type, related_id) values
        (r.user_id, 'Défaut constaté',
         'Cotisation tour '||r.round||' en défaut. Impact sur votre score de fiabilité.', 'PaymentLate', r.tontine_id);
    else
      update wedo.contributions set status = 'Late' where id = r.id;
      update wedo.scores set retards = retards + 1 where personne_id = v_personne;
      perform wedo.appliquer_score(v_personne, -5, 'Retard de cotisation', r.tontine_id);
      insert into wedo.notifications (user_id, title, body, type, related_id) values
        (r.user_id, 'Cotisation en retard',
         'Cotisation tour '||r.round||' en retard. Merci de régulariser.', 'PaymentLate', r.tontine_id),
        (r.creator_id, 'Membre à risque',
         'Un membre est en retard (tour '||r.round||').', 'System', r.tontine_id);
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Independently recompute & verify the SHA-256 chain + escrow conservation.
-- This is what makes any dispute tranchable => "0 litige".
create or replace function wedo.verifier_registre(p_tontine_id uuid)
returns jsonb language plpgsql security definer set search_path = wedo, extensions as $$
declare
  r wedo.mouvements%rowtype; v_prev text; v_expected text;
  v_len int := 0; v_broken bigint := null; v_credits bigint := 0; v_debits bigint := 0; v_solde bigint;
begin
  if not wedo.is_tontine_member(p_tontine_id, auth.uid()) then
    return jsonb_build_object('valid', false, 'error', 'Accès refusé');
  end if;
  v_prev := wedo.sha256_hex('GENESIS:' || p_tontine_id::text);
  for r in select * from wedo.mouvements where tontine_id = p_tontine_id order by seq asc loop
    v_len := v_len + 1;
    v_expected := wedo.sha256_hex(wedo.mouvement_payload(
      r.seq, r.tontine_id, r.type, r.sens, r.montant, r.personne_id, r.round,
      r.reference_externe, r.created_at, v_prev));
    if r.prev_hash <> v_prev or r.hash <> v_expected then v_broken := r.seq; exit; end if;
    if r.sens = 'credit' then v_credits := v_credits + r.montant; else v_debits := v_debits + r.montant; end if;
    v_prev := r.hash;
  end loop;
  select solde_cantonne into v_solde from wedo.sequestres where tontine_id = p_tontine_id;
  return jsonb_build_object(
    'valid', v_broken is null,
    'length', v_len,
    'broken_at_seq', v_broken,
    'solde_calcule', v_credits - v_debits,
    'solde_sequestre', coalesce(v_solde,0),
    'conservation_ok', (v_broken is null and (v_credits - v_debits) = coalesce(v_solde,0))
  );
end;
$$;

-- Join a tontine with the reliability gate (score_minimum) + KYC gate (P2 if escrow).
create or replace function wedo.rejoindre_tontine(p_tontine_id uuid, p_parrain_personne uuid default null)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare t wedo.tontines%rowtype; v_personne uuid; v_score int; v_palier int;
begin
  select * into t from wedo.tontines where id = p_tontine_id;
  if not found then return jsonb_build_object('success',false,'error','Tontine introuvable'); end if;
  select personne_id into v_personne from wedo.comptes where profile_id = auth.uid() limit 1;
  if v_personne is null then return jsonb_build_object('success',false,'error','Profil non initialisé'); end if;
  select valeur into v_score from wedo.scores where personne_id = v_personne;
  select palier into v_palier from wedo.personnes where id = v_personne;

  if t.sequestre_active and coalesce(v_palier,0) < 2 then
    return jsonb_build_object('success',false,'need','P2',
      'error','Vérification KYC P2 (CNI + face-match) requise pour une tontine sous séquestre.');
  end if;
  if coalesce(v_score,50) < t.score_minimum then
    return jsonb_build_object('success',false,'need','SCORE',
      'error','Score de fiabilité insuffisant ('||coalesce(v_score,50)||' < '||t.score_minimum||').');
  end if;
  if exists (select 1 from wedo.tontine_members where tontine_id=p_tontine_id and user_id=auth.uid()) then
    return jsonb_build_object('success',true,'already',true);
  end if;
  if t.current_members >= t.total_members then
    return jsonb_build_object('success',false,'error','Tontine complète.');
  end if;

  insert into wedo.tontine_members (tontine_id, user_id, role, status)
    values (p_tontine_id, auth.uid(), 'Member', case when t.auto_approve then 'Active' else 'Pending' end);
  update wedo.tontines set current_members = current_members + 1 where id = p_tontine_id;
  if p_parrain_personne is not null and p_parrain_personne <> v_personne then
    update wedo.personnes set parraine_par = p_parrain_personne where id = v_personne and parraine_par is null;
  end if;
  return jsonb_build_object('success',true);
end;
$$;

grant execute on function wedo.verifier_registre(uuid) to authenticated;
grant execute on function wedo.rejoindre_tontine(uuid, uuid) to authenticated;

-- ============================================================
-- CRON — daily late/default sweep (relance automatique + sanction)
-- Applied live as migration `wedo_cron_detecter_defauts`.
-- ============================================================
create extension if not exists pg_cron;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'wedo-detecter-defauts') then
    perform cron.unschedule('wedo-detecter-defauts');
  end if;
end $$;
select cron.schedule('wedo-detecter-defauts', '0 6 * * *', $$ select wedo.detecter_defauts(); $$);
