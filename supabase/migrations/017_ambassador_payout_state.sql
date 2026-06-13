-- WeDo migration 017 — WEDO-AMB-06: machine d'état du versement (réconciliation).
-- Le versement part du COMPTE D'EXPLOITATION (côté PSP), jamais du séquestre cantonné :
-- aucune de ces fonctions ne touche wedo.sequestres/mouvements. Idempotent sur la réf :
-- rejouer un webhook ne double pas le versement.

-- Marque un payout 'sent' (réconciliation succès). Idempotent.
create or replace function wedo.ambassador_mark_payout_sent(
  p_payout uuid, p_provider text, p_ref text
)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare po wedo.payouts%rowtype;
begin
  select * into po from wedo.payouts where id = p_payout for update;
  if not found then return jsonb_build_object('success',false,'error','Payout introuvable'); end if;
  if po.status = 'sent' then
    return jsonb_build_object('success',true,'already',true,'momoRef',po.momo_ref);
  end if;
  update wedo.payouts
    set status='sent', momo_provider=p_provider, momo_ref=p_ref, sent_at=now()
    where id = p_payout and status in ('pending','failed');
  -- Récompenses de ce payout : restent 'paid' (déjà posées à la construction).
  return jsonb_build_object('success',true,'momoRef',p_ref);
end $$;

-- Marque un payout 'failed' (reprise possible : un nouvel executePayout repassera).
create or replace function wedo.ambassador_mark_payout_failed(p_payout uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = wedo as $$
begin
  update wedo.payouts set status='failed'
    where id = p_payout and status in ('pending','failed');
  return jsonb_build_object('success',true,'reason',p_reason);
end $$;

revoke all on function wedo.ambassador_mark_payout_sent(uuid,text,text) from public, anon, authenticated;
revoke all on function wedo.ambassador_mark_payout_failed(uuid,text) from public, anon, authenticated;
grant execute on function wedo.ambassador_mark_payout_sent(uuid,text,text) to service_role;
grant execute on function wedo.ambassador_mark_payout_failed(uuid,text) to service_role;
