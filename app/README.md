# Génération Z(éro déchet), l'app du ramassage

Le parcours de Léa : choisir une zone rouge près de soi, prendre une photo avant, ramasser, prendre une photo après, publier. La zone passe au vert dans l'app et dans le feed. Le bouton « Voir sur la carte » ouvre le site de l'équipe (`../site/`, copie de leur dossier `sprint4/`).

Pas de framework, pas de build : du HTML, du CSS et un fichier `js/app.js` en JavaScript classique. Les scripts partagés avec le site sont dans `../commun/js/` (store, photos, session).

## Lancer

Depuis la racine du dépôt (pas depuis `app/`, car l'app charge `../commun/`) :

```
python3 -m http.server 8102
```

Puis ouvrir http://localhost:8102/app/ dans un navigateur, de préférence en mode mobile (largeur 480 px ou moins). Sur un téléphone, le bouton photo ouvre directement l'appareil photo.

Sans `commun/js/config.js`, l'app tourne en démo locale : les données restent dans le navigateur (localStorage). La console note une 404 sur `config.js`, c'est normal.

## Parcours de démo en 6 étapes

1. Choisir un pseudo. Pas de compte, pas de mot de passe.
2. Onglet Ramasser : les zones rouges sont listées de la plus proche à la plus loin (géolocalisation, ou centre de la rade si elle est refusée). On peut aussi arriver depuis la carte du site avec `?zone=<id>`. Appuyer sur « J'y vais ».
3. Étape 1 : prendre la photo avant. Elle est réduite et gardée dans le navigateur, un rechargement ne la perd pas.
4. Étape 2 : ramasser, puis « J'ai fini, photo après ». Étape 3 : prendre la photo après.
5. Relecture avant / après côte à côte. « Reprendre l'après » si besoin, puis « Publier ».
6. Écran « Bravo » : la zone est passée au vert. « Voir sur la carte » ouvre le site sur cette zone, « Voir le feed » montre la publication en tête du feed.

Au premier lancement, le feed contient déjà une publication exemple (Léa, Anse du Dellec) pour ne pas commencer sur un écran vide.

Pour rejouer la démo : onglet Moi, « Réinitialiser la démo » (zones de départ, feed ramené à la publication exemple, pseudo gardé).

## Limites connues

- Le mode Supabase (avec `commun/js/config.js`) n'a pas été testé depuis l'app. Le code appelle les mêmes fonctions de `GZD.store`, mais rien ne garantit que l'envoi des photos et des publications passe tel quel.
- En démo locale, les photos sont stockées dans le navigateur, dont l'espace est limité à quelques Mo. Au bout de quelques ramassages, un message « Stockage plein » invite à réinitialiser la démo.
- Pas de minuteur façon BeReal (les 10 minutes pour poster) : prévu après le MVP.
- Pas d'état orange « En cours » quand quelqu'un dit « J'y vais » : la zone reste rouge jusqu'à la publication. Prévu après le MVP.
- Pas de suppression ni de modération des publications.
