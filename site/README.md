# Génération Z(éro déchet), le site : la carte interactive

Une page web statique : la carte de la rade de Brest (Leaflet + OpenStreetMap) avec les zones de démo, une légende, un compteur et une fiche par zone. Pas de framework, pas de build. Les fichiers se déploient tels quels.

## Ce qu'il y a dans le dossier

- `index.html` : la page (bandeau, carte, légende, fiche d'une zone, liste des zones rouges, formulaire de signalement).
- Le code partagé avec l'app est dans `../commun/` (store.js, données de démo, config Supabase).
- `css/style.css` : les styles, mobile d'abord. Charte alignée sur le site de l'équipe (dépôt generation-zero-dechet) : polices DM Sans et Outfit (Google Fonts), vert `#167e66` en accent, variables CSS en tête de fichier.
- `js/site.js` : chargement des zones, ronds colorés, fiche, compteur, géolocalisation, signalement d'une zone, passage vers l'app. Commenté en français.

## Signaler une zone (US21)

Le bouton rouge « + Signaler une zone » ouvre un formulaire. La position se donne par le GPS du téléphone (« Ma position GPS ») ou en touchant la carte (« Placer sur la carte » : le formulaire s'efface, un bandeau demande de toucher la carte, le point choisi apparaît en rond provisoire, puis le formulaire revient). La photo est facultative, réduite à 1024 px avant d'être enregistrée (`../commun/js/photos.js`). À l'envoi la zone est créée en rouge dans la couche de données, le rond apparaît sur la carte, le compteur monte et la fiche de la nouvelle zone s'ouvre.

En mode local, tout reste dans le localStorage du navigateur (clé `gzd.zones`), photo comprise sous forme de data URL. Pour revenir aux 15 zones de démo : dans la console du navigateur, `GZD.store.reinitialiser()` puis recharger la page.

## Zones à nettoyer, de la plus proche à la plus loin (US3)

Le bouton « Zones à nettoyer » (à droite, sous « Autour de moi ») ouvre la liste des zones rouges triées par distance à vol d'oiseau (formule de haversine) depuis la position de la personne. Si la géolocalisation est refusée ou indisponible, la liste est triée depuis le centre de la rade et une phrase le dit. Un clic sur une ligne centre la carte et ouvre la fiche.

## Fiche d'une zone (US4)

La fiche montre la photo du signalement quand il y en a une (sinon le visuel de remplacement), le badge d'état (À nettoyer, En cours, Nettoyée), le type, la quantité, la date, la description, et la distance depuis la personne si sa position est connue (après « Autour de moi » ou « Zones à nettoyer »). Pour une zone verte, elle ajoute la dernière publication faite depuis l'app (`GZD.store.chargerPublications()`, filtrée sur `zone_id`) : « Nettoyée par Léa le 17 nov. 2026 », photo avant, photo après. S'il n'y a pas de publication, rien ne s'affiche.

## Vers l'app : « J'y vais » et lien profond (US5)

Dans la fiche d'une zone rouge ou orange, le bouton « J'y vais avec l'app » est un lien vers `../app/?zone=<id>` : l'app s'ouvre directement sur cette zone pour le ramassage. Pour une zone verte, le lien est caché et une phrase dit qu'elle est déjà nettoyée. Dans la légende, « L'app du ramassage » mène à `../app/`.

Dans l'autre sens, le site accepte un lien profond : `site/?zone=z03` centre la carte et ouvre la fiche de la zone `z03` une fois les zones chargées. Si l'identifiant n'existe pas, un message discret le dit et la carte s'affiche normalement.

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
