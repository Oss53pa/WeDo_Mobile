-- WeDo migration 023 — RPC du module défauts. bigint partout. SECURITY DEFINER
-- (authz interne : organisatrice/créatrice ou self). Aucun débit du séquestre ici.

alter table wedo.contributions add column if not exists covered_by text
  check (covered_by is null or covered_by in ('caution'));

-- Helpers
create or replace function wedo._personne(p_user uuid)
returns uuid language sql stable security definer set search_path=wedo as $$
  select personne_id from wedo.comptes where profile_id = p_user limit 1;
$$;
create or replace function wedo._is_organizer(p_tontine uuid, p_user uuid)
returns boolean language sql stable security definer set search_path=wedo as $$
  select exists (select 1 from wedo.tontines t where t.id=p_tontine and t.creator_id=p_user)
      or exists (select 1 from wedo.tontine_members m where m.tontine_id=p_tontine and m.user_id=p_user
                  and m.status='Active' and m.role in ('Admin','Treasurer'));
$$;

-- 1) Ordre de passage par score (membres sans override gardent les places libres).
create or replace function wedo.assigner_ordre(p_tontine uuid)
returns jsonb language plpgsql security definer set search_path=wedo as $$
declare v_n int;
begin
  if not wedo._is_organizer(p_tontine, auth.uid()) then
    return jsonb_build_object('success',false,'error','Réservé à l''organisatrice.');
  end if;
  with ov as (
    select reception_order from wedo.tontine_members
    where tontine_id=p_tontine and status='Active' and order_override and reception_order is not null
  ),
  freepos as (
    select gs as pos from generate_series(1,(select count(*) from wedo.tontine_members where tontine_id=p_tontine and status='Active')) gs
    where gs not in (select reception_order from ov)
  ),
  ranked as (
    select m.id,
           row_number() over (order by coalesce(s.valeur,50) desc, m.joined_at, m.id) as rn,
           coalesce(s.valeur,50) as sc
    from wedo.tontine_members m
    left join wedo.comptes c on c.profile_id=m.user_id
    left join wedo.scores s on s.personne_id=c.personne_id
    where m.tontine_id=p_tontine and m.status='Active' and not m.order_override
  ),
  assign as (
    select r.id, fp.pos, r.sc from ranked r
    join (select pos, row_number() over (order by pos) rn from freepos) fp on fp.rn=r.rn
  )
  update wedo.tontine_members m
    set reception_order = a.pos, score_snapshot = a.sc
    from assign a where m.id=a.id;
  get diagnostics v_n = row_count;
  return jsonb_build_object('success',true,'reordered',v_n);
end $$;

-- 2) Déposer une caution (optionnelle, liée à la position précoce). Self.
create or replace function wedo.deposer_caution(p_tontine uuid, p_amount bigint)
returns jsonb language plpgsql security definer set search_path=wedo as $$
declare t wedo.tontines%rowtype;
begin
  select * into t from wedo.tontines where id=p_tontine;
  if not found then return jsonb_build_object('success',false,'error','Tontine introuvable'); end if;
  if t.caution_mode='none' then return jsonb_build_object('success',false,'error','Caution non activée sur cette tontine.'); end if;
  if coalesce(p_amount,0) <= 0 then return jsonb_build_object('success',false,'error','Montant invalide.'); end if;
  insert into wedo.cautions(tontine_id,user_id,amount_fcfa,status)
    values (p_tontine, auth.uid(), p_amount, 'held')
    on conflict (tontine_id,user_id) do update set amount_fcfa=excluded.amount_fcfa, status='held';
  return jsonb_build_object('success',true,'amount',p_amount);
end $$;

