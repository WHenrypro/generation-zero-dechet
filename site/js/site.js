/*
 * Géné Z(éro) Déchet, le site : la carte interactive de la rade
 * ============================================================
 *
 * Sprint 1 (T1, T3) : carte Leaflet de la rade, ronds colorés par état,
 *                     fiche d'une zone, compteur.
 * Sprint 2 (US2)    : les zones viennent de la couche de données (commun/js/store.js,
 *                     mode local ou Supabase), bouton « Autour de moi » qui
 *                     recentre la carte sur la position de la personne.
 *
 * Pas de framework ni d'étape de build : du JavaScript classique chargé par
 * des balises <script> dans index.html. Leaflet (variable globale « L ») et
 * GZD.store sont chargés juste avant ce fichier.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 1. Réglages                                                          */
  /* ------------------------------------------------------------------ */

  // Vue de départ : la rade de Brest en entier. Leaflet attend [latitude, longitude].
  var CENTRE_RADE = [48.36, -4.45];
  var ZOOM_DEPART = 12;
  var ZOOM_AUTOUR_DE_MOI = 14;

  // Couleur du rond et libellé affiché pour chaque état d'une zone.
  // Les couleurs doivent rester cohérentes avec la légende (css/style.css).
  var ETATS = {
    rouge:  { couleur: '#D64545', libelle: 'À nettoyer' },
    orange: { couleur: '#F28C28', libelle: 'Ramassage en cours' },
    vert:   { couleur: '#2E9E5B', libelle: 'Nettoyée' }
  };
  var ETAT_INCONNU = { couleur: '#64748B', libelle: 'État inconnu' };

  // Style du rond sélectionné : un peu plus gros, liseré bleu foncé.
  var STYLE_SELECTION = { radius: 13, color: '#0F4F8F', weight: 3 };

  /* ------------------------------------------------------------------ */
  /* 2. État de l'application                                            */
  /* ------------------------------------------------------------------ */

  var store = window.GZD.store;
  var zones = [];            // toutes les zones connues
  var marqueurs = {};        // id de zone -> rond Leaflet
  var zoneOuverte = null;    // la zone affichée dans la fiche
  var positionUtilisateur = null; // L.LatLng, une fois la géolocalisation acceptée
  var marqueurPosition = null;

  function $(id) { return document.getElementById(id); }

  var elCompteurNombre = $('compteur-nombre');
  var elCompteurTexte  = $('compteur-texte');
  var elMessage        = $('message');
  var elFiche          = $('fiche');

  /* ------------------------------------------------------------------ */
  /* 3. La carte                                                          */
  /* ------------------------------------------------------------------ */

  var carte = L.map('carte', { zoomControl: false }).setView(CENTRE_RADE, ZOOM_DEPART);
  L.control.zoom({ position: 'topright' }).addTo(carte);

  // Fond de carte OpenStreetMap. L'attribution est obligatoire (licence ODbL).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; les contributeurs d\'<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(carte);

  var coucheZones = L.layerGroup().addTo(carte);

  // Un clic sur la carte (en dehors d'un rond) ferme le panneau ouvert.
  carte.on('click', function () { fermerPanneaux(); });

  /* ------------------------------------------------------------------ */
  /* 4. Chargement et affichage des zones                                */
  /* ------------------------------------------------------------------ */

  store.chargerZones()
    .then(function (liste) {
      zones = liste;
      zones.forEach(ajouterMarqueur);
      mettreAJourCompteur();
    })
    .catch(function (erreur) {
      console.error('Chargement des zones impossible :', erreur);
      elCompteurNombre.textContent = '?';
      afficherMessage(
        'Impossible de charger les zones (' + erreur.message + '). Si vous avez ouvert index.html ' +
        'directement (adresse file://), lancez un petit serveur local : voir README.md.'
      );
    });

  /** Dessine le rond d'une zone sur la carte et le mémorise. */
  function ajouterMarqueur(zone) {
    var rond = L.circleMarker([zone.lat, zone.lon], styleDuRond(zone.etat));
    rond.bindTooltip(zone.nom, { direction: 'top', offset: [0, -10] });
    rond.on('click', function () { ouvrirFiche(zone); });
    rond.addTo(coucheZones);
    marqueurs[zone.id] = rond;
    return rond;
  }

  /**
   * Style d'un rond selon l'état de la zone.
   * bubblingMouseEvents: false empêche le clic sur un rond de remonter jusqu'à
   * la carte (sinon le panneau se fermerait aussitôt après s'être ouvert).
   */
  function styleDuRond(etat) {
    var info = ETATS[etat] || ETAT_INCONNU;
    return {
      radius: 10,
      fillColor: info.couleur,
      fillOpacity: 0.9,
      color: '#FFFFFF',
      weight: 2,
      bubblingMouseEvents: false
    };
  }

  /** Après un changement d'état, redessine le rond de la zone. */
  function rafraichirMarqueur(zone) {
    var rond = marqueurs[zone.id];
    if (rond) { rond.setStyle(styleDuRond(zone.etat)); }
  }

  /* ------------------------------------------------------------------ */
  /* 5. Panneaux (fiche et, plus tard, formulaires)                       */
  /* ------------------------------------------------------------------ */

  var panneaux = Array.prototype.slice.call(document.querySelectorAll('.panneau'));

  /** Ouvre un panneau et ferme tous les autres. */
  function ouvrirPanneau(panneau) {
    panneaux.forEach(function (p) { if (p !== panneau) { p.hidden = true; } });
    panneau.hidden = false;
    panneau.scrollTop = 0;
  }

  /** Ferme tout et rend au rond sélectionné son apparence normale. */
  function fermerPanneaux() {
    panneaux.forEach(function (p) { p.hidden = true; });
    if (zoneOuverte) {
      rafraichirMarqueur(zoneOuverte);
      zoneOuverte = null;
    }
  }

  // Toutes les croix « fermer » des panneaux.
  Array.prototype.forEach.call(document.querySelectorAll('.panneau-fermer'), function (bouton) {
    bouton.addEventListener('click', fermerPanneaux);
  });

  // La touche Échap ferme aussi.
  document.addEventListener('keydown', function (evenement) {
    if (evenement.key === 'Escape') { fermerPanneaux(); }
  });

  /* ------------------------------------------------------------------ */
  /* 6. La fiche d'une zone                                              */
  /* ------------------------------------------------------------------ */

  /** Met le rond en avant et remplit la fiche avec les données de la zone. */
  function ouvrirFiche(zone) {
    var info = ETATS[zone.etat] || ETAT_INCONNU;

    if (zoneOuverte && zoneOuverte !== zone) { rafraichirMarqueur(zoneOuverte); }
    zoneOuverte = zone;
    var rond = marqueurs[zone.id];
    if (rond) { rond.setStyle(STYLE_SELECTION); rond.bringToFront(); }

    // textContent, et pas innerHTML : le texte des données est affiché tel quel.
    $('fiche-nom').textContent = zone.nom || 'Zone sans nom';
    $('fiche-commune').textContent = zone.commune || '';
    $('fiche-etat').textContent = info.libelle;
    $('fiche-etat').className = 'badge badge-' + (ETATS[zone.etat] ? zone.etat : 'inconnu');
    $('fiche-type').textContent = majusculeInitiale(zone.type) || 'Non précisé';
    $('fiche-quantite').textContent = majusculeInitiale(zone.quantite) || 'Non précisée';
    $('fiche-date').textContent = formaterDate(zone.signale_le);
    $('fiche-description').textContent = zone.description || '';

    ouvrirPanneau(elFiche);
    recentrerSur(L.latLng(zone.lat, zone.lon));
  }

  /**
   * Déplace la carte pour que le point choisi reste visible.
   * Sur petit écran le panneau recouvre le bas : on place le point dans la
   * partie haute de la carte. Sur grand écran le panneau est à gauche, on
   * décale le point vers la droite.
   */
  function recentrerSur(latlng) {
    var grandEcran = window.matchMedia('(min-width: 768px)').matches;
    var zoom = carte.getZoom();
    var point = carte.project(latlng, zoom);
    if (grandEcran) {
      point = point.subtract([200, 0]);
    } else {
      point = point.add([0, Math.round(carte.getSize().y * 0.28)]);
    }
    carte.panTo(carte.unproject(point, zoom));
  }

  /* ------------------------------------------------------------------ */
  /* 7. [S2][US2] Autour de moi : géolocalisation                         */
  /* ------------------------------------------------------------------ */

  $('bouton-position').addEventListener('click', function () {
    localiser().then(function (latlng) {
      carte.setView(latlng, Math.max(carte.getZoom(), ZOOM_AUTOUR_DE_MOI));
    }).catch(function (erreur) {
      afficherMessage(erreur.message);
    });
  });

  /**
   * Demande la position au navigateur. Renvoie une promesse de L.LatLng et
   * place (ou déplace) le point bleu « Vous êtes ici ».
   * La géolocalisation ne marche qu'en https ou sur localhost.
   */
  function localiser() {
    return new Promise(function (resoudre, rejeter) {
      if (!navigator.geolocation) {
        rejeter(new Error('Ce navigateur ne propose pas la géolocalisation.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(function (position) {
        positionUtilisateur = L.latLng(position.coords.latitude, position.coords.longitude);
        if (!marqueurPosition) {
          marqueurPosition = L.circleMarker(positionUtilisateur, {
            radius: 8, fillColor: '#1B6FB8', fillOpacity: 1, color: '#FFFFFF', weight: 3,
            bubblingMouseEvents: false
          }).bindTooltip('Vous êtes ici').addTo(carte);
        } else {
          marqueurPosition.setLatLng(positionUtilisateur);
        }
        resoudre(positionUtilisateur);
      }, function (erreur) {
        var raison = 'Position indisponible.';
        if (erreur.code === 1) {
          raison = 'Position refusée. Autorisez la géolocalisation dans le navigateur, ' +
                   'ou vérifiez que l\'adresse est en https (ou localhost).';
        } else if (erreur.code === 3) {
          raison = 'Position trop longue à obtenir, réessayez.';
        }
        rejeter(new Error(raison));
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 8. Compteur et petits utilitaires                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Compte les zones encore sales (état « rouge »). Les zones orange sont
   * déjà prises en charge par quelqu'un : on ne les compte pas.
   */
  function mettreAJourCompteur() {
    var nombre = zones.filter(function (z) { return z.etat === 'rouge'; }).length;
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

  /** Affiche un message d'alerte en haut de la carte, qui disparaît après 8 s. */
  var minuteurMessage = null;
  function afficherMessage(texte) {
    elMessage.textContent = texte;
    elMessage.hidden = false;
    clearTimeout(minuteurMessage);
    minuteurMessage = setTimeout(function () { elMessage.hidden = true; }, 8000);
  }
})();
