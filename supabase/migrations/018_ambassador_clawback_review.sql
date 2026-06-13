-- WeDo migration 018 — WEDO-AMB-07: clawback & file de review fraude.
-- File review : reward_events.status='review' (posé par la qualification anti-collusion
-- ou PROPH3T+humain). Décision humaine : validate (->accrued) / reject (->void).
-- Clawback : une récompense déjà payée et frauduleuse passe 'clawed_back' ; le montant
-- devient une DETTE imputée sur les récompenses futures (solde négatif autorisé jusqu'à
-- apurement). Tout est tracé dans ambassador_audit.

create table if not exists wedo.ambassador_audit (
  id              uuid primary key default gen_random_uuid(),
  ambassador_id   uuid references wedo.ambassador_profiles(id) on delete set null,
  reward_event_id uuid references wedo.reward_events(id) on delete set null,
  action          text not null,           -- review_validate | review_reject | clawback
  amount_fcfa     bigint not null default 0,
  reason          text,
  actor           uuid,
  created_at      timestamptz not null default now()
);

create table if not exists wedo.ambassador_adjustments (
  id              uuid primary key default gen_random_uuid(),
  ambassador_id   uuid not null references wedo.ambassador_profiles(id) on delete cascade,
  reward_event_id uuid references wedo.reward_events(id) on delete set null,
  amount_fcfa     bigint not null,          -- négatif = dette clawback
  remaining_fcfa  bigint not null,          -- dette restant à apurer (>=0)
  reason          text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_amb_adj_ambassador on wedo.ambassador_adjustments (ambassador_id) where remaining_fcfa > 0;

alter table wedo.ambassador_audit       enable row level security;
alter table wedo.ambassador_adjustments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='ambassador_audit' and policyname='aa_select') then
    create policy aa_select on wedo.ambassador_audit for select to authenticated
      using (ambassador_id in (select id from wedo.ambassador_profiles where user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='ambassador_adjustments' and policyname='adj_select') then
    create policy adj_select on wedo.ambassador_adjustments for select to authenticated
      using (ambassador_id in (select id from wedo.ambassador_profiles where user_id = auth.uid()));
  end if;
end $$;

-- Décision sur un reward_event en review.
create or replace function wedo.ambassador_review_decision(p_event uuid, p_decision text, p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare re wedo.reward_events%rowtype; v_new text;
begin
  select * into re from wedo.reward_events where id = p_event for update;
  if not found then return jsonb_build_object('success',false,'error','Récompense introuvable'); end if;
  if re.status <> 'review' then return jsonb_build_object('success',false,'error','Récompense pas en review'); end if;
  if p_decision = 'validate' then v_new := 'accrued';
  elsif p_decision = 'reject' then v_new := 'void';
  else return jsonb_build_object('success',false,'error','Décision invalide'); end if;

  update wedo.reward_events set status = v_new where id = p_event;
  insert into wedo.ambassador_audit(ambassador_id, reward_event_id, action, amount_fcfa, reason, actor)
    values (re.ambassador_id, p_event, 'review_'||p_decision, re.reward_fcfa, null, p_actor);
  return jsonb_build_object('success',true,'status',v_new);
end $$;

-- Clawback : annule une récompense (fraude avérée) et impute la dette si déjà payée.
create or replace function wedo.ambassador_clawback(p_event uuid, p_reason text, p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare re wedo.reward_events%rowtype; v_debt boolean := false;
begin
  select * into re from wedo.reward_events where id = p_event for update;
  if not found then return jsonb_build_object('success',false,'error','Récompense introuvable'); end if;
  if re.status = 'clawed_back' then return jsonb_build_object('success',true,'already',true); end if;

  -- Si déjà versée, créer une dette à récupérer sur les récompenses futures.
  if re.status = 'paid' then
    insert into wedo.ambassador_adjustments(ambassador_id, reward_event_id, amount_fcfa, remaining_fcfa, reason)
      values (re.ambassador_id, p_event, -re.reward_fcfa, re.reward_fcfa, p_reason);
    v_debt := true;
  end if;

  update wedo.reward_events set status = 'clawed_back' where id = p_event;
  insert into wedo.ambassador_audit(ambassador_id, reward_event_id, action, amount_fcfa, reason, actor)
    values (re.ambassador_id, p_event, 'clawback', re.reward_fcfa, p_reason, p_actor);
  return jsonb_build_object('success',true,'debtCreated',v_debt,'amount',re.reward_fcfa);
end $$;

-- build_monthly_payouts v2 : récupère la dette de clawback (oldest-first) sur la base.
create or replace function wedo.build_monthly_payouts(
  p_period date default (date_trunc('month', current_date - interval '1 month'))::date
)
returns int language plpgsql security definer set search_path = wedo as $$
declare
  s wedo.program_settings; v_start timestamptz; v_end timestamptz;
  r record; v_tier text; v_bonus bigint; v_capped bigint; v_total bigint;
  v_payout uuid; v_made int := 0; e record;
  v_debt bigint; v_recover bigint; v_left bigint; adj record; v_net bigint;
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
    v_tier  := wedo.compute_monthly_tier(r.cnt::int);
    v_bonus := case when v_tier = 'or' then coalesce(s.bonus_or_fcfa, 0) else 0 end;

    -- Récupération de la dette de clawback (oldest-first), plafonnée à la base.
    select coalesce(sum(remaining_fcfa),0) into v_debt
      from wedo.ambassador_adjustments where ambassador_id = r.ambassador_id and remaining_fcfa > 0;
    v_recover := least(r.base, v_debt);
    v_net := r.base - v_recover;

    v_capped := least(v_net, coalesce(s.plafond_mensuel_fcfa, v_net));  -- plafond sur la base nette
    v_total  := v_capped + v_bonus;

    insert into wedo.payouts(ambassador_id, period_month, tier, base_fcfa, bonus_fcfa, total_fcfa, status)
      values (r.ambassador_id, p_period, v_tier, v_capped, v_bonus, v_total, 'pending')
      on conflict (ambassador_id, period_month) do nothing
      returning id into v_payout;
    if v_payout is null then continue; end if;
    v_made := v_made + 1;

    for e in
      select id, tontine_id, reward_fcfa from wedo.reward_events
      where ambassador_id = r.ambassador_id and status = 'accrued'
        and qualified_at >= v_start and qualified_at < v_end
    loop
      insert into wedo.payout_items(payout_id, reward_event_id, label, amount_fcfa)
        values (v_payout, e.id, 'Récompense tontine '||left(e.tontine_id::text,8), e.reward_fcfa);
      update wedo.reward_events set status = 'paid' where id = e.id;
    end loop;

    -- Apurer la dette (oldest-first) du montant récupéré.
    if v_recover > 0 then
      v_left := v_recover;
      for adj in
        select id, remaining_fcfa from wedo.ambassador_adjustments
        where ambassador_id = r.ambassador_id and remaining_fcfa > 0 order by created_at
      loop
        exit when v_left <= 0;
        if adj.remaining_fcfa <= v_left then
          update wedo.ambassador_adjustments set remaining_fcfa = 0 where id = adj.id;
          v_left := v_left - adj.remaining_fcfa;
        else
          update wedo.ambassador_adjustments set remaining_fcfa = remaining_fcfa - v_left where id = adj.id;
          v_left := 0;
        end if;
      end loop;
      insert into wedo.payout_items(payout_id, reward_event_id, label, amount_fcfa)
        values (v_payout, null, 'Récupération clawback', -v_recover);
    end if;

    if v_capped < v_net then
      insert into wedo.payout_items(payout_id, reward_event_id, label, amount_fcfa)
        values (v_payout, null, 'Ajustement plafond mensuel', v_capped - v_net);
    end if;
    if v_bonus > 0 then
      insert into wedo.payout_items(payout_id, reward_event_id, label, amount_fcfa)
        values (v_payout, null, 'Bonus palier Or', v_bonus);
    end if;
  end loop;

  return v_made;
end $$;

revoke all on function wedo.ambassador_review_decision(uuid,text,uuid) from public, anon, authenticated;
revoke all on function wedo.ambassador_clawback(uuid,text,uuid) from public, anon, authenticated;
revoke all on function wedo.build_monthly_payouts(date) from public, anon, authenticated;
grant execute on function wedo.ambassador_review_decision(uuid,text,uuid) to service_role;
grant execute on function wedo.ambassador_clawback(uuid,text,uuid) to service_role;