-- 3) Couvrir un impayé par la caution (l'avance devient une dette). Organisatrice/système.
create or replace function wedo.couvrir_manque(p_tontine uuid, p_round int, p_user uuid)
returns jsonb language plpgsql security definer set search_path=wedo, extensions as $$
declare v_due bigint; v_caution wedo.cautions%rowtype; c_id uuid;
begin
  if not wedo._is_organizer(p_tontine, auth.uid()) then
    return jsonb_build_object('success',false,'error','Réservé à l''organisatrice.');
  end if;
  select id, amount into c_id, v_due from wedo.contributions
    where tontine_id=p_tontine and round=p_round and user_id=p_user and status<>'Paid' limit 1;
  if c_id is null then return jsonb_build_object('success',false,'error','Aucune cotisation impayée.'); end if;
  select * into v_caution from wedo.cautions where tontine_id=p_tontine and user_id=p_user and status='held';
  if not found or v_caution.amount_fcfa < v_due then
    return jsonb_build_object('success',false,'error','Caution absente ou insuffisante.','due',v_due);
  end if;
  update wedo.cautions set amount_fcfa=amount_fcfa - v_due,
    status = case when amount_fcfa - v_due <= 0 then 'consumed' else 'held' end
    where id=v_caution.id;
  update wedo.contributions set status='Paid', paid_date=now(), covered_by='caution' where id=c_id;
  insert into wedo.debts(tontine_id,user_id,principal_fcfa,proof_hash)
    values (p_tontine,p_user,v_due, encode(digest(p_user::text||'|'||p_tontine::text||'|avance|'||v_due::text||'|'||extract(epoch from now())::text,'sha256'),'hex'));
  return jsonb_build_object('success',true,'covered',v_due);
end $$;

-- 4) Défaut après versement : caution puis dette + preuve + score détruit. Organisatrice.
create or replace function wedo.constater_defaut(p_tontine uuid, p_user uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path=wedo, extensions as $$
declare v_recu bigint; v_paye bigint; v_out bigint; v_caution bigint := 0; v_pers uuid; v_debt uuid; v_hash text;
begin
  if not wedo._is_organizer(p_tontine, auth.uid()) then
    return jsonb_build_object('success',false,'error','Réservé à l''organisatrice.');
  end if;
  select coalesce(total_received,0), coalesce(total_contributed,0) into v_recu, v_paye
    from wedo.tontine_members where tontine_id=p_tontine and user_id=p_user;
  v_out := greatest(v_recu - v_paye, 0);
  if v_out <= 0 then return jsonb_build_object('success',false,'error','Pas de reste dû (rien reçu en trop).'); end if;
  select amount_fcfa into v_caution from wedo.cautions where tontine_id=p_tontine and user_id=p_user and status='held';
  v_caution := coalesce(v_caution,0);
  if v_caution > 0 then
    update wedo.cautions set amount_fcfa=greatest(amount_fcfa - v_out,0),
      status = case when amount_fcfa - v_out <= 0 then 'consumed' else 'held' end
      where tontine_id=p_tontine and user_id=p_user and status='held';
  end if;
  v_out := greatest(v_out - v_caution, 0);
  v_hash := encode(digest(p_user::text||'|'||p_tontine::text||'|defaut|'||v_out::text||'|'||extract(epoch from now())::text,'sha256'),'hex');
  if v_out > 0 then
    insert into wedo.debts(tontine_id,user_id,principal_fcfa,proof_hash,status)
      values (p_tontine,p_user,v_out,v_hash,'open') returning id into v_debt;
  end if;
  update wedo.tontine_members set member_state='en_defaut' where tontine_id=p_tontine and user_id=p_user;
  v_pers := wedo._personne(p_user);
  if v_pers is not null then perform wedo.appliquer_score(v_pers, -50, coalesce('Défaut: '||p_reason,'Défaut après versement'), p_tontine); end if;
  return jsonb_build_object('success',true,'outstanding',v_out,'caution_used',v_caution,'debtId',v_debt,'proofHash',v_hash);
end $$;

-- 5) Désistement avant d'avoir touché : net + état + score modéré. Self ou organisatrice.
create or replace function wedo.desister(p_tontine uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path=wedo as $$
declare v_recu bigint; v_paye bigint; v_pers uuid; v_wait boolean;
begin
  if auth.uid() <> p_user and not wedo._is_organizer(p_tontine, auth.uid()) then
    return jsonb_build_object('success',false,'error','Non autorisé.');
  end if;
  select coalesce(total_received,0), coalesce(total_contributed,0) into v_recu, v_paye
    from wedo.tontine_members where tontine_id=p_tontine and user_id=p_user;
  if v_recu > 0 then return jsonb_build_object('success',false,'error','Déjà bénéficiaire : utiliser le constat de défaut.'); end if;
  update wedo.tontine_members set member_state='desiste', status='Suspended' where tontine_id=p_tontine and user_id=p_user;
  select exists(select 1 from wedo.waitlist where tontine_id=p_tontine) into v_wait;
  v_pers := wedo._personne(p_user);
  if v_pers is not null then perform wedo.appliquer_score(v_pers, -10, 'Désistement déclaré', p_tontine); end if;
  return jsonb_build_object('success',true,'refundNetFcfa',v_paye,'replacementAvailable',v_wait);
end $$;

-- 6) Régularisation d'une dette (+ réhabilitation du score quand soldée). Organisatrice.
create or replace function wedo.regulariser_dette(p_debt uuid, p_amount bigint)
returns jsonb language plpgsql security definer set search_path=wedo as $$
declare d wedo.debts%rowtype; v_pers uuid;
begin
  select * into d from wedo.debts where id=p_debt;
  if not found then return jsonb_build_object('success',false,'error','Dette introuvable'); end if;
  if not wedo._is_organizer(d.tontine_id, auth.uid()) then
    return jsonb_build_object('success',false,'error','Réservé à l''organisatrice.');
  end if;
  update wedo.debts set recovered_fcfa = least(principal_fcfa, recovered_fcfa + greatest(p_amount,0)),
    status = case when recovered_fcfa + greatest(p_amount,0) >= principal_fcfa then 'settled' else 'recovering' end
    where id=p_debt;
  select * into d from wedo.debts where id=p_debt;
  if d.status='settled' then
    v_pers := wedo._personne(d.user_id);
    if v_pers is not null then perform wedo.appliquer_score(v_pers, 20, 'Dette régularisée (réhabilitation)', d.tontine_id); end if;
    update wedo.tontine_members set member_state='actif'
      where tontine_id=d.tontine_id and user_id=d.user_id and member_state='en_defaut'
        and not exists (select 1 from wedo.debts x where x.user_id=d.user_id and x.status in ('open','recovering') and x.id<>d.id);
  end if;
  return jsonb_build_object('success',true,'status',d.status,'recovered',d.recovered_fcfa,'principal',d.principal_fcfa);
end $$;

revoke all on function wedo.assigner_ordre(uuid) from public, anon;
revoke all on function wedo.deposer_caution(uuid,bigint) from public, anon;
revoke all on function wedo.couvrir_manque(uuid,int,uuid) from public, anon;
revoke all on function wedo.constater_defaut(uuid,uuid,text) from public, anon;
revoke all on function wedo.desister(uuid,uuid) from public, anon;
revoke all on function wedo.regulariser_dette(uuid,bigint) from public, anon;
grant execute on function wedo.assigner_ordre(uuid),
  wedo.deposer_caution(uuid,bigint), wedo.couvrir_manque(uuid,int,uuid),
  wedo.constater_defaut(uuid,uuid,text), wedo.desister(uuid,uuid),
  wedo.regulariser_dette(uuid,bigint) to authenticated;
