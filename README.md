# Génération Z(éro déchet) — Prototype aligné sur Jira

## Démarrage
Ouvrir `sprint1/index.html` via **VS Code → Live Server** (ou un serveur HTTP local), puis les versions suivantes.
Internet nécessaire pour Leaflet et le fond de carte OpenStreetMap. Aucun compte ni clé API nécessaires.

## Sprints (cumulatifs)

| Sprint | Tickets Jira | Points | Résultat démontrable |
|---|---|---:|---|
| **1** | GZD-6 T1 (3), GZD-7 T2 (5), GZD-8 T3 (2), GZD-9 US2 (3) | **13** | Carte, zones de démo rouges/orange/vertes, IndexedDB et stockage de photos prêts |
| **2** | GZD-10 US21 (8), GZD-11 US3 (2), GZD-12 US4 (3) | **13** | Signalement avec photo, coordonnées, type, quantité ; marqueur rouge et fiche détaillée |
| **3** | GZD-13 US1 (3), GZD-14 US5 (2), GZD-15 US7 (3), GZD-16 US9 (2), GZD-17 US10 (3), GZD-18 US11 (1) | **14** | Profil pseudo, sélection d’une zone, photos avant/après, publication et zone verte |
| **4** | GZD-19 US16 (8), GZD-20 US18 (3) | **11** | Défi chronométré 10 minutes et compteurs d’impact |

**Total planifié : 51 points.** Les autres tickets GZD-21 à GZD-32 restent dans le backlog et ne sont pas développés.

## Architecture / limites explicites
- HTML, CSS, JavaScript, Leaflet, OpenStreetMap.
- **IndexedDB** : vraie base de données **locale au navigateur** avec stores `zones`, `photos` (Blob) et `settings`. Pas de synchronisation multi-utilisateurs ni de backend distant. Ceci est une **simplification de T2** : si le PO attend un stockage partagé, T2 n’est pas complètement satisfaite.
- Les quatre dossiers sont des **versions autonomes** et partagent la même base IndexedDB lorsqu’ils sont ouverts sous le même domaine/port Live Server. Une action faite dans un sprint peut donc apparaître dans un autre. Utiliser « Réinitialiser » pour repartir des données de démo.
- Sprint 1 : 4 zones fictives avec 2 rouges, 1 orange et 1 verte. Les couleurs illustrent les états ; US3 et US4 sont formalisées dans le Sprint 2.
- Sprint 2 : la photo du signalement est obligatoire et sauvegardée dans IndexedDB ; coordonnées GPS renseignées ou choisies sur la carte (pas de géocodage).
- Sprint 3 : le statut « en cours » est une **étape interne** nécessaire pour terminer le parcours, sans interface avancée US8 (ticket laissé dans le backlog). Pas d’authentification sécurisée, validation automatique de la publication, aucun système de modération.
- Sprint 4 : le défi de 10 minutes est lancé **manuellement** (pas de notification de proximité). Le compteur utilise les zones de démonstration et les nettoyages locaux. Le défi est réussi si la publication est effectuée avant l’échéance. Les photos ne sont pas prises automatiquement : sélection/capture via l’appareil.
- Le projet est destiné à la démonstration, pas à un lancement réel. Pas de garantie de sécurité des signalements, de vérification des ramassages ou de synchronisation.
- **T1** : fichiers prêts, mais la création du dépôt Git et son hébergement restent des actions à réaliser par l’équipe. Live Server est un serveur de développement local, pas un hébergement public.

## Utilisation / tests manuels
1. Sprint 1 : voir la carte de Brest, les quatre zones et leurs statuts ; recharger et constater leur présence.
2. Sprint 2 : onglet « Signaler » → remplir nom, type, quantité, photo, latitude/longitude (ou cliquer « Choisir sur la carte ») → publier → voir un nouveau marqueur rouge et sa fiche.
3. Sprint 3 : « Mon profil » → pseudo → choisir une zone rouge → commencer → sélectionner photos avant/après → publier → marqueur vert ; recharger et vérifier la persistance.
4. Sprint 4 : choisir une zone rouge, démarrer un ramassage → lancer le défi → publier avant 10 min → consulter l’onglet « Impact ».

## Git
Chaque sprint correspond à un incrément. Pour montrer une vraie progression, faites des commits/PRs au fil de la réalisation. Les dossiers séparés sont des snapshots pédagogiques ; ils ne prouvent pas à eux seuls que les sprints ont été développés dans cet ordre.
