-- WeDo migration 026 — détection des impayés v2 : relie le cron au module défauts.
-- Ajoute : pénalité monétaire configurable (bigint, plafonnée), member_state,
-- auto-couverture par caution (l'avance devient une dette), relances J+1/J+2 in-app.
-- Le job cron `wedo-detecter-defauts` (quotidien 6h) appelle déjà detecter_defauts().

alter table wedo.contributions
  add column if not exists reminders_sent smallint not null default 0,
  add column if not exists last_reminder_on date;

create or replace function wedo.detecter_defauts()
returns integer language plpgsql security definer set search_path to 'wedo','extensions' as $function$
declare
  r record; n int := 0; v_personne uuid; v_bps int; v_penalty bigint;
  v_caution wedo.cautions%rowtype;
begin
  -- 1) Cotisations encore Pending au-delà du délai de grâce
  for r in
    select c.id, c.user_id, c.tontine_id, c.round, c.due_date, c.amount,
           t.grace_period_days, t.creator_id, t.late_penalty_percent
    from wedo.contributions c
    join wedo.tontines t on t.id = c.tontine_id
    where c.status = 'Pending'
      and now()::date > (c.due_date + (coalesce(t.grace_period_days,0) || ' days')::interval)
  loop
    select personne_id into v_personne from wedo.comptes where profile_id = r.user_id limit 1;

    -- 1a) Auto-couverture par caution si elle existe et suffit (brief §6.1)
    select * into v_caution from wedo.cautions
      where tontine_id=r.tontine_id and user_id=r.user_id and status='held';
    if found and v_caution.amount_fcfa >= r.amount then
      update wedo.cautions set amount_fcfa = amount_fcfa - r.amount,
        status = case when amount_fcfa - r.amount <= 0 then 'consumed' else 'held' end
        where id = v_caution.id;
      update wedo.contributions set status='Paid', paid_date=now(), covered_by='caution' where id=r.id;
      insert into wedo.debts(tontine_id,user_id,principal_fcfa,proof_hash)
        values (r.tontine_id, r.user_id, r.amount,
          encode(digest(r.user_id::text||'|'||r.tontine_id::text||'|avance|'||r.amount::text||'|'||extract(epoch from now())::text,'sha256'),'hex'));
      update wedo.tontine_members set member_state='en_retard'
        where tontine_id=r.tontine_id and user_id=r.user_id and member_state='actif';
      if v_personne is not null then perform wedo.appliquer_score(v_personne, -5, 'Retard couvert par caution', r.tontine_id); end if;
      insert into wedo.notifications (user_id, title, body, type, related_id) values
        (r.user_id, 'Cotisation couverte par votre caution',
         'Tour '||r.round||' : votre caution a couvert la cotisation. Vous devez régulariser l''avance.',
         'PaymentLate', r.tontine_id),
        (r.creator_id, 'Cotisation couverte (caution)',
         'Un retard au tour '||r.round||' a été couvert automatiquement par la caution du membre.',
         'System', r.tontine_id);
      n := n + 1;
      continue;
    end if;

    -- Pénalité de retard configurable (bigint, demi-sup, plafonnée au montant dû)
    v_bps := (coalesce(r.late_penalty_percent,0) * 100)::int;  -- pourcent(2 déc.) -> bps
    v_penalty := least((r.amount * v_bps + 5000) / 10000, r.amount);

    if now()::date > (r.due_date + ((coalesce(r.grace_period_days,0)+7) || ' days')::interval) then
      -- 1b) Défaut de cotisation (jamais payé, au-delà de grâce + 7 j)
      update wedo.contributions set status='Failed',
        penalty_amount = case when penalty_amount = 0 then v_penalty else penalty_amount end where id=r.id;
      update wedo.tontine_members set member_state='en_retard'
        where tontine_id=r.tontine_id and user_id=r.user_id and member_state='actif';
      if v_personne is not null then
        update wedo.scores set defauts = defauts + 1 where personne_id = v_personne;
        perform wedo.appliquer_score(v_personne, -15, 'Défaut de cotisation', r.tontine_id);
      end if;
      insert into wedo.notifications (user_id, title, body, type, related_id) values
        (r.user_id, 'Défaut constaté',
         'Cotisation tour '||r.round||' en défaut. Impact sur votre score de fiabilité.',
         'PaymentLate', r.tontine_id),
        (r.creator_id, 'Membre en défaut de cotisation',
         'Un membre n''a pas cotisé (tour '||r.round||') au-delà du délai.', 'System', r.tontine_id);
    else
      -- 1c) Retard
      update wedo.contributions set status='Late',
        penalty_amount = case when penalty_amount = 0 then v_penalty else penalty_amount end,
        reminders_sent = 1, last_reminder_on = now()::date where id=r.id;
      update wedo.tontine_members set member_state='en_retard'
        where tontine_id=r.tontine_id and user_id=r.user_id and member_state='actif';
      if v_personne is not null then
        update wedo.scores set retards = retards + 1 where personne_id = v_personne;
        perform wedo.appliquer_score(v_personne, -5, 'Retard de cotisation', r.tontine_id);
      end if;
      insert into wedo.notifications (user_id, title, body, type, related_id) values
        (r.user_id, 'Cotisation en retard',
         'Cotisation tour '||r.round||' en retard. Merci de régulariser.', 'PaymentLate', r.tontine_id),
        (r.creator_id, 'Membre à risque',
         'Un membre est en retard (tour '||r.round||').', 'System', r.tontine_id);
    end if;
    n := n + 1;
  end loop;

  -- 2) Relances de suivi (J+1/J+2) pour les cotisations encore en retard, 1/jour, max 2
  for r in
    select c.id, c.user_id, c.tontine_id, c.round
    from wedo.contributions c
    where c.status = 'Late' and c.reminders_sent < 3
      and (c.last_reminder_on is null or c.last_reminder_on < now()::date)
  loop
    insert into wedo.notifications (user_id, title, body, type, related_id) values
      (r.user_id, 'Rappel : cotisation en attente',
       'Tour '||r.round||' toujours impayé. Régularisez pour préserver votre score.',
       'PaymentLate', r.tontine_id);
    update wedo.contributions set reminders_sent = reminders_sent + 1, last_reminder_on = now()::date where id = r.id;
    n := n + 1;
  end loop;

  return n;
end;
$function$;
