-- WeDo migration 021 — KYC manuel (gratuit) : CNI recto/verso + selfie -> revue humaine -> palier P2.
-- Bucket privé wedo-kyc (chacun n'accède qu'à son dossier auth.uid()/...). Soumission via RPC,
-- décision réservée au service role (back-office wedo-ambassador-admin). Approbation -> personnes.palier=2.

insert into storage.buckets (id, name, public)
  values ('wedo-kyc', 'wedo-kyc', false)
  on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='wedo_kyc_insert_own') then
    create policy wedo_kyc_insert_own on storage.objects for insert to authenticated
      with check (bucket_id = 'wedo-kyc' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='wedo_kyc_select_own') then
    create policy wedo_kyc_select_own on storage.objects for select to authenticated
      using (bucket_id = 'wedo-kyc' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='wedo_kyc_update_own') then
    create policy wedo_kyc_update_own on storage.objects for update to authenticated
      using (bucket_id = 'wedo-kyc' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

create table if not exists wedo.kyc_submissions (
  user_id        uuid primary key references wedo.profiles(id) on delete cascade,
  cni_number     text,
  cni_recto_path text,
  cni_verso_path text,
  selfie_path    text,
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason         text,
  reviewer       uuid,
  submitted_at   timestamptz not null default now(),
  reviewed_at    timestamptz
);
alter table wedo.kyc_submissions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='wedo' and tablename='kyc_submissions' and policyname='kyc_select_own') then
    create policy kyc_select_own on wedo.kyc_submissions for select to authenticated using (user_id = auth.uid());
  end if;
end $$;

create or replace function wedo.submit_kyc(p_cni_number text, p_recto text, p_verso text, p_selfie text)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then return jsonb_build_object('success',false,'error','Non authentifié'); end if;
  insert into wedo.kyc_submissions(user_id, cni_number, cni_recto_path, cni_verso_path, selfie_path, status, submitted_at, reviewed_at, reason)
    values (v_user, p_cni_number, p_recto, p_verso, p_selfie, 'pending', now(), null, null)
    on conflict (user_id) do update set
      cni_number = excluded.cni_number, cni_recto_path = excluded.cni_recto_path,
      cni_verso_path = excluded.cni_verso_path, selfie_path = excluded.selfie_path,
      status = 'pending', submitted_at = now(), reviewed_at = null, reason = null;
  return jsonb_build_object('success', true, 'status', 'pending');
end $$;

create or replace function wedo.kyc_decision(p_user uuid, p_decision text, p_reason text default null, p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path = wedo as $$
declare v_new text;
begin
  if p_decision = 'approve' then v_new := 'approved';
  elsif p_decision = 'reject' then v_new := 'rejected';
  else return jsonb_build_object('success',false,'error','Décision invalide'); end if;
  update wedo.kyc_submissions
    set status = v_new, reason = p_reason, reviewer = p_actor, reviewed_at = now()
    where user_id = p_user;
  if v_new = 'approved' then
    update wedo.personnes set palier = greatest(coalesce(palier,0), 2)
      where id = (select personne_id from wedo.comptes where profile_id = p_user);
  end if;
  return jsonb_build_object('success', true, 'status', v_new);
end $$;

revoke all on function wedo.submit_kyc(text,text,text,text) from public, anon;
grant execute on function wedo.submit_kyc(text,text,text,text) to authenticated;
revoke all on function wedo.kyc_decision(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function wedo.kyc_decision(uuid,text,text,uuid) to service_role;
