-- WeDo migration 014 — WEDO-AMB-03: referral codes & attribution.
-- SECURITY DEFINER RPCs (WeDo pattern, équivalent service-role : bypass RLS pour
-- écrire, mais validation d'identité via auth.uid()). Idempotentes.
--
-- Éligibilité ambassadrice : ≥1 tontine menée jusqu'à Completed (créatrice) + charte
-- acceptée. (Le brief mentionne "aucun litige ouvert" — pas de table litige dans WeDo
-- pour l'instant, critère non bloquant ici ; à brancher si un modèle de litige arrive.)

-- Code court non ambigu (sans I/L/O/0/1), 6 caractères, unique.
create or replace function wedo.generate_ambassador_code()
returns text language plpgsql set search_path = wedo as $$
declare alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; v_code text;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from wedo.referral_codes rc where rc.code = v_code);
  end loop;
  return v_code;
end $$;

-- A mené ≥1 tontine jusqu'au bout (créatrice).
create or replace function wedo.ambassador_is_eligible(p_user uuid)
returns boolean language sql stable security definer set search_path = wedo as $$
  select exists (
    select 1 from wedo.tontines t
    where t.creator_id = p_user and t.status = 'Completed'
  );
$$;

-- Accepter la charte (onboarding). Crée le profil si besoin, déclenche l'activation auto.
create or replace function wedo.accept_ambassador_charter()
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare v_user uuid := auth.uid(); v_id uuid; v_eligible boolean;
begin
  if v_user is null then return jsonb_build_object('success',false,'error','Non authentifié'); end if;
  insert into wedo.ambassador_profiles(user_id, charter_accepted_at)
    values (v_user, now())
    on conflict (user_id) do update set charter_accepted_at = coalesce(wedo.ambassador_profiles.charter_accepted_at, now())
    returning id into v_id;
  v_eligible := wedo.ambassador_is_eligible(v_user);
  -- Activation auto si éligible + charte acceptée.
  if v_eligible then
    update wedo.ambassador_profiles
      set is_ambassador = true, activated_at = coalesce(activated_at, now())
      where id = v_id;
  end if;
  return jsonb_build_object('success', true, 'eligible', v_eligible, 'isAmbassador', v_eligible);
end $$;

-- Générer (ou récupérer) mon code de parrainage. Idempotent : 1 code par ambassadrice.
create or replace function wedo.generate_referral_code()
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare v_user uuid := auth.uid(); v_id uuid; v_code text; v_eligible boolean; v_charter timestamptz;
begin
  if v_user is null then return jsonb_build_object('success',false,'error','Non authentifié'); end if;

  select id, charter_accepted_at into v_id, v_charter from wedo.ambassador_profiles where user_id = v_user;
  if v_id is null then
    return jsonb_build_object('success',false,'need','CHARTER','error','Acceptez d''abord la charte ambassadrice.');
  end if;
  if v_charter is null then
    return jsonb_build_object('success',false,'need','CHARTER','error','Charte ambassadrice non acceptée.');
  end if;

  v_eligible := wedo.ambassador_is_eligible(v_user);
  if not v_eligible then
    return jsonb_build_object('success',false,'need','ELIGIBILITY',
      'error','Menez au moins une tontine jusqu''au bout pour devenir ambassadrice.');
  end if;

  update wedo.ambassador_profiles
    set is_ambassador = true, activated_at = coalesce(activated_at, now()) where id = v_id;

  -- Idempotent : renvoyer le code existant si déjà émis.
  select code into v_code from wedo.referral_codes where ambassador_id = v_id;
  if v_code is null then
    v_code := wedo.generate_ambassador_code();
    insert into wedo.referral_codes(code, ambassador_id) values (v_code, v_id)
      on conflict (ambassador_id) do nothing;
    select code into v_code from wedo.referral_codes where ambassador_id = v_id; -- relit en cas de course
  end if;

  return jsonb_build_object('success', true, 'code', v_code);
end $$;

-- Rattacher la filleule (auth.uid()) à un code. Un seul parrain ; pas d'auto-parrainage.
create or replace function wedo.attach_referral(p_code text)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare v_user uuid := auth.uid(); v_amb uuid; v_amb_user uuid; v_code text;
begin
  if v_user is null then return jsonb_build_object('success',false,'error','Non authentifié'); end if;
  v_code := upper(btrim(p_code));

  select rc.ambassador_id, ap.user_id into v_amb, v_amb_user
    from wedo.referral_codes rc join wedo.ambassador_profiles ap on ap.id = rc.ambassador_id
    where rc.code = v_code;
  if v_amb is null then
    return jsonb_build_object('success',false,'error','Code de parrainage invalide.');
  end if;

  -- Pas d'auto-parrainage (même personne).
  if v_amb_user = v_user then
    return jsonb_build_object('success',false,'error','Auto-parrainage impossible.');
  end if;

  -- Un seul parrain : si déjà rattachée, on ignore (le 1er fait foi).
  if exists (select 1 from wedo.referrals where referee_user_id = v_user) then
    return jsonb_build_object('success',true,'already',true);
  end if;

  insert into wedo.referrals(ambassador_id, referee_user_id, code_used)
    values (v_amb, v_user, v_code)
    on conflict (referee_user_id) do nothing;

  return jsonb_build_object('success', true);
end $$;

revoke all on function wedo.accept_ambassador_charter() from public, anon;
revoke all on function wedo.generate_referral_code() from public, anon;
revoke all on function wedo.attach_referral(text) from public, anon;
grant execute on function wedo.accept_ambassador_charter() to authenticated;
grant execute on function wedo.generate_referral_code() to authenticated;
grant execute on function wedo.attach_referral(text) to authenticated;
