-- WeDo migration 015 — WEDO-AMB-04: qualification de tontine & reward_events.
-- Une tontine PARRAINÉE (créatrice = filleule d'une ambassadrice) devient qualifiée
-- quand : ≥8 membres distincts KYC P2 (personnes.palier>=2), tour 1 distribué
-- (=> tour 1 entièrement versé, garanti par distribuer_tour), pas de litige (non
-- modélisé). À la qualification : un reward_event idempotent (unique tontine+amb).
-- Anti-collusion (recyclage de membres entre tontines de la même ambassadrice) → review.

-- Nombre de membres KYC P2 distincts d'une tontine.
create or replace function wedo.ambassador_kyc_member_count(p_tontine uuid)
returns int language sql stable security definer set search_path = wedo as $$
  select count(distinct m.user_id)::int
  from wedo.tontine_members m
  join wedo.comptes c  on c.profile_id = m.user_id
  join wedo.personnes p on p.id = c.personne_id
  where m.tontine_id = p_tontine and m.status = 'Active' and coalesce(p.palier,0) >= 2;
$$;

-- Signal de collusion : ≥4 membres de cette tontine apparaissent aussi dans une AUTRE
-- tontine parrainée par la même ambassadrice (recyclage de membres). Heuristique v1.
create or replace function wedo.ambassador_collusion_signal(p_tontine uuid, p_amb uuid)
returns boolean language sql stable security definer set search_path = wedo as $$
  select (
    select count(distinct m.user_id)
    from wedo.tontine_members m
    where m.tontine_id = p_tontine and m.status='Active'
      and exists (
        select 1 from wedo.referrals rf
        join wedo.tontines t2 on t2.creator_id = rf.referee_user_id and t2.id <> p_tontine
        join wedo.tontine_members m2 on m2.tontine_id = t2.id and m2.user_id = m.user_id and m2.status='Active'
        where rf.ambassador_id = p_amb
      )
  ) >= 4;
$$;

-- Crée la récompense si la tontine parrainée est qualifiée. Idempotent.
create or replace function wedo.ambassador_on_tontine_qualified(p_tontine uuid)
returns uuid language plpgsql security definer set search_path = wedo as $$
declare
  t wedo.tontines%rowtype; rf wedo.referrals%rowtype;
  v_kyc int; v_round1 boolean; v_reward bigint; v_review boolean; v_id uuid;
begin
  select * into t from wedo.tontines where id = p_tontine;
  if not found then return null; end if;

  -- La créatrice de la tontine doit être une filleule.
  select * into rf from wedo.referrals where referee_user_id = t.creator_id limit 1;
  if not found then return null; end if;

  -- Idempotence (la contrainte unique garantit aussi l'unicité).
  select id into v_id from wedo.reward_events where tontine_id = p_tontine and ambassador_id = rf.ambassador_id;
  if v_id is not null then return v_id; end if;

  -- Critères de qualification.
  v_kyc := wedo.ambassador_kyc_member_count(p_tontine);
  if v_kyc < 8 then return null; end if;

  select exists (
    select 1 from wedo.distributions
    where tontine_id = p_tontine and round = 1 and status = 'Completed'
  ) into v_round1;
  if not v_round1 then return null; end if;

  -- Montant (bigint, jamais l'IA) + signal de collusion → review.
  v_reward := wedo.ambassador_reward_fcfa(coalesce(t.frais_total, 0));
  v_review := wedo.ambassador_collusion_signal(p_tontine, rf.ambassador_id);

  insert into wedo.reward_events(ambassador_id, referral_id, tontine_id,
                                 activation_fee_fcfa, reward_fcfa, status, qualified_at)
    values (rf.ambassador_id, rf.id, p_tontine,
            coalesce(t.frais_total,0), v_reward,
            case when v_review then 'review' else 'accrued' end, now())
    on conflict (tontine_id, ambassador_id) do nothing
    returning id into v_id;

  return v_id;
end $$;

-- Déclencheur : à la distribution du tour 1, on tente la qualification (idempotent).
create or replace function wedo.trg_ambassador_qualify()
returns trigger language plpgsql security definer set search_path = wedo as $$
begin
  if new.round = 1 and new.status = 'Completed' then
    perform wedo.ambassador_on_tontine_qualified(new.tontine_id);
  end if;
  return new;
end $$;

drop trigger if exists ambassador_qualify_on_distribution on wedo.distributions;
create trigger ambassador_qualify_on_distribution
  after insert on wedo.distributions
  for each row execute function wedo.trg_ambassador_qualify();

-- onTontineQualified n'est PAS exposée aux clients (mint de récompense) : trigger /
-- service role uniquement.
revoke all on function wedo.ambassador_on_tontine_qualified(uuid) from public, anon, authenticated;
