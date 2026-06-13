-- WeDo migration 016 — WEDO-AMB-05: paliers & payouts mensuels.
-- compute_monthly_tier : Bronze 1–3 / Argent 4–9 / Or 10+ (seuils depuis settings).
-- build_monthly_payouts : agrège les reward_events 'accrued' d'un mois en un payout
-- + payout_items, applique le plafond mensuel, statut 'pending'. Idempotent
-- (unique ambassador_id+period_month ; ne reprend que les events encore 'accrued').

create or replace function wedo.compute_monthly_tier(p_count int)
returns text language plpgsql stable security definer set search_path = wedo as $$
declare s wedo.program_settings;
begin
  s := wedo.active_program_settings();
  if p_count >= coalesce(s.tier_or_min,10) then return 'or';
  elsif p_count >= coalesce(s.tier_argent_min,4) then return 'argent';
  elsif p_count >= 1 then return 'bronze';
  else return null; end if;
end $$;

-- Construit les payouts d'un mois (p_period = 1er du mois concerné).
-- Par défaut : le mois précédent (cron du 1er).
create or replace function wedo.build_monthly_payouts(
  p_period date default (date_trunc('month', current_date - interval '1 month'))::date
)
returns int language plpgsql security definer set search_path = wedo as $$
declare
  s wedo.program_settings; v_start timestamptz; v_end timestamptz;
  r record; v_tier text; v_bonus bigint; v_capped bigint; v_total bigint;
  v_payout uuid; v_made int := 0; e record;
begin
  s := wedo.active_program_settings();
  v_start := p_period::timestamptz;
  v_end   := (p_period + interval '1 month')::timestamptz;

  for r in
    select ambassador_id, count(*) as cnt, sum(reward_fcfa) as base
    from wedo.reward_events
    where status = 'accrued' and qualified_at >= v_start and qualified_at < v_end
    group by ambassador_id
  loop
    v_tier   := wedo.compute_monthly_tier(r.cnt::int);
    v_bonus  := case when v_tier = 'or' then coalesce(s.bonus_or_fcfa, 0) else 0 end;
    v_capped := least(r.base, coalesce(s.plafond_mensuel_fcfa, r.base));  -- plafond sur la base
    v_total  := v_capped + v_bonus;

    insert into wedo.payouts(ambassador_id, period_month, tier, base_fcfa, bonus_fcfa, total_fcfa, status)
      values (r.ambassador_id, p_period, v_tier, v_capped, v_bonus, v_total, 'pending')
      on conflict (ambassador_id, period_month) do nothing
      returning id into v_payout;

    if v_payout is null then continue; end if;  -- déjà construit (idempotent)
    v_made := v_made + 1;

    -- Items : une ligne par récompense (montant réel), puis ajustement plafond, puis bonus.
    for e in
      select id, tontine_id, reward_fcfa from wedo.reward_events
      where ambassador_id = r.ambassador_id and status = 'accrued'
        and qualified_at >= v_start and qualified_at < v_end
    loop
      insert into wedo.payout_items(payout_id, reward_event_id, label, amount_fcfa)
        values (v_payout, e.id, 'Récompense tontine '||left(e.tontine_id::text,8), e.reward_fcfa);
      update wedo.reward_events set status = 'paid' where id = e.id;  -- verrouillé dans le payout
    end loop;

    if v_capped < r.base then
      insert into wedo.payout_items(payout_id, reward_event_id, label, amount_fcfa)
        values (v_payout, null, 'Ajustement plafond mensuel', v_capped - r.base); -- négatif
    end if;
    if v_bonus > 0 then
      insert into wedo.payout_items(payout_id, reward_event_id, label, amount_fcfa)
        values (v_payout, null, 'Bonus palier Or', v_bonus);
    end if;
  end loop;

  return v_made;
end $$;

revoke all on function wedo.build_monthly_payouts(date) from public, anon, authenticated;
grant execute on function wedo.compute_monthly_tier(int) to authenticated;
