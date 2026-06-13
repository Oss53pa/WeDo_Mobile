-- WeDo migration 013 — WEDO-AMB-02: reward calculation, DB-side (bigint, no float).
-- Mirror of src/utils/money.ts ambassadorReward. Reward = rate% of the activation
-- fee, rounded to the FCFA half up: (fee*rate + 50) / 100. The rate comes from
-- program_settings (active, latest version) — never hardcoded in business logic.

create or replace function wedo.active_program_settings()
returns wedo.program_settings
language sql stable security definer set search_path = wedo as $$
  select * from wedo.program_settings where active order by version desc limit 1;
$$;

create or replace function wedo.ambassador_reward_fcfa(p_fee bigint)
returns bigint
language plpgsql stable security definer set search_path = wedo as $$
declare v_rate bigint;
begin
  if p_fee is null or p_fee < 0 then return 0; end if;
  select reward_rate_pct into v_rate from wedo.active_program_settings();
  v_rate := coalesce(v_rate, 10);
  -- half up, denominator 100 — pure integer arithmetic
  return (p_fee * v_rate + 50) / 100;
end $$;

grant execute on function wedo.active_program_settings() to authenticated;
grant execute on function wedo.ambassador_reward_fcfa(bigint) to authenticated;
