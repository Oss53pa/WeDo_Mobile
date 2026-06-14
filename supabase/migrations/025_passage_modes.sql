-- WeDo migration 025 — modes de passage flexibles (brief v2 §3.3).
-- Compléments à assigner_ordre (par score) : tirage au sort transparent + ordre manuel.
-- Les positions fixées à la main (order_override) sont toujours préservées.

-- Tirage au sort : attribue aléatoirement les positions LIBRES aux membres non fixés.
create or replace function wedo.tirer_au_sort_ordre(p_tontine uuid)
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
    select m.id, row_number() over (order by random()) as rn
    from wedo.tontine_members m
    where m.tontine_id=p_tontine and m.status='Active' and not m.order_override
  ),
  assign as (
    select r.id, fp.pos from ranked r
    join (select pos, row_number() over (order by random()) rn from freepos) fp on fp.rn=r.rn
  )
  update wedo.tontine_members m set reception_order = a.pos from assign a where m.id=a.id;
  get diagnostics v_n = row_count;
  return jsonb_build_object('success',true,'reordered',v_n,'mode','tirage');
end $$;

-- Ordre manuel : l'organisatrice fixe la position d'un membre (verrouillée = override).
create or replace function wedo.fixer_ordre_manuel(p_tontine uuid, p_user uuid, p_position int)
returns jsonb language plpgsql security definer set search_path=wedo as $$
declare v_active int;
begin
  if not wedo._is_organizer(p_tontine, auth.uid()) then
    return jsonb_build_object('success',false,'error','Réservé à l''organisatrice.');
  end if;
  select count(*) into v_active from wedo.tontine_members where tontine_id=p_tontine and status='Active';
  if p_position is null or p_position < 1 or p_position > v_active then
    return jsonb_build_object('success',false,'error','Position hors limites (1..'||v_active||').');
  end if;
  update wedo.tontine_members set order_override=false
    where tontine_id=p_tontine and status='Active' and reception_order=p_position and user_id<>p_user and not order_override;
  update wedo.tontine_members set reception_order=p_position, order_override=true
    where tontine_id=p_tontine and user_id=p_user;
  return jsonb_build_object('success',true,'position',p_position);
end $$;

-- Libère un verrou manuel (le membre repassera dans l'auto-ordre score/tirage).
create or replace function wedo.liberer_ordre_manuel(p_tontine uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path=wedo as $$
begin
  if not wedo._is_organizer(p_tontine, auth.uid()) then
    return jsonb_build_object('success',false,'error','Réservé à l''organisatrice.');
  end if;
  update wedo.tontine_members set order_override=false
    where tontine_id=p_tontine and user_id=p_user;
  return jsonb_build_object('success',true);
end $$;

revoke all on function wedo.tirer_au_sort_ordre(uuid) from public, anon;
revoke all on function wedo.fixer_ordre_manuel(uuid,uuid,int) from public, anon;
revoke all on function wedo.liberer_ordre_manuel(uuid,uuid) from public, anon;
grant execute on function wedo.tirer_au_sort_ordre(uuid),
  wedo.fixer_ordre_manuel(uuid,uuid,int), wedo.liberer_ordre_manuel(uuid,uuid) to authenticated;
