-- WeDo migration 003 — real invitation codes + join-by-code RPC
-- Applied to project easoqoswtmvtkdwwkqtc on 2026-06-12 (mcp migration `wedo_invite_codes`).
-- Every tontine gets a unique 8-char code (unambiguous alphabet, no I/L/O/0/1).
-- Joining by code goes through the same trust gate as wedo.rejoindre_tontine
-- (KYC P2 if séquestre, score_minimum, capacity, dedup).

alter table wedo.tontines add column if not exists invite_code text;

create or replace function wedo.generate_invite_code()
returns text
language plpgsql
set search_path to 'wedo'
as $$
declare
  -- unambiguous alphabet: no I, L, O, 0, 1
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from wedo.tontines where invite_code = code);
  end loop;
  return code;
end $$;

update wedo.tontines set invite_code = wedo.generate_invite_code() where invite_code is null;
alter table wedo.tontines alter column invite_code set default wedo.generate_invite_code();
alter table wedo.tontines alter column invite_code set not null;
create unique index if not exists tontines_invite_code_key on wedo.tontines (invite_code);

create or replace function wedo.rejoindre_tontine_par_code(p_code text, p_parrain_personne uuid default null)
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
  return wedo.rejoindre_tontine(v_id, p_parrain_personne)
    || jsonb_build_object('tontineId', v_id, 'tontineName', v_name);
end $$;

revoke all on function wedo.rejoindre_tontine_par_code(text, uuid) from public, anon;
grant execute on function wedo.rejoindre_tontine_par_code(text, uuid) to authenticated;
grant execute on function wedo.generate_invite_code() to authenticated;
