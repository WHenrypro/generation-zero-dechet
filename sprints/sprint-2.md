# Sprint 2 · 10 h 10 à 12 h 00

Même format que le cadre « TP · Sprint 2 » du Miro. On remplit les deux au fil du sprint, le Miro pour l'équipe dans la salle, ce fichier pour la trace dans Git.

Objectif du sprint : « Marc peut signaler une zone sale et elle apparaît sur la carte. »

Prévu : 11 pts · Terminé : 11 pts (à 12 h 00)

## Sprint planning (10 h 10, 5 min)

Qui prend quoi (noms et items) :

- Binôme 1 :
- Binôme 2 :

Règle prévue (étape 6) : sprint le plus chargé. Si US21 déborde, la découper en A (GPS et type) puis B (photo et quantité), B peut glisser en sprint 3. Relire d'abord l'amélioration choisie en rétro du sprint 1.

## Sprint backlog

| Item | Points | Branche | État | Commit ou fusion |
|---|---|---|---|---|
| US2 – Afficher la carte de la rade | 3 | `s2/us2-carte` | terminé | `33753c4`, fusion `6ff443b` |
| US21 – Signaler une zone (photo, GPS, type, quantité) | 8 | `s2/us21-signaler` | terminé | `68aa35b, 0e363fd`, fusion `786f3c6` |

États possibles : à faire, en cours, terminé (testé, montrable, fusionné sur main).

## Réalisation (10 h 15 à 11 h 45, 1 h 30)

Décisions prises pendant le sprint :

- Le MVP se découpe en un site (carte, signalement) et une app (concept BeReal), reliés par `commun/` et des liens `?zone=ID` dans les deux sens.
- US21 : le formulaire (étape 1) puis la logique (étape 2) ont été faits en deux commits, comme prévu par la règle de découpage A/B.
- Charte graphique alignée sur le site déjà publié par l'équipe (dépôt GitHub generation-zero-dechet) : nom « Génération Z(éro déchet) », logo GZ, DM Sans et Outfit.

Blocages rencontrés et comment on les a levés :

- Le site et l'app avancent en parallèle : chacun sur ses branches et son dossier, le socle `commun/` a été fusionné en premier pour éviter les conflits.

## Revue croisée (11 h 45 nous présentons, 11 h 50 l'équipe jumelle présente)

Équipe jumelle :

Incrément montré (URL, tag Git ou capture) :

Feedbacks reçus :

-

Ce qu'on retient de la démo de l'autre équipe :

-

Décisions après la revue (backlog ajusté, story reportée, bug à corriger) :

-

## Rétrospective (11 h 55, 5 min)

Ce qui a marché :

-

Ce qui a coincé :

-

Amélioration choisie pour le sprint 3 (une seule) :

## Fin du sprint (12 h 00)

```
./scripts/fin-de-sprint.sh 2 "11 points terminés sur 11"
git push --tags
```
