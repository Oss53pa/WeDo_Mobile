-- WeDo migration 024 — configuration des paramètres anti-défaut par tontine (organisatrice).
create or replace function wedo.set_defaults_config(
  p_tontine uuid,
  p_order_by_score boolean default null,
  p_caution_mode text default null,
  p_caution_rate_bps int default null,
  p_residual_rule text default null,
  p_recovery_threshold_fcfa bigint default null
) returns jsonb language plpgsql security definer set search_path=wedo as $$
begin
  if not wedo._is_organizer(p_tontine, auth.uid()) then
    return jsonb_build_object('success',false,'error','Réservé à l''organisatrice.');
  end if;
  if p_caution_mode is not null and p_caution_mode not in ('none','early_position','all') then
    return jsonb_build_object('success',false,'error','caution_mode invalide'); end if;
  if p_residual_rule is not null and p_residual_rule not in ('mutualise','organisatrice') then
    return jsonb_build_object('success',false,'error','residual_rule invalide'); end if;
  update wedo.tontines set
    order_by_score = coalesce(p_order_by_score, order_by_score),
    caution_mode = coalesce(p_caution_mode, caution_mode),
    caution_rate_bps = coalesce(p_caution_rate_bps, caution_rate_bps),
    residual_rule = coalesce(p_residual_rule, residual_rule),
    recovery_threshold_fcfa = coalesce(p_recovery_threshold_fcfa, recovery_threshold_fcfa)
  where id = p_tontine;
  return jsonb_build_object('success',true);
end $$;
revoke all on function wedo.set_defaults_config(uuid,boolean,text,int,text,bigint) from public, anon;
grant execute on function wedo.set_defaults_config(uuid,boolean,text,int,text,bigint) to authenticated;
