# Géné Z(éro) Déchet, le site : la carte interactive

Une page web statique : la carte de la rade de Brest (Leaflet + OpenStreetMap) avec les zones de démo, une légende, un compteur et une fiche par zone. Pas de framework, pas de build. Les fichiers se déploient tels quels.

## Ce qu'il y a dans le dossier

- `index.html` : la page (bandeau, carte, légende, fiche d'une zone).
- Le code partagé avec l'app est dans `../commun/` (store.js, données de démo, config Supabase).
- `css/style.css` : les styles, mobile d'abord.
- `js/site.js` : chargement des zones, ronds colorés, fiche, compteur, géolocalisation. Commenté en français.

## Ouvrir en local

Ouvrir `index.html` par un double-clic ne marche pas : la page charge `../commun/data/zones.geojson` avec `fetch`, et les navigateurs bloquent ça quand l'adresse commence par `file://`. Il faut un petit serveur local, lancé à la RACINE du dépôt (pour que `site/`, `app/` et `commun/` soient servis ensemble et partagent leurs données) :

```
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000/site/ dans le navigateur (et http://localhost:8000/app/ pour l'app). Ctrl+C pour arrêter.

Avec VS Code : installer l'extension Live Server, puis clic droit sur `index.html` et « Open with Live Server ».

Il faut une connexion internet dans les deux cas : Leaflet vient du CDN unpkg et le fond de carte des serveurs d'OpenStreetMap.

## Déployer

Trois pistes. Dans tous les cas on déploie des fichiers statiques, sans commande de build.

### GitHub Pages

Dans le dépôt : Settings, puis Pages. Source « Deploy from a branch », branche `main`, dossier `/ (root)`. Le fichier `index.html` à la racine est la page d'accueil (liens vers le site et l'app) : tout sera à `https://<compte>.github.io/<dépôt>/`, la carte à `.../site/` et l'app à `.../app/`.

### Netlify

Le plus rapide pour une démo : aller sur https://app.netlify.com/drop et glisser-déposer le dossier du dépôt entier (il faut `site/`, `app/` et `commun/` ensemble). Le site est en ligne tout de suite, avec une adresse `*.netlify.app`, sans lier de dépôt.

Pour déployer à chaque push, lier le dépôt GitHub et laisser le dossier à publier à la racine, sans commande de build.

### Vercel

Importer le dépôt, framework « Other », racine du dépôt, pas de commande de build. Les intitulés exacts sont à vérifier dans l'interface au moment de l'import.

## Fond de carte

Les tuiles viennent de `tile.openstreetmap.org`. C'est très bien pour une démo d'équipe, mais ces serveurs sont tenus par des bénévoles et leur politique d'usage interdit un trafic important. Si l'appli devait être vraiment utilisée, il faudrait passer par un fournisseur de tuiles avec une clé.

## Sprint 2 et suivants

La configuration Supabase se fait en copiant `../commun/js/config.example.js` en `../commun/js/config.js` (ignoré par git). Le schéma de la base et les données de démo sont dans `../supabase/`.
