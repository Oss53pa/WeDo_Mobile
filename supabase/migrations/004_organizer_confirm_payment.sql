-- WeDo migration 004 — organizer confirms a member's cash / bank-transfer contribution
-- Applied to project easoqoswtmvtkdwwkqtc on 2026-06-12 (mcp `wedo_organizer_confirm_payment`).
--
-- Authz: caller must be the tontine creator, or an Active Admin/Treasurer member.
-- Delegates to wedo.confirmer_cotisation (escrow deposit + SHA-256 ledger append +
-- portable score + automatic distribuer_tour when the round closes), and settles the
-- linked transaction so the history stays consistent.

create or replace function wedo.confirmer_paiement_membre(p_contribution_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'wedo'
as $$
declare
  c wedo.contributions%rowtype;
  v_is_organizer boolean;
  v_result jsonb;
begin
  select * into c from wedo.contributions where id = p_contribution_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Cotisation introuvable.');
  end if;

  select exists (
    select 1 from wedo.tontines t where t.id = c.tontine_id and t.creator_id = auth.uid()
  ) or exists (
    select 1 from wedo.tontine_members m
    where m.tontine_id = c.tontine_id
      and m.user_id = auth.uid()
      and m.status = 'Active'
      and m.role in ('Admin', 'Treasurer')
  ) into v_is_organizer;

  if not v_is_organizer then
    return jsonb_build_object('success', false, 'error',
      'Seul l''organisateur ou le trésorier peut confirmer un paiement.');
  end if;

  if c.status = 'Paid' then
    return jsonb_build_object('success', true, 'already', true);
  end if;

  v_result := wedo.confirmer_cotisation(p_contribution_id);

  if c.transaction_id is not null then
    update wedo.transactions
      set status = 'Completed',
          external_transaction_id = coalesce(external_transaction_id, 'ORG-'||left(c.id::text, 8))
      where id = c.transaction_id;
  end if;

  return v_result;
end $$;

revoke all on function wedo.confirmer_paiement_membre(uuid) from public, anon;
grant execute on function wedo.confirmer_paiement_membre(uuid) to authenticated;
