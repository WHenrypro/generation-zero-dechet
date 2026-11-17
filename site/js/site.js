/*
 * Génération Z(éro déchet), le site : la carte interactive de la rade
 * ==================================================================
 *
 * Sprint 1 (T1, T3) : carte Leaflet de la rade, ronds colorés par état,
 *                     fiche d'une zone, compteur.
 * Sprint 2 (US2)    : les zones viennent de la couche de données (commun/js/store.js,
 *                     mode local ou Supabase), bouton « Autour de moi » qui
 *                     recentre la carte sur la position de la personne.
 * Sprint 2 (US21)   : signaler une zone sale : position GPS ou point touché sur
 *                     la carte, photo réduite, type et quantité, enregistrement
 *                     dans la couche de données, puis le rond rouge apparaît.
 * Sprint 3 (US3)    : liste des zones rouges, de la plus proche à la plus loin
 *                     (distance à vol d'oiseau depuis la position de la personne).
 * Sprint 3 (US4)    : fiche complète : photo du signalement, distance, et pour
 *                     une zone nettoyée l'avant / après publié depuis l'app.
 * Sprint 3 (US5)    : « J'y vais avec l'app » ouvre ../app/?zone=<id> ; et si le
 *                     site est ouvert avec ?zone=<id>, la fiche s'ouvre toute seule.
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
    rouge:  { couleur: '#d65752', libelle: 'À nettoyer' },
    orange: { couleur: '#e69a38', libelle: 'En cours' },
    vert:   { couleur: '#239b65', libelle: 'Nettoyée' }
  };
  var ETAT_INCONNU = { couleur: '#657a78', libelle: 'État inconnu' };

  // Style du rond sélectionné : un peu plus gros, liseré vert foncé.
  var STYLE_SELECTION = { radius: 14, color: '#123c39', weight: 3 };

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
  // Pendant le signalement, en mode « placer sur la carte », le clic fixe
  // au contraire la position de la zone (voir la partie 8).
  carte.on('click', function (evenement) {
    if (modePlacement) { placerSur(evenement.latlng); } else { fermerPanneaux(); }
  });

  /* ------------------------------------------------------------------ */
  /* 4. Chargement et affichage des zones                                */
  /* ------------------------------------------------------------------ */

  store.chargerZones()
    .then(function (liste) {
      zones = liste;
      zones.forEach(ajouterMarqueur);
      mettreAJourCompteur();
      ouvrirZoneDepuisUrl(); // [S3][US5] lien profond ?zone=<id>
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
    rond.on('click', function (evenement) {
      if (modePlacement) { placerSur(evenement.latlng); } else { ouvrirFiche(zone); }
    });
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
      radius: 11,
      fillColor: info.couleur,
      fillOpacity: 0.95,
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

  /**
   * Ouvre un panneau et ferme tous les autres. Le focus va sur le panneau
   * (tabindex="-1" dans le HTML) : un lecteur d'écran annonce son titre et
   * la touche Échap le ferme.
   */
  function ouvrirPanneau(panneau) {
    panneaux.forEach(function (p) { if (p !== panneau) { p.hidden = true; } });
    panneau.hidden = false;
    panneau.scrollTop = 0;
    if (panneau.hasAttribute('tabindex')) { panneau.focus({ preventScroll: true }); }
  }

  /**
   * Ferme tout et rend au rond sélectionné son apparence normale.
   * Quitte aussi le mode « placer sur la carte » et retire le rond provisoire
   * du signalement, s'il y en a un.
   */
  function fermerPanneaux() {
    panneaux.forEach(function (p) { p.hidden = true; });
    if (zoneOuverte) {
      rafraichirMarqueur(zoneOuverte);
      zoneOuverte = null;
    }
    if (modePlacement) { terminerPlacement(); }
    retirerMarqueurBrouillon();
  }

  // Toutes les croix « fermer » des panneaux.
  Array.prototype.forEach.call(document.querySelectorAll('.panneau-fermer'), function (bouton) {
    bouton.addEventListener('click', fermerPanneaux);
  });

  // La touche Échap ferme aussi. Pendant le choix d'un point sur la carte,
  // elle annule ce choix et rouvre le formulaire.
  document.addEventListener('keydown', function (evenement) {
    if (evenement.key !== 'Escape') { return; }
    if (modePlacement) { annulerPlacement(); } else { fermerPanneaux(); }
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

    // [S3][US4] Photo du signalement, distance et avant / après.
    afficherPhotoFiche(zone.photo_url);
    afficherDistanceFiche(zone);
    afficherPublicationFiche(zone);

    // [S3][US5] Le bouton qui emmène dans l'app, sur cette zone.
    afficherBoutonJyVais(zone);

    ouvrirPanneau(elFiche);
    recentrerSur(L.latLng(zone.lat, zone.lon));
  }

  /**
   * « J'y vais avec l'app » : un lien vers ../app/?zone=<id>, l'app s'ouvre
   * directement sur la zone. Une zone déjà nettoyée n'a pas besoin de ramassage :
   * le lien est caché et une phrase le dit.
   */
  function afficherBoutonJyVais(zone) {
    var lien = $('bouton-jy-vais');
    var nettoyee = zone.etat === 'vert';
    lien.href = '../app/?zone=' + encodeURIComponent(zone.id);
    lien.hidden = nettoyee;
    $('jy-vais-aide').hidden = nettoyee;
    $('jy-vais-nettoyee').hidden = !nettoyee;
  }

  /**
   * Lien profond : si le site est ouvert avec ?zone=<id> (depuis l'app, un
   * message, un QR code), on centre la carte et on ouvre la fiche de cette zone.
   * Identifiant inconnu : un message discret, et la carte reste normale.
   */
  function ouvrirZoneDepuisUrl() {
    var id = lireParametreUrl('zone');
    if (!id) { return; }
    var zone = zones.filter(function (z) { return z.id === id; })[0];
    if (!zone) {
      afficherMessage('Zone introuvable : le lien pointe vers une zone qui n\'existe pas ou plus.');
      return;
    }
    recentrerSur(L.latLng(zone.lat, zone.lon), ZOOM_AUTOUR_DE_MOI);
    ouvrirFiche(zone);
  }

  /** La valeur d'un paramètre de l'adresse (?zone=z01&x=y), ou null. */
  function lireParametreUrl(nom) {
    var morceaux = window.location.search.replace(/^\?/, '').split('&');
    for (var i = 0; i < morceaux.length; i++) {
      var paire = morceaux[i].split('=');
      if (decodeURIComponent(paire[0]) === nom) {
        return decodeURIComponent((paire[1] || '').replace(/\+/g, ' ')) || null;
      }
    }
    return null;
  }

  /** La photo du signalement si elle existe, sinon le visuel de remplacement (SVG). */
  function afficherPhotoFiche(url) {
    var img = $('fiche-photo-img');
    var svg = $('fiche-photo-svg');
    if (url) {
      img.src = url;
      img.hidden = false;
      svg.setAttribute('hidden', '');
    } else {
      img.removeAttribute('src');
      img.hidden = true;
      svg.removeAttribute('hidden');
    }
  }

  /** La distance à vol d'oiseau depuis la personne, si sa position est connue. */
  function afficherDistanceFiche(zone) {
    var connue = !!positionUtilisateur;
    Array.prototype.forEach.call(document.querySelectorAll('.fiche-ligne-distance'), function (el) {
      el.hidden = !connue;
    });
    if (connue) {
      var km = distanceKm(positionUtilisateur, L.latLng(zone.lat, zone.lon));
      $('fiche-distance').textContent = formaterDistance(km) + ' à vol d\'oiseau';
    }
  }

  /**
   * Pour une zone nettoyée : la publication la plus récente faite depuis l'app
   * (photo avant, photo après, pseudo, date). Rien à afficher s'il n'y en a pas.
   */
  function afficherPublicationFiche(zone) {
    $('fiche-publication').hidden = true;
    if (zone.etat !== 'vert') { return; }
    store.chargerPublications()
      .then(function (publications) {
        if (zoneOuverte !== zone) { return; } // une autre fiche s'est ouverte entre-temps
        var liees = (publications || []).filter(function (p) { return p.zone_id === zone.id; });
        if (!liees.length) { return; }
        liees.sort(function (a, b) {
          return (Date.parse(b.publie_le) || 0) - (Date.parse(a.publie_le) || 0);
        });
        remplirPublication(liees[0]);
      })
      .catch(function (erreur) { console.warn('Publications indisponibles :', erreur); });
  }

  /** « Nettoyée par Léa le 17 nov. 2026 », photo avant et photo après. */
  function remplirPublication(publication) {
    var texte = 'Nettoyée';
    if (publication.pseudo) { texte += ' par ' + publication.pseudo; }
    if (publication.publie_le) { texte += ' le ' + formaterDateCourte(publication.publie_le); }
    $('fiche-publication-texte').textContent = texte;
    remplirImage($('fiche-photo-avant'), publication.photo_avant_url);
    remplirImage($('fiche-photo-apres'), publication.photo_apres_url);
    $('fiche-publication').hidden = false;
  }

  /** Affiche l'image si on a une URL, sinon cache toute la figure (image et légende). */
  function remplirImage(img, url) {
    if (url) {
      img.src = url;
      img.parentNode.hidden = false;
    } else {
      img.removeAttribute('src');
      img.parentNode.hidden = true;
    }
  }

  /**
   * Déplace la carte pour que le point choisi reste visible.
   * Sur petit écran le panneau recouvre le bas : on place le point dans la
   * partie haute de la carte. Sur grand écran le panneau est à gauche, on
   * décale le point vers la droite.
   * Sans zoom, la carte glisse (panTo) ; avec un zoom, elle saute directement
   * (setView), par exemple après un signalement ou depuis la liste.
   */
  function recentrerSur(latlng, zoom) {
    var grandEcran = window.matchMedia('(min-width: 768px)').matches;
    var zoomCible = (zoom === undefined) ? carte.getZoom() : zoom;
    var point = carte.project(latlng, zoomCible);
    if (grandEcran) {
      point = point.subtract([200, 0]);
    } else {
      point = point.add([0, Math.round(carte.getSize().y * 0.28)]);
    }
    var centre = carte.unproject(point, zoomCible);
    if (zoom === undefined) { carte.panTo(centre); } else { carte.setView(centre, zoomCible); }
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
            radius: 8, fillColor: '#167e66', fillOpacity: 1, color: '#FFFFFF', weight: 3,
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
  /* 8. [S2][US21] Signaler une zone sale                                 */
  /* ------------------------------------------------------------------ */

  var elPanneauSignaler  = $('panneau-signaler');
  var elFormSignaler     = $('form-signaler');
  var elBandeauPlacement = $('bandeau-placement');
  var elSignalerGps      = $('signaler-gps');
  var elSignalerPosition = $('signaler-position');
  var elSignalerApercu   = $('signaler-apercu');
  var elSignalerErreur   = $('signaler-erreur');
  var elSignalerEnvoyer  = $('signaler-envoyer');

  // Le brouillon du signalement en cours : la position choisie (L.LatLng) et
  // la photo déjà réduite (data URL JPEG), ou null.
  var brouillon = { position: null, photo: null };
  var modePlacement = false;    // vrai pendant « touchez la carte à l'endroit de la zone »
  var marqueurBrouillon = null; // le rond provisoire posé sur la carte

  // Rond provisoire : rouge un peu transparent, liseré blanc en pointillés.
  var STYLE_BROUILLON = {
    radius: 11, fillColor: ETATS.rouge.couleur, fillOpacity: 0.6,
    color: '#FFFFFF', weight: 2, dashArray: '4 3', bubblingMouseEvents: false
  };

  // Le bouton flottant ouvre le formulaire, toujours avec un brouillon vide.
  $('bouton-signaler').addEventListener('click', function () {
    viderBrouillon();
    ouvrirPanneau(elPanneauSignaler);
  });

  $('signaler-annuler').addEventListener('click', fermerPanneaux);

  /** Remet le formulaire à zéro : position, photo, textes, message d'erreur. */
  function viderBrouillon() {
    elFormSignaler.reset();
    brouillon = { position: null, photo: null };
    retirerMarqueurBrouillon();
    afficherPosition(null);
    elSignalerApercu.hidden = true;
    elSignalerApercu.removeAttribute('src');
    cacherErreurSignalement();
  }

  function retirerMarqueurBrouillon() {
    if (marqueurBrouillon) {
      carte.removeLayer(marqueurBrouillon);
      marqueurBrouillon = null;
    }
  }

  /** Mémorise la position choisie, l'affiche et pose (ou déplace) le rond provisoire. */
  function fixerPosition(latlng) {
    brouillon.position = latlng;
    afficherPosition(latlng);
    if (!marqueurBrouillon) {
      marqueurBrouillon = L.circleMarker(latlng, STYLE_BROUILLON)
        .bindTooltip('Zone à signaler', { direction: 'top', offset: [0, -10] })
        .addTo(carte);
    } else {
      marqueurBrouillon.setLatLng(latlng);
    }
    cacherErreurSignalement();
  }

  /** « Position : 48.3912, -4.4336 » ou « Position non définie. » */
  function afficherPosition(latlng) {
    if (latlng) {
      elSignalerPosition.textContent = 'Position : ' + latlng.lat.toFixed(4) + ', ' + latlng.lng.toFixed(4);
      elSignalerPosition.classList.add('ok');
    } else {
      elSignalerPosition.textContent = 'Position non définie.';
      elSignalerPosition.classList.remove('ok');
    }
  }

  // « Ma position GPS » : on réutilise localiser() de la partie 7.
  elSignalerGps.addEventListener('click', function () {
    elSignalerGps.disabled = true;
    elSignalerGps.textContent = 'Recherche en cours...';
    localiser()
      .then(function (latlng) {
        fixerPosition(latlng);
        recentrerSur(latlng, Math.max(carte.getZoom(), ZOOM_AUTOUR_DE_MOI));
      })
      .catch(function (erreur) { afficherErreurSignalement(erreur.message); })
      .then(function () {
        elSignalerGps.disabled = false;
        elSignalerGps.textContent = 'Ma position GPS';
      });
  });

  // « Placer sur la carte » : le formulaire se cache, un bandeau explique quoi
  // faire et le prochain toucher sur la carte fixe la position.
  $('signaler-placer').addEventListener('click', commencerPlacement);
  $('annuler-placement').addEventListener('click', annulerPlacement);

  function commencerPlacement() {
    modePlacement = true;
    elPanneauSignaler.hidden = true;
    elBandeauPlacement.hidden = false;
    carte.getContainer().classList.add('curseur-cible');
    $('annuler-placement').focus({ preventScroll: true });
  }

  function terminerPlacement() {
    modePlacement = false;
    elBandeauPlacement.hidden = true;
    carte.getContainer().classList.remove('curseur-cible');
  }

  /** Le point touché devient la position du signalement, et le formulaire revient. */
  function placerSur(latlng) {
    terminerPlacement();
    fixerPosition(latlng);
    ouvrirPanneau(elPanneauSignaler);
    recentrerSur(latlng);
  }

  function annulerPlacement() {
    terminerPlacement();
    ouvrirPanneau(elPanneauSignaler);
  }

  // Photo : lue et réduite tout de suite (1024 px max), aperçu sous le champ.
  $('signaler-photo').addEventListener('change', function (evenement) {
    var champ = evenement.target;
    var fichier = champ.files && champ.files[0];
    brouillon.photo = null;
    elSignalerApercu.hidden = true;
    if (!fichier) { return; }
    GZD.photos.lireEtReduire(fichier)
      .then(function (dataUrl) {
        brouillon.photo = dataUrl;
        elSignalerApercu.src = dataUrl;
        elSignalerApercu.hidden = false;
        cacherErreurSignalement();
      })
      .catch(function (erreur) {
        champ.value = '';
        afficherErreurSignalement(erreur.message);
      });
  });

  // Envoi du formulaire : vérifications, photo puis zone, et la carte se met à jour.
  elFormSignaler.addEventListener('submit', function (evenement) {
    evenement.preventDefault();

    var type = $('signaler-type').value;
    var quantite = $('signaler-quantite').value;

    if (!brouillon.position) {
      afficherErreurSignalement('Indiquez où se trouve la zone : votre position GPS ou un point sur la carte.');
      elSignalerGps.focus();
      return;
    }
    if (!type || !quantite) {
      afficherErreurSignalement('Choisissez le type de déchet et la quantité.');
      return;
    }
    cacherErreurSignalement();

    var nouvelleZone = {
      nom: $('signaler-nom').value.trim() || 'Zone signalée',
      commune: $('signaler-commune').value.trim() || 'Rade de Brest',
      etat: 'rouge',
      type: type,
      quantite: quantite,
      lat: brouillon.position.lat,
      lon: brouillon.position.lng,
      description: $('signaler-description').value.trim(),
      signale_le: new Date().toISOString(),
      photo_url: null
    };

    elSignalerEnvoyer.disabled = true;
    elSignalerEnvoyer.textContent = 'Envoi en cours...';

    // S'il y a une photo, on l'enregistre d'abord pour connaître son URL.
    var photoEnregistree = brouillon.photo
      ? store.enregistrerPhoto(brouillon.photo, GZD.photos.nomDeFichier('signalement'))
      : Promise.resolve(null);

    photoEnregistree
      .then(function (url) {
        nouvelleZone.photo_url = url || null;
        return store.ajouterZone(nouvelleZone);
      })
      .then(function (zone) {
        zones.push(zone);
        ajouterMarqueur(zone);
        mettreAJourCompteur();
        viderBrouillon();
        fermerPanneaux();
        recentrerSur(L.latLng(zone.lat, zone.lon), Math.max(carte.getZoom(), ZOOM_AUTOUR_DE_MOI));
        ouvrirFiche(zone);
        afficherToast('Merci, la zone est signalée');
      })
      .catch(function (erreur) {
        console.error('Signalement impossible :', erreur);
        afficherErreurSignalement(erreur.message || 'Enregistrement impossible, réessayez.');
      })
      .then(function () {
        elSignalerEnvoyer.disabled = false;
        elSignalerEnvoyer.textContent = 'Signaler cette zone';
      });
  });

  function afficherErreurSignalement(texte) {
    elSignalerErreur.textContent = texte;
    elSignalerErreur.hidden = false;
  }

  function cacherErreurSignalement() {
    elSignalerErreur.hidden = true;
    elSignalerErreur.textContent = '';
  }

  /* ------------------------------------------------------------------ */
  /* 9. [S3][US3] Liste des zones rouges, de la plus proche à la plus loin */
  /* ------------------------------------------------------------------ */

  var elPanneauListe  = $('panneau-liste');
  var elListeZones    = $('liste-zones');
  var elListeCompteur = $('liste-compteur');
  var elListeOrigine  = $('liste-origine');

  $('bouton-liste').addEventListener('click', ouvrirListe);

  /**
   * Ouvre la liste tout de suite (avec un texte d'attente), demande la
   * position, puis remplit les lignes. Sans position (refus, délai dépassé,
   * navigateur sans géolocalisation), on trie depuis le centre de la rade et
   * on le dit en une phrase.
   */
  function ouvrirListe() {
    elListeZones.innerHTML = '';
    elListeCompteur.textContent = compterRouges();
    elListeOrigine.textContent = 'Recherche de votre position...';
    ouvrirPanneau(elPanneauListe);
    obtenirOrigine().then(function (origine) {
      if (elPanneauListe.hidden) { return; } // fermée entre-temps
      remplirListe(origine);
    });
  }

  /** Promesse de { latlng, connue } : la position de la personne, sinon le centre de la rade. */
  function obtenirOrigine() {
    return localiser()
      .then(function (latlng) { return { latlng: latlng, connue: true }; })
      .catch(function () {
        if (positionUtilisateur) { return { latlng: positionUtilisateur, connue: true }; }
        return { latlng: L.latLng(CENTRE_RADE), connue: false };
      });
  }

  function remplirListe(origine) {
    var lignes = zones
      .filter(function (z) { return z.etat === 'rouge'; })
      .map(function (z) {
        return { zone: z, distance: distanceKm(origine.latlng, L.latLng(z.lat, z.lon)) };
      })
      .sort(function (a, b) { return a.distance - b.distance; });

    elListeCompteur.textContent = compterRouges();
    elListeOrigine.textContent = origine.connue
      ? 'Distances à vol d\'oiseau depuis votre position.'
      : 'Position inconnue : distances depuis le centre de la rade.';

    elListeZones.innerHTML = '';
    if (!lignes.length) {
      var vide = document.createElement('li');
      vide.className = 'liste-vide';
      vide.textContent = 'Aucune zone rouge pour l\'instant. Bravo, ou signalez-en une.';
      elListeZones.appendChild(vide);
      return;
    }
    lignes.forEach(function (ligne) {
      elListeZones.appendChild(creerLigneZone(ligne.zone, ligne.distance));
    });
  }

  /** Une ligne de la liste : nom, commune, type, quantité, distance. Un clic ouvre la fiche. */
  function creerLigneZone(zone, distance) {
    var li = document.createElement('li');
    var bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'ligne-zone';

    var texte = document.createElement('span');
    var nom = document.createElement('strong');
    nom.textContent = zone.nom || 'Zone sans nom';
    var detail = document.createElement('span');
    detail.className = 'ligne-detail';
    detail.textContent = [zone.commune, majusculeInitiale(zone.type), zone.quantite]
      .filter(Boolean).join(' · ');
    texte.appendChild(nom);
    texte.appendChild(detail);

    var badge = document.createElement('span');
    badge.className = 'distance';
    badge.textContent = formaterDistance(distance);

    bouton.appendChild(texte);
    bouton.appendChild(badge);
    bouton.addEventListener('click', function () {
      recentrerSur(L.latLng(zone.lat, zone.lon), Math.max(carte.getZoom(), ZOOM_AUTOUR_DE_MOI));
      ouvrirFiche(zone);
    });
    li.appendChild(bouton);
    return li;
  }

  /** « 9 zones rouges », « 1 zone rouge » ou « Aucune zone rouge ». */
  function compterRouges() {
    var nombre = zones.filter(function (z) { return z.etat === 'rouge'; }).length;
    if (nombre === 0) { return 'Aucune zone rouge'; }
    return nombre + (nombre === 1 ? ' zone rouge' : ' zones rouges');
  }

  /** Distance à vol d'oiseau entre deux points (formule de haversine), en km. */
  function distanceKm(a, b) {
    var RAYON_TERRE_KM = 6371;
    var dLat = enRadians(b.lat - a.lat);
    var dLon = enRadians(b.lng - a.lng);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(enRadians(a.lat)) * Math.cos(enRadians(b.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(h));
  }

  function enRadians(degres) { return degres * Math.PI / 180; }

  /** « 350 m » sous 1 km, sinon « 2,4 km ». */
  function formaterDistance(km) {
    if (km < 1) { return Math.round(km * 1000) + ' m'; }
    return km.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  }

  /* ------------------------------------------------------------------ */
  /* 10. Compteur et petits utilitaires                                  */
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

  /** « 2026-11-17T15:20:00Z » devient « 17 nov. 2026 » (forme courte pour la fiche). */
  function formaterDateCourte(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) { return iso; }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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

  /** Confirmation courte (vert) en haut de la carte, qui disparaît après 4 s. */
  var elToast = $('toast');
  var minuteurToast = null;
  function afficherToast(texte) {
    elToast.textContent = texte;
    elToast.hidden = false;
    clearTimeout(minuteurToast);
    minuteurToast = setTimeout(function () { elToast.hidden = true; }, 4000);
  }
})();
