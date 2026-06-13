-- WeDo migration 009 — optional pseudonym for anonymity between members.
-- Applied to project easoqoswtmvtkdwwkqtc (schema wedo).
--
-- full_name stays the REAL legal name (KYC / EME / Atlas Studio keep it).
-- nom_public = what other members see = the pseudo if set, else the real name.
-- Member-facing queries select nom_public (NOT full_name), so the legal name
-- never leaves the DB for other users.

alter table wedo.profiles
  add column if not exists display_name text;

alter table wedo.profiles
  add column if not exists nom_public text
    generated always as (coalesce(nullif(btrim(display_name), ''), full_name)) stored;
