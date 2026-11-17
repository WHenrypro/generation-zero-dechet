# Génération Z(éro déchet) — MVP pédagogique

## Démarrage

Ouvrir `sprint4/index.html` dans un navigateur avec connexion Internet (Leaflet et les tuiles OpenStreetMap sont chargés via CDN). Pour un serveur local, lancer depuis ce dossier :

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000/sprint4/`.

Chaque dossier `sprint1` à `sprint4` est **autonome**. Le dossier racine correspond au Sprint 4. Les versions représentent des **jalons de démonstration**, et non quatre dépôts Git distincts. Le même code source est configuré par `data-sprint` sur `<body>`.

## Découpage par sprint (proposition)

| Sprint | Incrément démontrable | US / tâches |
|---|---|---|
| 1 | Carte de la rade, données de démonstration, zones rouges et détails | T1 (structure), T3, US2, US3, US4 |
| 2 | Signalement d'une nouvelle zone par formulaire et coordonnées | US21 **partiel** (sans photo GPS) |
| 3 | Profil pseudo et choix/début de ramassage (statut orange) | US1 simplifiée, US5, US8 (Should) |
| 4 | Photos avant/après, publication et statut vert | US7, US9, US10, US11 |

## Important : écarts par rapport au backlog

- **T2** : stockage **localStorage** dans le navigateur ; ce n'est PAS une base de données serveur. Les données ne sont pas partagées entre utilisateurs. La capacité de stockage est limitée.
- **US21** : la saisie de photo de signalement et l'extraction GPS EXIF ne sont pas implémentées ; on renseigne ou sélectionne les coordonnées sur la carte.
- **US1** : profil pseudo seulement, pas d'authentification réelle.
- **US7/US9** : import de fichiers images, caméra mobile possible selon le navigateur, sans capture vidéo intégrée.
- **US11** : passage au vert immédiatement après publication, sans modération.
- **US6** (inscription collective), **US16** (BeReal), **US18** (compteur d'impact détaillé), **US22** (création d'événement), coefficients de marée : non implémentés car classés Should Have.
- **T1 hébergement** : fichiers prêts à déployer sur un hébergement statique (GitHub Pages, Netlify, etc.), mais non déployés automatiquement.
- Les quatre zones initiales sont des **données fictives de démonstration**. Ne pas les présenter comme de véritables signalements.

## Démonstration Sprint 4

1. Ouvrir la carte, cliquer sur un point rouge et lire ses détails.
2. Signaler une nouvelle zone (nom + coordonnées via clic sur carte).
3. Dans « Mon profil », enregistrer le pseudo « Léa ».
4. Sélectionner la zone, cliquer sur « Choisir cette zone » ; le statut devient orange.
5. Importer une photo avant et une photo après, puis publier.
6. Vérifier que le marqueur est vert et que le compteur de zones nettoyées augmente.
7. Recharger la page : les informations sont conservées dans ce navigateur.

## Répartition de travail possible

- Développeur A : carte, géolocalisation, marqueurs.
- Développeur B : données, formulaires de signalement, persistance.
- Développeur C : pseudo, parcours de ramassage, statuts.
- Développeur D : photos, publication, tests, ergonomie.

## Limites et précautions

Ce prototype ne doit pas servir à organiser de véritables opérations de ramassage. Pas de vérification des signalements, pas de validation des photos, pas de gestion des risques liés aux marées. Les coordonnées sont approximatives et illustratives. `localStorage` est adapté à la démo, pas à une application publique.
