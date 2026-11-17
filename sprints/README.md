# Suivi des 4 sprints

Même rôle que le cadre « TP · Suivi » du Miro. À remplir à la fin de chaque sprint.

## Vélocité

| Sprint | Objectif | Prévu | Terminé | Tag | Incrément (URL ou capture) | Équipe jumelle |
|---|---|---|---|---|---|---|
| 1 | Une URL publique affiche l'appli avec les zones de démo en base | 10 | 10 | `sprint-1` (`4308647`) | `site/` : carte et 15 zones | |
| 2 | Marc peut signaler une zone sale et elle apparaît sur la carte | 11 | 11 | `sprint-2` (`786f3c6`) | `site/` : signalement, compteur | |
| 3 | Léa se connecte, repère une zone rouge et décide d'y aller | 10 | 10 | `sprint-3` (`aaee070`) | `site/` liste et fiche, `app/` pseudo et « J'y vais » | |
| 4 | Léa prouve son action et la zone passe au vert, démo complète | 9 | 9 | `sprint-4` (`e2c2fba`) | `app/` photos, feed, zone verte | |

Hypothèse de départ : 10 points par sprint (étape 6 du TD1). Les colonnes « Terminé » reflètent l'état du dépôt (tout fusionné sur `main`) ; l'équipe les confirme ou les corrige en revue, et déplace les tags si besoin (`git tag -f`).

## Règles de décision prévues

- Sprint 1 fini en avance : commencer US2 (carte) pour soulager le sprint 2.
- Sprint 2 qui déborde : découper US21 en A (GPS et type) et B (photo et quantité), B peut glisser en sprint 3.
- Retard au début du sprint 4 : US4 (détail d'une zone) est le premier Must sacrifiable.
- Avance au sprint 4 : prendre US18 compteur d'impact (3 pts).
- Après le sprint 1 : recaler le plan sur la vélocité mesurée.

## Journal des décisions et des feedbacks

| Quand | Cérémonie | Décision ou feedback | Pourquoi | Qui |
|---|---|---|---|---|
| Avant le TP | Planning | Vélocité de départ fixée à 10 points par sprint | 4 devs × 2 h, US11 = 1 point ≈ 40 min | Équipe |
| Avant le TP | Planning | US21 (8 pts) se découpe en A puis B si le sprint 2 déborde | Plus grosse story, dans le sprint le plus chargé | PO |
| Sprint 2 | Planning | Le MVP se découpe en un site (carte interactive, signalement : `site/`) et une app (concept BeReal, avant/après, feed : `app/`), mêmes données (`commun/`), liens dans les deux sens | Deux usages : Marc signale depuis la carte, Léa ramasse et poste depuis son téléphone | Équipe |
| Sprint 2 | Réalisation | Charte graphique alignée sur le site publié par l'équipe sur GitHub (generation-zero-dechet) | Un seul produit, une seule identité pour la démo | Léane |
| Sprint 3 | Planning | US5 découpée en deux branches, site et app | Le bouton « J'y vais » vit sur le site, le ramassage dans l'app | Équipe |
| Sprint 4 | Planning | US8 (orange) et US16 (minuteur) restent hors MVP | 13 Must d'abord, le reste est décrit sur le Miro | PO |
| Sprint 4 | Réalisation | Une publication exemple dans le feed au premier lancement | Démo et revue croisée lisibles, pas d'écran vide | Léane |
| | | | | |
