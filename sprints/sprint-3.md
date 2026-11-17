# Sprint 3 · 14 h 00 à 15 h 50

Même format que le cadre « TP · Sprint 3 » du Miro. On remplit les deux au fil du sprint, le Miro pour l'équipe dans la salle, ce fichier pour la trace dans Git.

Objectif du sprint : « Léa se connecte, repère une zone rouge et décide d'y aller. »

Prévu : 10 pts · Terminé : 10 pts (à 15 h 50)

## Sprint planning (14 h 00, 5 min)

Qui prend quoi (noms et items) :

- Binôme 1 :
- Binôme 2 :

Règle prévue (étape 6) : si on est en retard, US4 (détail d'une zone) est le premier Must sacrifiable, le parcours reste bouclé sans lui. Relire d'abord l'amélioration choisie en rétro du sprint 2.

## Sprint backlog

| Item | Points | Branche | État | Commit ou fusion |
|---|---|---|---|---|
| US3 – Voir les zones sales en rouge | 2 | `s3/us3-zones-rouges` | terminé | `866137a`, fusion `d8b44ad` |
| US4 – Consulter le détail d'une zone | 3 | `s3/us4-detail-zone` | terminé | `d40a9e5`, fusion `ec55c6b` |
| US1 – Créer un compte simple (pseudo) | 3 | `s3/us1-compte` | terminé | `17825c7`, fusion `8272595` |
| US5 – Choisir une zone et y aller (site : bouton « J'y vais », lien profond) | 1 | `s3/us5-y-aller-site` | terminé | `5cd4b8b`, fusion `fb6308f` |
| US5 – Choisir une zone et y aller (app : zones proches, « J'y vais ») | 1 | `s3/us5-y-aller-app` | terminé | `57dfbc4`, fusion `aaee070` |

États possibles : à faire, en cours, terminé (testé, montrable, fusionné sur main).

## Réalisation (14 h 05 à 15 h 35, 1 h 30)

Décisions prises pendant le sprint :

- US5 touche les deux faces : deux branches, `s3/us5-y-aller-site` (bouton « J'y vais », lien profond) et `s3/us5-y-aller-app` (zones proches, lancement du ramassage).
- Le compte reste un pseudo sans mot de passe, partagé entre site et app via le stockage du navigateur.
- Sans géolocalisation, les distances sont calculées depuis le centre de la rade et on le dit à l'écran.

Blocages rencontrés et comment on les a levés :

- Le lien profond `?zone=` devait marcher des deux côtés avant la revue : testé en navigateur du clic « J'y vais » jusqu'à l'app.

## Revue croisée (15 h 35 nous présentons, 15 h 40 l'équipe jumelle présente)

Équipe jumelle :

Incrément montré (URL, tag Git ou capture) :

Feedbacks reçus :

-

Ce qu'on retient de la démo de l'autre équipe :

-

Décisions après la revue (backlog ajusté, story reportée, bug à corriger) :

-

## Rétrospective (15 h 45, 5 min)

Ce qui a marché :

-

Ce qui a coincé :

-

Amélioration choisie pour le sprint 4 (une seule) :

## Fin du sprint (15 h 50)

```
./scripts/fin-de-sprint.sh 3 "10 points terminés sur 10"
git push --tags
```
