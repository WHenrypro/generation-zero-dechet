# Conventions Git de l'équipe

Le but : qu'on retrouve chaque sprint dans l'historique, sans effort, pour le livrable du 21 janvier.

## Branches

- `main` : ce qui est testé et montrable. C'est ce qu'on présente en revue croisée.
- Une branche par item du sprint, nommée `sN/item-mot-cle` : `s1/t1-environnement`, `s1/t2-base-photos`, `s1/t3-donnees-demo`, `s2/us2-carte`, `s2/us21-signaler`, etc.
- On fusionne sur `main` dès que l'item est terminé (testé, ça marche en local, le kanban Miro passe à « Terminé »). Pas de fusion d'un truc cassé pour « gagner du temps ».

## Commits

- Petits commits, un par pas qui marche.
- Message : `[S1][T1] Mise en place du dépôt et de la page d'accueil`. Le préfixe `[S1]` est le sprint, `[T1]` ou `[US2]` l'item du backlog.
- Si un commit a été écrit en grande partie avec une IA, on le dit dans le message (ligne `Co-Authored-By` ou une phrase).

## Fin de sprint

Aux horaires de fin (9 h 55, 12 h 00, 15 h 50, 17 h 55), une personne lance :

```
./scripts/fin-de-sprint.sh 1 "8 points terminés sur 10"
git push --tags
```

Le tag `sprint-1` marque l'état exact présenté en revue. On remplit en même temps `sprints/sprint-1.md` (points terminés, feedbacks, rétro) et le cadre Miro du sprint.

## Ce qu'on ne commite pas

`app/js/config.js` (clés Supabase), fichiers `.env`, `.DS_Store`. Voir `.gitignore`.
