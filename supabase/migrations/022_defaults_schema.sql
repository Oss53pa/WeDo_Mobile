-- WeDo migration 022 — Cycle de vie cotisation & défauts : schéma.
-- Caution optionnelle (jamais imposée), dette + preuve de créance, liste d'attente,
-- états membre, paramètres par tontine. bigint partout. RLS : self + organisatrice.
-- Rien ici ne débite le compte cantonné (séquestre) : caution/dette sont distincts.

-- Paramètres par tontine (défauts prudents).
alter table wedo.tontines
  add column if not exists order_by_score boolean not null default false,
  add column if not exists caution_mode text not null default 'none'
    check (caution_mode in ('none','early_position','all')),
  add column if not exists caution_rate_bps smallint not null default 0,   -- % du reste à payer (bps)
  add column if not exists residual_rule text not null default 'mutualise'
    check (residual_rule in ('mutualise','organisatrice')),
  add column if not exists recovery_threshold_fcfa bigint not null default 0;

-- État du membre dans le cycle (machine à états du brief 3.1).
alter table wedo.tontine_members
  add column if not exists member_state text not null default 'actif'
    check (member_state in ('actif','en_retard','en_defaut','desiste','exclu','remplace','termine')),
  add column if not exists score_snapshot int,
  add column if not exists order_override boolean not null default false;  -- ordre fixé à la main

-- Caution séquestrée (liée à une position précoce). Optionnelle.
create table if not exists wedo.cautions (
  id          uuid primary key default gen_random_uuid(),
  tontine_id  uuid not null references wedo.tontines(id) on delete cascade,
  user_id     uuid not null references wedo.profiles(id) on delete cascade,
  amount_fcfa bigint not null check (amount_fcfa >= 0),
  status      text not null default 'held' check (status in ('held','consumed','released')),
  created_at  timestamptz not null default now(),
  unique (tontine_id, user_id)
);

-- Dette (défaut après versement, ou avance couverte par caution insuffisante).
create table if not exists wedo.debts (
  id             uuid primary key default gen_random_uuid(),
  tontine_id     uuid not null references wedo.tontines(id) on delete cascade,
  user_id        uuid not null references wedo.profiles(id) on delete cascade,
  principal_fcfa bigint not null check (principal_fcfa >= 0),
  recovered_fcfa bigint not null default 0 check (recovered_fcfa >= 0),
  status         text not null default 'open' check (status in ('open','recovering','settled','written_off')),
  proof_hash     text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_debts_tontine on wedo.debts (tontine_id);
create index if not exists idx_debts_user on wedo.debts (user_id);

-- Liste d'attente (remplaçants pour cession de position).
create table if not exists wedo.waitlist (
  id          uuid primary key default gen_random_uuid(),
  tontine_id  uuid not null references wedo.tontines(id) on delete cascade,
  user_id     uuid not null references wedo.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (tontine_id, user_id)
);

alter table wedo.cautions enable row level security;
alter table wedo.debts    enable row level security;
alter table wedo.waitlist enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='cautions' and policyname='caution_select') then
    create policy caution_select on wedo.cautions for select to authenticated
      using (user_id = auth.uid()
        or exists (select 1 from wedo.tontines t where t.id = cautions.tontine_id and t.creator_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='debts' and policyname='debt_select') then
    create policy debt_select on wedo.debts for select to authenticated
      using (user_id = auth.uid()
        or exists (select 1 from wedo.tontines t where t.id = debts.tontine_id and t.creator_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='waitlist' and policyname='waitlist_select') then
    create policy waitlist_select on wedo.waitlist for select to authenticated
      using (wedo.is_tontine_member(tontine_id, auth.uid())
        or exists (select 1 from wedo.tontines t where t.id = waitlist.tontine_id and t.creator_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='waitlist' and policyname='waitlist_insert_self') then
    create policy waitlist_insert_self on wedo.waitlist for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='waitlist' and policyname='waitlist_delete_self') then
    create policy waitlist_delete_self on wedo.waitlist for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;
