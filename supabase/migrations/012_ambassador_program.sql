-- WeDo migration 012 — Programme Ambassadrices (WEDO-AMB-01: schéma & RLS).
-- Applied to project easoqoswtmvtkdwwkqtc (schema wedo).
--
-- Conventions (brief Programme Ambassadrices) :
--  * Montants en bigint, FCFA entier. Jamais de float.
--  * RLS sur toutes les tables : lecture limitée à l'ambassadrice du user courant ;
--    écritures réservées au service role (Edge Functions) → aucune policy write.
--  * Idempotence : reward_events unique (tontine_id, ambassador_id) ; payouts unique
--    (ambassador_id, period_month) ; referrals.referee_user_id unique (un seul parrain).
--  * Récompense = dépense marketing : ces tables ne touchent JAMAIS le séquestre.
--  * Le brief écrit `references users(id)` ; dans WeDo la table des comptes est
--    `wedo.profiles(id)`. Les FK pointent donc sur wedo.profiles / wedo.tontines.
--  * Paramètres (taux 10 %, bonus Or 25 000, plafond 250 000) dans program_settings,
--    versionnés, jamais en dur.

-- ─────────────────────────────────────────────────────────────────────────────
-- Paramètres du programme (versionnés ; la ligne active = version max où active)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists wedo.program_settings (
  id                    uuid primary key default gen_random_uuid(),
  version               int  not null unique,
  reward_rate_pct       smallint not null default 10,      -- 10 %
  bonus_or_fcfa         bigint   not null default 25000,   -- bonus palier Or
  plafond_mensuel_fcfa  bigint   not null default 250000,  -- plafond/mois/ambassadrice
  tier_argent_min       smallint not null default 4,       -- Argent : 4–9
  tier_or_min           smallint not null default 10,      -- Or : 10+
  active                boolean  not null default true,
  created_at            timestamptz not null default now()
);

