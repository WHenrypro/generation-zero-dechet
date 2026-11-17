# Géné Z(éro) Déchet, l'application

Une page web statique : la carte de la rade de Brest (Leaflet + OpenStreetMap) avec les zones de démo, une légende, un compteur et une fiche par zone. Pas de framework, pas de build. Les fichiers se déploient tels quels.

## Ce qu'il y a dans le dossier

- `index.html` : la page (bandeau, carte, légende, fiche d'une zone).
- `css/style.css` : les styles, mobile d'abord.
- `js/app.js` : chargement des zones, ronds colorés, fiche, compteur. Commenté en français.
- `js/config.example.js` : modèle de configuration Supabase pour le sprint 2. À copier en `js/config.js`, qui est ignoré par git.
- `data/zones.geojson` : les 15 zones de démo du sprint 1 (tâche T3).

## Ouvrir en local

Ouvrir `index.html` par un double-clic ne marche pas : la page charge `data/zones.geojson` avec `fetch`, et les navigateurs bloquent ça quand l'adresse commence par `file://`. Il faut un petit serveur local.

Avec Python (déjà présent sur Mac et Linux) :

```
cd app
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000 dans le navigateur. Ctrl+C pour arrêter.

Avec VS Code : installer l'extension Live Server, puis clic droit sur `index.html` et « Open with Live Server ».

Il faut une connexion internet dans les deux cas : Leaflet vient du CDN unpkg et le fond de carte des serveurs d'OpenStreetMap.

## Déployer

Trois pistes. Dans tous les cas on déploie des fichiers statiques, sans commande de build.

### GitHub Pages

Dans le dépôt : Settings, puis Pages. Source « Deploy from a branch », branche `main`, dossier `/ (root)`. GitHub ne propose que la racine ou `/docs` comme dossier, pas `/app`. Le fichier `index.html` à la racine du dépôt redirige vers `app/`, donc la racine suffit : le site sera à `https://<compte>.github.io/<dépôt>/` et renverra vers `.../app/`.

Autre possibilité : copier le contenu de `app/` dans un dossier `docs/` et choisir `/docs`, mais il faut alors penser à le tenir à jour à chaque changement. Il existe aussi un déploiement par GitHub Actions qui permet de publier un sous-dossier, à regarder seulement si on a du temps.

### Netlify

Le plus rapide pour une démo : aller sur https://app.netlify.com/drop et glisser-déposer le dossier `app/`. Le site est en ligne tout de suite, avec une adresse `*.netlify.app`, sans lier de dépôt.

Pour déployer à chaque push, lier le dépôt GitHub et indiquer `app` comme dossier à publier (champ « Publish directory », intitulé à vérifier dans l'interface), sans commande de build.

### Vercel

Importer le dépôt, puis dans la configuration du projet mettre « Root Directory » sur `app`, framework « Other », pas de commande de build. Les intitulés exacts sont à vérifier dans l'interface au moment de l'import.

## Fond de carte

Les tuiles viennent de `tile.openstreetmap.org`. C'est très bien pour une démo d'équipe, mais ces serveurs sont tenus par des bénévoles et leur politique d'usage interdit un trafic important. Si l'appli devait être vraiment utilisée, il faudrait passer par un fournisseur de tuiles avec une clé.

## Sprint 2 et suivants

La configuration Supabase se fait en copiant `js/config.example.js` en `js/config.js` et en décommentant la balise `<script src="js/config.js">` dans `index.html`. Le schéma de la base et les données de démo sont dans `../supabase/`.
