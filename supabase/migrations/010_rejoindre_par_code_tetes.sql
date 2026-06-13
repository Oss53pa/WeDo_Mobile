-- WeDo migration 010 — pass the chosen number of "têtes" through the join-by-code path.
-- Replaces rejoindre_tontine_par_code(text, uuid) with a 3-arg version (p_nb_tetes default 1)
-- and forwards it to rejoindre_tontine(uuid, uuid, int).

drop function if exists wedo.rejoindre_tontine_par_code(text, uuid);

create or replace function wedo.rejoindre_tontine_par_code(
  p_code text,
  p_parrain_personne uuid default null,
  p_nb_tetes int default 1
)
returns jsonb
language plpgsql
security definer
set search_path to 'wedo'
as $$
declare
  v_id uuid;
  v_name text;
  v_status wedo.tontine_status;
begin
  select id, name, status into v_id, v_name, v_status
    from wedo.tontines
    where invite_code = upper(trim(p_code));
  if not found then
    return jsonb_build_object('success', false, 'error', 'Code d''invitation invalide.');
  end if;
  if v_status in ('Completed', 'Cancelled') then
    return jsonb_build_object('success', false, 'error', 'Cette tontine est terminée.');
  end if;
  return wedo.rejoindre_tontine(v_id, p_parrain_personne, p_nb_tetes)
    || jsonb_build_object('tontineId', v_id, 'tontineName', v_name);
end $$;

revoke all on function wedo.rejoindre_tontine_par_code(text, uuid, int) from public, anon;
grant execute on function wedo.rejoindre_tontine_par_code(text, uuid, int) to authenticated;