insert into wedo.program_settings (version, reward_rate_pct, bonus_or_fcfa, plafond_mensuel_fcfa)
  values (1, 10, 25000, 250000)
  on conflict (version) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Profil ambassadrice (1:1 avec l'organisatrice)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists wedo.ambassador_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references wedo.profiles(id) on delete cascade unique,
  is_ambassador       boolean not null default false,
  activated_at        timestamptz,
  charter_accepted_at timestamptz,
  status              text not null default 'active' check (status in ('active','suspended')),
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Code de parrainage (1:1 avec l'ambassadrice)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists wedo.referral_codes (
  code          text primary key,                          -- court, unique, ex. "AWA4F2"
  ambassador_id uuid not null references wedo.ambassador_profiles(id) on delete cascade unique,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Lien parrain → filleule (un seul parrain par filleule)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists wedo.referrals (
  id              uuid primary key default gen_random_uuid(),
  ambassador_id   uuid not null references wedo.ambassador_profiles(id) on delete cascade,
  referee_user_id uuid not null references wedo.profiles(id) on delete cascade unique, -- 1 seul parrain
  code_used       text not null references wedo.referral_codes(code),
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Récompense générée à la qualification d'une tontine (idempotente)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists wedo.reward_events (
  id                  uuid primary key default gen_random_uuid(),
  ambassador_id       uuid not null references wedo.ambassador_profiles(id) on delete cascade,
  referral_id         uuid not null references wedo.referrals(id) on delete cascade,
  tontine_id          uuid not null references wedo.tontines(id) on delete cascade,
  activation_fee_fcfa bigint not null,
  reward_fcfa         bigint not null,
  status              text not null default 'accrued'
                        check (status in ('accrued','paid','review','clawed_back','void')),
  qualified_at        timestamptz not null,
  created_at          timestamptz not null default now(),
  unique (tontine_id, ambassador_id)                       -- IDEMPOTENCE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Versement mensuel agrégé
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists wedo.payouts (
  id             uuid primary key default gen_random_uuid(),
  ambassador_id  uuid not null references wedo.ambassador_profiles(id) on delete cascade,
  period_month   date not null,                            -- 1er du mois concerné
  tier           text not null check (tier in ('bronze','argent','or')),
  base_fcfa      bigint not null,
  bonus_fcfa     bigint not null default 0,
  total_fcfa     bigint not null,
  status         text not null default 'pending' check (status in ('pending','sent','failed')),
  momo_provider  text check (momo_provider in ('orange','mtn','moov','wave')),
  momo_ref       text,
  sent_at        timestamptz,
  created_at     timestamptz not null default now(),
  unique (ambassador_id, period_month)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Lignes d'un versement (traçabilité)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists wedo.payout_items (
  id              uuid primary key default gen_random_uuid(),
  payout_id       uuid not null references wedo.payouts(id) on delete cascade,
  reward_event_id uuid references wedo.reward_events(id),  -- null pour le bonus
  label           text not null,
  amount_fcfa     bigint not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Index
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_reward_events_amb_qual on wedo.reward_events (ambassador_id, qualified_at);
create index if not exists idx_referrals_ambassador   on wedo.referrals (ambassador_id);
create index if not exists idx_payouts_period          on wedo.payouts (period_month);
create index if not exists idx_payout_items_payout     on wedo.payout_items (payout_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS : lecture = ses propres lignes ; écriture = service role uniquement
-- (RLS activé + AUCUNE policy insert/update/delete ⇒ le client ne peut pas écrire ;
--  le service role bypasse la RLS pour les Edge Functions.)
-- ─────────────────────────────────────────────────────────────────────────────
alter table wedo.program_settings   enable row level security;
alter table wedo.ambassador_profiles enable row level security;
alter table wedo.referral_codes     enable row level security;
alter table wedo.referrals          enable row level security;
alter table wedo.reward_events      enable row level security;
alter table wedo.payouts            enable row level security;
alter table wedo.payout_items       enable row level security;

-- Helper inline : id ambassadrice du user courant
--   (select id from wedo.ambassador_profiles where user_id = auth.uid())

do $$ begin
  -- program_settings : lisible par tout utilisateur authentifié (paramètres publics)
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='program_settings' and policyname='ps_select') then
    create policy ps_select on wedo.program_settings for select to authenticated using (true);
  end if;

  -- ambassador_profiles : je vois mon profil ambassadrice
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='ambassador_profiles' and policyname='ap_select') then
    create policy ap_select on wedo.ambassador_profiles for select to authenticated
      using (user_id = auth.uid());
  end if;

  -- referral_codes : mon code
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='referral_codes' and policyname='rc_select') then
    create policy rc_select on wedo.referral_codes for select to authenticated
      using (ambassador_id in (select id from wedo.ambassador_profiles where user_id = auth.uid()));
  end if;

  -- referrals : mes filleules
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='referrals' and policyname='rf_select') then
    create policy rf_select on wedo.referrals for select to authenticated
      using (ambassador_id in (select id from wedo.ambassador_profiles where user_id = auth.uid()));
  end if;

  -- reward_events : mes récompenses
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='reward_events' and policyname='re_select') then
    create policy re_select on wedo.reward_events for select to authenticated
      using (ambassador_id in (select id from wedo.ambassador_profiles where user_id = auth.uid()));
  end if;

  -- payouts : mes versements
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='payouts' and policyname='po_select') then
    create policy po_select on wedo.payouts for select to authenticated
      using (ambassador_id in (select id from wedo.ambassador_profiles where user_id = auth.uid()));
  end if;

  -- payout_items : lignes de mes versements
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='payout_items' and policyname='pi_select') then
    create policy pi_select on wedo.payout_items for select to authenticated
      using (payout_id in (
        select p.id from wedo.payouts p
        join wedo.ambassador_profiles a on a.id = p.ambassador_id
        where a.user_id = auth.uid()));
  end if;
end $$;
