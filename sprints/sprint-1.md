# Sprint 1 · 8 h 05 à 9 h 55

Même format que le cadre « TP · Sprint 1 » du Miro. On remplit les deux au fil du sprint, le Miro pour l'équipe dans la salle, ce fichier pour la trace dans Git.

Objectif du sprint : « Une URL publique affiche l'appli avec les zones de démo en base. »

Prévu : 10 pts · Terminé : 10 pts (à 9 h 55)

## Sprint planning (8 h 05, 5 min)

Qui prend quoi (noms et items) :

- Binôme 1 :
- Binôme 2 :

Règle prévue (étape 6) : si on finit en avance, commencer US2 (carte) pour soulager le sprint 2. Risque principal : perdre 45 min sur la configuration.

## Sprint backlog

| Item | Points | Branche | État | Commit ou fusion |
|---|---|---|---|---|
| T1 – Environnement, repo Git et hébergement | 3 | `s1/t1-environnement` | terminé | `de125b9`, fusion `f81ee1e` |
| T2 – Base de données et stockage des photos | 5 | `s1/t2-base-photos` | terminé | `ab0f199`, fusion `4308647` |
| T3 – Données de démo sur la rade | 2 | `s1/t3-donnees-demo` | terminé | `62ee32c`, fusion `5c0b701` |

États possibles : à faire, en cours, terminé (testé, montrable, fusionné sur main).

## Réalisation (8 h 10 à 9 h 40, 1 h 30)

Décisions prises pendant le sprint :

- Pas de build ni de framework : HTML, CSS, JS et Leaflet, pour que n'importe qui dans l'équipe puisse relire et modifier.
- T2 : le schéma et le seed SQL sont prêts pour Supabase, mais la démo tourne en mode local (localStorage) tant que le projet Supabase n'est pas créé.

Blocages rencontrés et comment on les a levés :

- Pas de compte Supabase sous la main : on a écrit la couche de données avec deux modes (local, Supabase) pour ne pas bloquer la suite.

## Revue croisée (9 h 40 nous présentons, 9 h 45 l'équipe jumelle présente)

Équipe jumelle :

Incrément montré (URL, tag Git ou capture) :

Feedbacks reçus :

-

Ce qu'on retient de la démo de l'autre équipe :

-

Décisions après la revue (backlog ajusté, story reportée, bug à corriger) :

-

## Rétrospective (9 h 50, 5 min)

Ce qui a marché :

-

Ce qui a coincé :

-

Amélioration choisie pour le sprint 2 (une seule) :

## Fin du sprint (9 h 55)

```
./scripts/fin-de-sprint.sh 1 "10 points terminés sur 10"
git push --tags
```
