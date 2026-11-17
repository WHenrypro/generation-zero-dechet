# Livrable MVP : Génération Z(éro déchet)

Fiche remise avec le document TD1, TD2, TP1 et la réflexion. Elle dit où tourne le MVP et comment le voir en deux minutes.

## Où le voir

URL publique prévue : https://whenrypro.github.io/generation-zero-dechet/sprint4/index.html (site) et https://whenrypro.github.io/generation-zero-dechet/sprint4/app/index.html (app).

Au 17 novembre 2026 cette adresse répond encore 404 : GitHub Pages n'est pas activé sur le dépôt. William, propriétaire du dépôt, doit le faire une fois : Settings, puis Pages, Source « Deploy from a branch », branche `main`, dossier `/ (root)`, Save. Le site est en ligne deux ou trois minutes plus tard. Tous les chemins du code sont relatifs, rien n'est à changer pour que ça marche dans ce sous-dossier.

Code source : https://github.com/WHenrypro/generation-zero-dechet (dépôt de l'équipe, dossiers `sprint1` à `sprint4`, l'app dans `sprint3/app` et `sprint4/app`). L'historique complet de l'app, avec une branche par story et un tag par sprint, est sur la branche `mvp` du même dépôt. La PR qui a rangé l'app par sprint : https://github.com/WHenrypro/generation-zero-dechet/pull/1 (fusionnée).

## En local

Depuis un clone du dépôt de l'équipe :

```bash
python3 -m http.server 8001
```

puis ouvrir http://127.0.0.1:8001/sprint4/index.html pour le site et http://127.0.0.1:8001/sprint4/app/index.html pour l'app. Live Server de VS Code marche aussi.

## Parcours de démo (sprint 4)

1. Marc ouvre le site, onglet Signaler : nom de la zone, type et quantité de déchets, photo, position choisie sur la carte. La zone apparaît en rouge.
2. Léa ouvre l'app sur son téléphone et choisit un pseudo.
3. L'app lui montre les zones rouges les plus proches. Elle en choisit une et appuie sur « J'y vais ».
4. Sur place elle prend la photo avant.
5. Après le ramassage elle prend la photo après et publie.
6. La publication arrive dans le feed de l'app et la zone passe au vert sur le site.

## État réel, sans enjoliver

Depuis le commit 19c3103 de William (17 novembre 2026, 16 h 02), le site du sprint 4 et l'app lisent et écrivent dans la même base Supabase à travers la couche commune `commun/js/store.js`. Les zones, les photos et les publications sont donc partagées entre les deux écrans et entre les navigateurs. Pour ça, le fichier `sprint4/commun/js/config.js` est versionné dans le dépôt avec l'URL du projet et la clé publique anon, et les règles de la base laissent tout le monde lire, ajouter et modifier. C'est voulu pour un prototype de TP sans comptes utilisateurs, pas pour une mise en production.

Nous n'avons pas pu vérifier nous-mêmes que les tables et le bucket de photos existent sur ce projet Supabase, ni faire un parcours complet dessus. Les sprints 1 à 3 restent sur un stockage local au navigateur (IndexedDB pour le site, localStorage pour l'app), comme au moment où ils ont été livrés.
