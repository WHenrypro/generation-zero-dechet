# Géné Z(éro) Déchet, MVP « Zéro déchets en rade de Brest »

Dépôt du MVP construit pendant le TP Scrum du 17 novembre 2026 (M2 Gestion de projet, équipe NA-02).
Quatre sprints de 2 h, un incrément par sprint, tout tracé ici et sur le tableau Miro de l'équipe.

Tableau Miro (cadre du TP, un cadre par sprint, suivi de vélocité) : https://miro.com/app/board/uXjVEPxM2B8=/
Tickets : projet « MVP » dans Linear, jalons Sprint 1 à 4.

## Ce qu'il y a dans le dépôt

- `app/` : l'application, une page web statique (carte Leaflet de la rade, zones de démo). Pas de build, elle se déploie telle quelle.
- `supabase/` : schéma SQL de la base (zones, publications) et données de démo. Préparation de la tâche T2.
- `sprints/` : un fichier par sprint, même format que les cadres Miro (objectif, backlog, revue croisée, rétro, décisions). C'est la trace demandée par le TP.
- `scripts/fin-de-sprint.sh` : pose le tag `sprint-N` à la fin d'un sprint.
- `CONVENTIONS.md` : branches, commits, tags, règle de fusion.

## Les 4 sprints

| Sprint | Horaire | Objectif | Contenu | Points |
|---|---|---|---|---|
| 1 | 8 h 05 à 9 h 55 | Une URL publique affiche l'appli avec les zones de démo en base | T1, T2, T3 | 10 |
| 2 | 10 h 10 à 12 h 00 | Marc peut signaler une zone sale et elle apparaît sur la carte | US2, US21 | 11 |
| 3 | 14 h 00 à 15 h 50 | Léa se connecte, repère une zone rouge et décide d'y aller | US3, US4, US1, US5 | 10 |
| 4 | 16 h 05 à 17 h 55 | Léa prouve son action et la zone passe au vert, démo complète | US7, US9, US10, US11 | 9 |

Hypothèse de vélocité : 10 points par sprint. Elle sera recalée après le sprint 1.

## Lancer l'appli en local

```
cd app
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000. Ouvrir `index.html` directement ne marche pas (le chargement du GeoJSON est bloqué en `file://`).

## Déployer

Le fichier `index.html` à la racine redirige vers `app/`, donc GitHub Pages (branche `main`, dossier racine) fonctionne sans rien changer. Netlify ou Vercel marchent aussi (dossier racine ou `app/`). Voir `app/README.md`.

## Usage de l'IA

Autorisé par le TP pour construire les incréments, pas pour les rapports ni pour remplacer les cérémonies. Le squelette initial de `app/`, `supabase/` et de ce dépôt a été généré avec Claude Code le 17 novembre 2026 au matin, puis repris par l'équipe. Les commits concernés portent une ligne `Co-Authored-By`.
