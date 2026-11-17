# Sprint 4 · 16 h 05 à 17 h 55

Même format que le cadre « TP · Sprint 4 » du Miro. On remplit les deux au fil du sprint, le Miro pour l'équipe dans la salle, ce fichier pour la trace dans Git.

Objectif du sprint : « Léa prouve son action et la zone passe au vert. Démo complète. »

Prévu : 9 pts · Terminé : 9 pts (à 17 h 55)

## Sprint planning (16 h 05, 5 min)

Qui prend quoi (noms et items) :

- Binôme 1 :
- Binôme 2 :

Règle prévue (étape 6) : sprint volontairement plus léger, garder 20 min pour la vidéo de démo. Si on est en avance, prendre US18 compteur d'impact (3 pts). Prévoir qui filme la démo.

## Sprint backlog

| Item | Points | Branche | État | Commit ou fusion |
|---|---|---|---|---|
| US7 – Prendre la photo avant | 3 | `s4/us7-photo-avant` | terminé | `d359f18`, fusion `e8f252f` |
| US9 – Prendre la photo après | 2 | `s4/us9-photo-apres` | terminé | `3e475af`, fusion `ff40191` |
| US10 – Publier l'avant/après | 3 | `s4/us10-publier` | terminé | `e8c3213`, fusion `60a31d7` |
| US11 – La zone passe au vert | 1 | `s4/us11-zone-verte` | terminé | `4f38c63`, fusion `e2c2fba` |

États possibles : à faire, en cours, terminé (testé, montrable, fusionné sur main).

## Réalisation (16 h 10 à 17 h 40, 1 h 30)

Décisions prises pendant le sprint :

- La publication passe la zone au vert tout de suite (pas de modération), un écran « Bravo » renvoie vers la carte.
- Bouton « Réinitialiser la démo » dans l'onglet Moi, visible seulement en mode local, pour rejouer la démo en revue.
- US16 (minuteur 10 min) et US8 (état orange) restent hors MVP, notés comme suite sur le Miro.

Blocages rencontrés et comment on les a levés :

- Les photos en mode local sont des data URL dans le localStorage (quelques Mo) : réduction à 1024 px en JPEG et message si le stockage est plein.

## Revue croisée (17 h 40 nous présentons, 17 h 45 l'équipe jumelle présente)

Équipe jumelle :

Incrément montré (URL, tag Git ou capture) :

Feedbacks reçus :

-

Ce qu'on retient de la démo de l'autre équipe :

-

Décisions après la revue (backlog ajusté, story reportée, bug à corriger) :

-

## Rétrospective (17 h 50, 5 min)

Ce qui a marché :

-

Ce qui a coincé :

-

Amélioration choisie pour la suite (livrable du 21 janvier) (une seule) :

## Fin du sprint (17 h 55)

```
./scripts/fin-de-sprint.sh 4 "9 points terminés sur 9"
git push --tags
```
