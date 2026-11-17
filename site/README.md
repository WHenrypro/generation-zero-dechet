# Le site : la carte de la rade

Ce dossier est une copie du site réalisé par l'équipe (William, Clément, Baptiste), dossier `sprint4/` du dépôt https://github.com/WHenrypro/generation-zero-dechet. Il est là pour que le bouton « Voir sur la carte » de l'app ouvre le site de l'équipe quand on lance le tout depuis la racine (`python3 -m http.server 8000`).

Ne pas le modifier ici : la version de référence est dans le dépôt de l'équipe. Pour le mettre à jour, recopier `index.html`, `app.js` et `style.css` depuis leur `sprint4/`.

Limite connue : le site de l'équipe garde ses zones dans IndexedDB, l'app garde les siennes dans le localStorage (`commun/`). Une zone passée au vert dans l'app n'apparaît donc pas encore en vert sur leur carte. Le rapprochement des deux stockages est à faire ensemble après le TP.
