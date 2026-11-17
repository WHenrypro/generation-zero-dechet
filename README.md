# Géné Z(éro) Déchet, MVP « Zéro déchets en rade de Brest »

Dépôt du MVP construit pendant le TP Scrum du 17 novembre 2026 (M2 Gestion de projet, équipe NA-02).
Quatre sprints de 2 h, un incrément par sprint, tout tracé ici et sur le tableau Miro de l'équipe.

Tableau Miro (cadre du TP, un cadre par sprint, suivi de vélocité, concept produit) : https://miro.com/app/board/uXjVEPxM2B8=/
Tickets : projet « MVP » dans Linear, jalons Sprint 1 à 4.

## Le produit : un site et une app, reliés

Décision du planning du sprint 2 : le MVP a deux faces qui partagent les mêmes données.

- **Le site, la carte** (`site/`) : réalisé par l'équipe dans son dépôt https://github.com/WHenrypro/generation-zero-dechet (dossier `sprint4/`), recopié ici tel quel. La carte interactive de la rade, les zones en rouge / orange / vert, le signalement d'une zone sale avec photo et position (persona Marc, le riverain qui voit une plage sale), la fiche d'une zone.
- **L'app, le ramassage** (`app/`) : le concept façon BeReal (persona Léa, l'étudiante téléphone en main). Un pseudo, pas de compte. Elle choisit une zone rouge proche, prend une photo avant, ramasse, prend une photo après, publie. La zone passe au vert sur la carte et l'avant / après apparaît dans le feed.
- **Ce qui les relie** (`commun/`) : la couche de données de l'app (`store.js`, mode local ou Supabase), la réduction des photos, le pseudo. L'app renvoie vers le site de l'équipe (« Voir sur la carte ») et `app/?zone=ID` lance le ramassage d'une zone. Limite connue : le site de l'équipe stocke en IndexedDB, l'app en localStorage, le rapprochement des deux est à faire ensemble.

## Ce qu'il y a dans le dépôt

- `index.html` : page d'accueil, deux entrées (le site, l'app). C'est elle que GitHub Pages sert.
- `site/` : copie du site de l'équipe (Leaflet, OpenStreetMap, IndexedDB). Voir `site/README.md`. `logo.png` à la racine est le leur aussi.
- `app/` : l'app de ramassage. Voir `app/README.md`.
- `commun/` : `js/store.js` (zones et publications, localStorage par défaut, Supabase si `js/config.js` existe), `js/photos.js`, `js/session.js`, `data/zones.geojson` (15 zones de démo), `js/config.example.js`.
- `supabase/` : schéma SQL (zones, publications) et données de démo, pour passer en base partagée.
- `sprints/` : un fichier par sprint, même format que les cadres Miro (objectif, backlog, revue croisée, rétro, décisions), plus `sprints/README.md` (vélocité, journal des décisions). C'est la trace demandée par le TP.
- `scripts/fin-de-sprint.sh` : pose le tag `sprint-N` à la fin d'un sprint.
- `CONVENTIONS.md` : branches, commits, tags, règle de fusion.

Pas de build, pas de dépendance à installer : du HTML, du CSS et du JavaScript servis tels quels.

## Les 4 sprints

| Sprint | Horaire | Objectif | Contenu | Points |
|---|---|---|---|---|
| 1 | 8 h 05 à 9 h 55 | Une URL publique affiche l'appli avec les zones de démo en base | T1, T2, T3 | 10 |
| 2 | 10 h 10 à 12 h 00 | Marc peut signaler une zone sale et elle apparaît sur la carte | US2, US21 (site) | 11 |
| 3 | 14 h 00 à 15 h 50 | Léa se connecte, repère une zone rouge et décide d'y aller | US3, US4, US5 (site) ; US1, US5 (app) | 10 |
| 4 | 16 h 05 à 17 h 55 | Léa prouve son action et la zone passe au vert, démo complète | US7, US9, US10, US11 (app) | 9 |

Hypothèse de vélocité : 10 points par sprint. Elle est recalée après chaque sprint dans `sprints/README.md`.

## Lancer en local

Depuis la racine du dépôt (pas depuis `site/` ni `app/`) :

```
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000/ (accueil), http://localhost:8000/site/ (la carte) ou http://localhost:8000/app/ (l'app).

Pourquoi la racine : le site et l'app partagent le dossier `commun/` et le même stockage du navigateur. Servis depuis la même origine, ce que l'app publie se voit tout de suite sur la carte. Ouvrir un `index.html` directement en `file://` ne marche pas (chargement du GeoJSON bloqué).

Mode par défaut : « démo locale », tout reste dans le navigateur (localStorage). Pour partager les données entre plusieurs téléphones, créer un projet Supabase, exécuter `supabase/schema.sql` puis `supabase/seed.sql`, créer le bucket public `photos`, copier `commun/js/config.example.js` en `commun/js/config.js` et y mettre l'URL et la clé anon. Ce fichier est ignoré par git. Le mode Supabase est écrit mais n'a pas encore été testé sur un vrai projet.

## Parcours de démo (revue du sprint 4)

1. Sur le site, Marc appuie sur « Signaler », place le point sur la carte, ajoute une photo, choisit « plastique » et « un sac ». Un rond rouge apparaît, le compteur monte.
2. Sur l'app, Léa choisit un pseudo.
3. Elle voit les zones rouges de la plus proche à la plus loin et appuie sur « J'y vais ».
4. Photo avant, ramassage, photo après.
5. Elle publie : la publication arrive en haut du feed.
6. Sur le site, le rond de la zone est passé au vert et sa fiche montre l'avant / après.

## Déployer

GitHub Pages (branche `main`, dossier racine) suffit : la page d'accueil est à la racine, le site et l'app sont dans leurs dossiers. Netlify ou Vercel marchent aussi en déposant le dépôt entier.

## Hors du MVP, prévu ensuite

L'état orange (US8, la zone passe en orange quand quelqu'un dit « J'y vais ») et le minuteur façon BeReal de 10 minutes entre la photo avant et la photo après (US16) ne font pas partie des 13 Must. Ils sont décrits sur le Miro comme la suite logique.

## Usage de l'IA

Autorisé par le TP pour construire les incréments, pas pour les rapports ni pour remplacer les cérémonies. Le socle du dépôt, le site et l'app ont été générés avec Claude Code le 17 novembre 2026, puis relus et repris par l'équipe. Les commits concernés portent une ligne `Co-Authored-By`.
