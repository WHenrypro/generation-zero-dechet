/*
 * Géné Z(éro) Déchet, Sprint 1 (tâches T1 et T3)
 * ===============================================
 *
 * Ce fichier fait trois choses :
 *   1. afficher une carte Leaflet centrée sur la rade de Brest ;
 *   2. charger les zones de démo (data/zones.geojson) et dessiner un rond
 *      par zone, coloré selon son état : rouge (sale), orange (ramassage
 *      en cours), vert (nettoyée) ;
 *   3. ouvrir une fiche de détail quand on touche un rond, et tenir à jour
 *      le compteur « X zones à nettoyer » du bandeau.
 *
 * Pas de framework ni d'étape de build : du JavaScript classique (ES2017
 * maximum) chargé par une balise <script> dans index.html. Leaflet est
 * chargé juste avant et met à disposition la variable globale « L ».
 *
 * Tout le code est enfermé dans une fonction appelée immédiatement pour ne
 * pas créer de variables globales dans la page.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 1. Réglages                                                          */
  /* ------------------------------------------------------------------ */

  // Vue de départ : la rade de Brest en entier. Leaflet attend [latitude, longitude].
  var CENTRE_RADE = [48.36, -4.45];
  var ZOOM_DEPART = 12;

  // Où sont les zones. Sprint 1 : un fichier statique.
  // Sprint 2 : remplacé par une lecture de la table « zones » dans Supabase.
  var URL_ZONES = 'data/zones.geojson';

  // Couleur du rond et libellé affiché pour chaque état d'une zone.
  // Les couleurs doivent rester cohérentes avec la légende (css/style.css).
  var ETATS = {
    rouge:  { couleur: '#D64545', libelle: 'À nettoyer' },
    orange: { couleur: '#F28C28', libelle: 'Ramassage en cours' },
    vert:   { couleur: '#2E9E5B', libelle: 'Nettoyée' }
  };
  // Si une zone a un état inattendu dans les données, on l'affiche en gris.
  var ETAT_INCONNU = { couleur: '#64748B', libelle: 'État inconnu' };

  // Style du rond sélectionné : un peu plus gros, liseré bleu foncé.
  var STYLE_SELECTION = { radius: 13, color: '#0F4F8F', weight: 3 };

  /* ------------------------------------------------------------------ */
  /* 2. Les éléments de la page qu'on va manipuler                       */
  /* ------------------------------------------------------------------ */

  var elCompteurNombre   = document.getElementById('compteur-nombre');
  var elCompteurTexte    = document.getElementById('compteur-texte');
  var elMessage          = document.getElementById('message');
  var elFiche            = document.getElementById('fiche');
  var elFicheFermer      = document.getElementById('fiche-fermer');
  var elFicheNom         = document.getElementById('fiche-nom');
  var elFicheCommune     = document.getElementById('fiche-commune');
  var elFicheEtat        = document.getElementById('fiche-etat');
  var elFicheType        = document.getElementById('fiche-type');
  var elFicheQuantite    = document.getElementById('fiche-quantite');
  var elFicheDate        = document.getElementById('fiche-date');
  var elFicheDescription = document.getElementById('fiche-description');

  /* ------------------------------------------------------------------ */
  /* 3. La carte                                                          */
  /* ------------------------------------------------------------------ */

  var carte = L.map('carte').setView(CENTRE_RADE, ZOOM_DEPART);

  // Fond de carte OpenStreetMap. L'attribution est obligatoire (licence ODbL).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; les contributeurs d\'<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(carte);

  // Un clic sur la carte (en dehors d'un rond) ferme la fiche.
  carte.on('click', fermerFiche);

  /* ------------------------------------------------------------------ */
  /* 4. Chargement et affichage des zones                                */
  /* ------------------------------------------------------------------ */

  var rondSelectionne = null; // le rond actuellement mis en avant, s'il y en a un

  fetch(URL_ZONES)
    .then(function (reponse) {
      if (!reponse.ok) {
        throw new Error('Réponse HTTP ' + reponse.status + ' pour ' + URL_ZONES);
      }
      return reponse.json();
    })
    .then(afficherZones)
    .catch(function (erreur) {
      console.error('Chargement des zones impossible :', erreur);
      elCompteurNombre.textContent = '?';
      afficherMessage(
        'Impossible de charger les zones. Si vous avez ouvert index.html directement ' +
        '(adresse commençant par file://), lancez un petit serveur local : voir README.md.'
      );
    });

  /**
   * Dessine toutes les zones du GeoJSON sur la carte et met à jour le compteur.
   * @param {Object} geojson  une FeatureCollection de Points (voir data/zones.geojson)
   */
  function afficherZones(geojson) {
    L.geoJSON(geojson, {
      // Pour chaque Point du GeoJSON, on fabrique un rond coloré
      // plutôt que le marqueur bleu par défaut de Leaflet.
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, styleDuRond(feature.properties.etat));
      },
      // Pour chaque rond : une infobulle avec le nom, et le clic qui ouvre la fiche.
      onEachFeature: function (feature, rond) {
        rond.bindTooltip(feature.properties.nom, { direction: 'top', offset: [0, -10] });
        rond.on('click', function () {
          selectionnerZone(feature, rond);
        });
      }
    }).addTo(carte);

    mettreAJourCompteur(geojson.features);
  }

  /**
   * Style d'un rond selon l'état de la zone.
   * bubblingMouseEvents: false empêche le clic sur un rond de remonter jusqu'à
   * la carte (sinon la fiche se fermerait aussitôt après s'être ouverte).
   */
  function styleDuRond(etat) {
    var info = ETATS[etat] || ETAT_INCONNU;
    return {
      radius: 10,
      fillColor: info.couleur,
      fillOpacity: 0.9,
      color: '#FFFFFF', // liseré blanc
      weight: 2,
      bubblingMouseEvents: false
    };
  }

  /* ------------------------------------------------------------------ */
  /* 5. La fiche d'une zone                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Met un rond en avant et remplit la fiche avec les propriétés de la zone.
   * @param {Object} feature  la Feature GeoJSON de la zone
   * @param {L.CircleMarker} rond  le rond dessiné pour cette zone
   */
  function selectionnerZone(feature, rond) {
    var p = feature.properties || {};
    var info = ETATS[p.etat] || ETAT_INCONNU;

    // Remettre l'ancien rond à sa taille normale, mettre le nouveau en avant.
    if (rondSelectionne) {
      rondSelectionne.setStyle(styleDuRond(rondSelectionne.feature.properties.etat));
    }
    rond.setStyle(STYLE_SELECTION);
    rond.bringToFront();
    rondSelectionne = rond;

    // Remplir la fiche. On utilise textContent (et pas innerHTML) : le texte
    // des données est affiché tel quel, sans risque d'injection de HTML.
    elFicheNom.textContent = p.nom || 'Zone sans nom';
    elFicheCommune.textContent = p.commune || '';
    elFicheEtat.textContent = info.libelle;
    elFicheEtat.className = 'badge badge-' + (ETATS[p.etat] ? p.etat : 'inconnu');
    elFicheType.textContent = majusculeInitiale(p.type) || 'Non précisé';
    elFicheQuantite.textContent = majusculeInitiale(p.quantite) || 'Non précisée';
    elFicheDate.textContent = formaterDate(p.signale_le);
    elFicheDescription.textContent = p.description || '';

    elFiche.hidden = false;
    recentrerSur(rond.getLatLng());
  }

  /** Ferme la fiche et rend au rond sélectionné son apparence normale. */
  function fermerFiche() {
    elFiche.hidden = true;
    if (rondSelectionne) {
      rondSelectionne.setStyle(styleDuRond(rondSelectionne.feature.properties.etat));
      rondSelectionne = null;
    }
  }

  elFicheFermer.addEventListener('click', fermerFiche);

  // La touche Échap ferme aussi la fiche.
  document.addEventListener('keydown', function (evenement) {
    if (evenement.key === 'Escape' && !elFiche.hidden) {
      fermerFiche();
    }
  });

  /**
   * Déplace la carte pour que le rond choisi reste visible.
   * Sur petit écran la fiche recouvre le bas : on place le rond dans la partie
   * haute de la carte. Sur grand écran la fiche est à droite, on centre simplement.
   */
  function recentrerSur(latlng) {
    var grandEcran = window.matchMedia('(min-width: 768px)').matches;
    var zoom = carte.getZoom();
    var point = carte.project(latlng, zoom);
    if (!grandEcran) {
      // Le centre de la carte doit se trouver sous le rond
      // (en pixels écran, y augmente vers le bas).
      point = point.add([0, Math.round(carte.getSize().y * 0.28)]);
    }
    carte.panTo(carte.unproject(point, zoom));
  }

  /* ------------------------------------------------------------------ */
  /* 6. Compteur et petits utilitaires                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Compte les zones encore sales (état « rouge »). Les zones orange sont
   * déjà prises en charge par quelqu'un : on ne les compte pas.
   */
  function mettreAJourCompteur(features) {
    var nombre = features.filter(function (f) {
      return f.properties && f.properties.etat === 'rouge';
    }).length;
    elCompteurNombre.textContent = String(nombre);
    elCompteurTexte.textContent = (nombre === 1) ? 'zone à nettoyer' : 'zones à nettoyer';
  }

  /** « 2026-11-05T10:30:00+01:00 » devient « 5 novembre 2026 ». */
  function formaterDate(iso) {
    if (!iso) { return 'Date inconnue'; }
    var date = new Date(iso);
    if (isNaN(date.getTime())) { return iso; }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** « plusieurs sacs » devient « Plusieurs sacs ». */
  function majusculeInitiale(texte) {
    if (!texte) { return ''; }
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  /** Affiche un message d'alerte en haut de la carte. */
  function afficherMessage(texte) {
    elMessage.textContent = texte;
    elMessage.hidden = false;
  }
})();
