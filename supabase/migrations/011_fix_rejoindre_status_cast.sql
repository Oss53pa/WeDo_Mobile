-- WeDo migration 011 — fix a latent bug in rejoindre_tontine.
-- The membership insert used `case when t.auto_approve then 'Active' else 'Pending' end`
-- whose result type is `text`, but tontine_members.status is the `member_status` enum →
-- "column status is of type member_status but expression is of type text". Any real join
-- reaching the insert failed. Cast the CASE result to the enum explicitly.

create or replace function wedo.rejoindre_tontine(
  p_tontine_id uuid,
  p_parrain_personne uuid default null,
  p_nb_tetes int default 1
)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare t wedo.tontines%rowtype; v_personne uuid; v_score int; v_palier int; v_tetes int;
begin
  select * into t from wedo.tontines where id = p_tontine_id;
  if not found then return jsonb_build_object('success',false,'error','Tontine introuvable'); end if;
  v_tetes := greatest(1, coalesce(p_nb_tetes, 1));
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

  insert into wedo.tontine_members (tontine_id, user_id, role, status, nb_tetes)
    values (p_tontine_id, auth.uid(), 'Member',
            (case when t.auto_approve then 'Active' else 'Pending' end)::wedo.member_status, v_tetes);
  update wedo.tontines set current_members = current_members + 1 where id = p_tontine_id;
  if p_parrain_personne is not null and p_parrain_personne <> v_personne then
    update wedo.personnes set parraine_par = p_parrain_personne where id = v_personne and parraine_par is null;
  end if;
  return jsonb_build_object('success',true,'nbTetes',v_tetes);
end;
$$;

grant execute on function wedo.rejoindre_tontine(uuid, uuid, int) to authenticated;
