-- ===========================================================================
-- Géné Z(éro) Déchet, schéma de la base (Sprint 1, tâche T2 : préparation)
-- ===========================================================================
--
-- À exécuter dans le tableau de bord Supabase : menu « SQL Editor », coller
-- ce fichier, lancer. Puis exécuter seed.sql pour les 15 zones de démo.
--
-- Deux tables :
--   zones         une zone de la rade, avec son état rouge / orange / vert ;
--   publications  un avant / après publié par une ramasseuse sur une zone.
--
-- gen_random_uuid() est fourni par PostgreSQL (version 13 et plus), pas
-- besoin d'extension.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Table zones
-- ---------------------------------------------------------------------------
create table if not exists public.zones (
  id           uuid primary key default gen_random_uuid(),
  code         text unique,                       -- identifiant court repris du GeoJSON de démo (z01 à z15), facultatif
  nom          text not null,
  commune      text not null,
  etat         text not null default 'rouge'
               check (etat in ('rouge', 'orange', 'vert')),
  type         text not null
               check (type in ('plastique', 'verre', 'métal', 'filets et cordages', 'mégots', 'autre')),
  quantite     text not null
               check (quantite in ('poignée', 'un sac', 'plusieurs sacs', 'encombrant')),
  lat          double precision not null check (lat between -90 and 90),
  lon          double precision not null check (lon between -180 and 180),
  description  text,
  signale_le   timestamptz not null default now(), -- date du signalement
  created_at   timestamptz not null default now()  -- date d'insertion en base
);

comment on table  public.zones is 'Zones de la rade de Brest signalées comme sales, avec leur état.';
comment on column public.zones.code is 'Identifiant court lisible (z01, z02...), repris du GeoJSON de démo. Peut rester vide pour les zones créées depuis l''appli.';
comment on column public.zones.etat is 'rouge = sale, orange = ramassage en cours, vert = nettoyée.';
comment on column public.zones.type is 'Type de déchet dominant : plastique, verre, métal, filets et cordages, mégots, autre.';
comment on column public.zones.quantite is 'Estimation : poignée, un sac, plusieurs sacs, encombrant.';
comment on column public.zones.lat is 'Latitude WGS84 (degrés décimaux).';
comment on column public.zones.lon is 'Longitude WGS84 (degrés décimaux), négative à l''ouest de Greenwich.';
comment on column public.zones.signale_le is 'Date et heure du signalement par la personne qui a vu la zone sale.';

create index if not exists zones_etat_idx on public.zones (etat);


-- ---------------------------------------------------------------------------
-- Table publications
-- ---------------------------------------------------------------------------
create table if not exists public.publications (
  id               uuid primary key default gen_random_uuid(),
  zone_id          uuid not null references public.zones (id) on delete cascade,
  pseudo           text not null,          -- pseudo choisi par la ramasseuse, pas de compte au MVP
  photo_avant_url  text,                   -- URL publique dans le bucket Storage « photos »
  photo_apres_url  text,                   -- idem, photo après ramassage
  publie_le        timestamptz not null default now()
);

comment on table  public.publications is 'Avant / après publiés par les ramasseuses. Une publication fait passer la zone au vert (logique côté appli, sprint 4).';
comment on column public.publications.pseudo is 'Pseudo libre, saisi dans l''appli. Pas de donnée personnelle obligatoire.';
comment on column public.publications.photo_avant_url is 'URL publique de la photo avant, stockée dans Supabase Storage.';
comment on column public.publications.photo_apres_url is 'URL publique de la photo après, stockée dans Supabase Storage.';

create index if not exists publications_zone_id_idx on public.publications (zone_id);


-- ---------------------------------------------------------------------------
-- Sécurité au niveau des lignes (RLS)
-- ---------------------------------------------------------------------------
-- Supabase recommande d'activer la RLS sur toute table exposée par l'API.
-- Le MVP n'a pas de comptes utilisateurs : tout le monde (rôle anon) peut
-- lire, ajouter une zone (Marc signale), changer l'état d'une zone et
-- publier un avant / après. Ces règles sont volontairement permissives et
-- devront être resserrées si l'appli sort du cadre du TP.
alter table public.zones        enable row level security;
alter table public.publications enable row level security;

create policy "lecture publique des zones"
  on public.zones for select using (true);

create policy "ajout public de zones"
  on public.zones for insert with check (true);

create policy "mise a jour publique des zones"
  on public.zones for update using (true) with check (true);

create policy "lecture publique des publications"
  on public.publications for select using (true);

create policy "ajout public de publications"
  on public.publications for insert with check (true);


-- ---------------------------------------------------------------------------
-- Bucket Storage « photos » (photos avant / après)
-- ---------------------------------------------------------------------------
-- À faire dans le tableau de bord Supabase, pas en SQL :
--   1. Menu « Storage » dans la barre latérale.
--   2. Créer un nouveau bucket, nom : photos.
--   3. Activer l'option « Public bucket » : les photos doivent être visibles
--      par tout le monde via leur URL. Enregistrer.
--   4. Pour que l'appli puisse envoyer des photos avec la clé anon, ajouter
--      sur ce bucket une politique qui autorise l'ajout de fichiers (INSERT)
--      pour le rôle anon. La lecture est déjà publique grâce à l'étape 3.
--      Les intitulés exacts des écrans sont à vérifier dans l'interface.
-- Les URL publiques des photos seront ensuite enregistrées dans
-- publications.photo_avant_url et publications.photo_apres_url.
