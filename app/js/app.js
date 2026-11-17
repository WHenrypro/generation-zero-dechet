/*
 * Génération Z(éro déchet), l'app du ramassage : le parcours de Léa
 * ==============================================
 *
 * Une seule page, plusieurs « écrans » affichés ou masqués en JavaScript :
 * l'écran pseudo, puis trois onglets (Feed, Ramasser, Moi).
 *
 * Sprint 3 (US1) : pseudo sans compte ni mot de passe, onglet Moi.
 * Sprint 3 (US5) : zones rouges les plus proches, « J'y vais », ramassage en
 *                  cours gardé dans GZD.session, lien profond ?zone=<id>
 *                  depuis la carte du site.
 * Sprint 4 (US7) : photo avant, réduite par GZD.photos et gardée dans le
 *                  ramassage en cours (un rechargement ne la perd pas).
 * Sprint 4 (US9) : photo après, puis relecture avant / après côte à côte.
 * Sprint 4 (US10) : publication (photos + GZD.store) et feed des ramassages.
 * Sprint 4 (US11) : la zone passe au vert, écran « Bravo », réinitialisation
 *                   de la démo depuis l'onglet Moi.
 *
 * Pas de framework ni de build. Les scripts partagés avec le site sont chargés
 * avant ce fichier et exposent GZD.store (données), GZD.photos (réduction des
 * images) et GZD.session (pseudo et ramassage en cours, dans le localStorage).
 */
(function () {
  'use strict';

  var store = window.GZD.store;
  var session = window.GZD.session;
  var photos = window.GZD.photos;

  /* ------------------------------------------------------------------ */
  /* 1. Réglages et état                                                 */
  /* ------------------------------------------------------------------ */

  var ONGLETS = ['feed', 'ramasser', 'moi'];
  var ONGLET_PAR_DEFAUT = 'feed';
  var DUREE_MESSAGE = 6000;

  // Sans géolocalisation, les distances se comptent depuis le centre de la rade.
  var CENTRE_RADE = { lat: 48.36, lon: -4.45 };
  var URL_SITE = '../site/';

  var etat = {
    onglet: null,             // onglet affiché : 'feed', 'ramasser' ou 'moi'
    ongletApresPseudo: null,  // onglet à rouvrir une fois le pseudo choisi
    position: null,           // { lat, lon } de la personne, une fois connue
    positionRefusee: false,   // la géolocalisation a échoué ou a été refusée
    zoneDepuisCarte: null,    // id de zone reçu dans l'URL (?zone=...)
    pretPourApres: false      // « J'ai fini » a été pressé : on passe à la photo après
  };

  function $(id) { return document.getElementById(id); }

  var elMessage = $('message');
  var elNavigation = document.querySelector('.navigation');
  var elEcranPseudo = $('ecran-pseudo');
  var elChampPseudo = $('champ-pseudo');
  var elPseudoRestant = $('pseudo-restant');
  var elAnnulerPseudo = $('bouton-annuler-pseudo');

  /* ------------------------------------------------------------------ */
  /* 2. Messages et petits utilitaires                                   */
  /* ------------------------------------------------------------------ */

  var minuteurMessage = null;

  /** Affiche un message court en haut de l'écran, qui s'efface tout seul. */
  function afficherMessage(texte, erreur) {
    elMessage.textContent = texte;
    elMessage.className = 'message' + (erreur ? ' erreur' : '');
    clearTimeout(minuteurMessage);
    minuteurMessage = setTimeout(effacerMessage, DUREE_MESSAGE);
  }

  function effacerMessage() {
    elMessage.textContent = '';
    elMessage.className = 'message';
  }

  /**
   * Crée un élément avec ses attributs et ses enfants (texte ou éléments).
   * On passe par textContent, jamais innerHTML : les données affichées
   * (pseudos, noms de zones) ne sont pas interprétées comme du HTML.
   */
  function creer(balise, attributs, enfants) {
    var element = document.createElement(balise);
    Object.keys(attributs || {}).forEach(function (nom) {
      if (nom === 'texte') { element.textContent = attributs[nom]; }
      else if (nom === 'onClick') { element.addEventListener('click', attributs[nom]); }
      else { element.setAttribute(nom, attributs[nom]); }
    });
    (enfants || []).forEach(function (enfant) {
      if (enfant === null || enfant === undefined) { return; }
      element.appendChild(typeof enfant === 'string' ? document.createTextNode(enfant) : enfant);
    });
    return element;
  }

  function vider(element) {
    while (element.firstChild) { element.removeChild(element.firstChild); }
  }

  /** « plusieurs sacs » devient « Plusieurs sacs ». */
  function majusculeInitiale(texte) {
    if (!texte) { return ''; }
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  /** Lit un paramètre de l'URL (?zone=z06), ou null. */
  function lireParametre(nom) {
    var trouve = new RegExp('[?&]' + nom + '=([^&#]*)').exec(window.location.search);
    if (!trouve) { return null; }
    try { return decodeURIComponent(trouve[1].replace(/\+/g, ' ')); } catch (erreur) { return null; }
  }

  /** Retire les paramètres de l'URL sans recharger (un F5 ne rejouera pas ?zone=). */
  function nettoyerUrl() {
    if (window.history && window.history.replaceState && window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  function lienCarte(zoneId) {
    return URL_SITE + (zoneId ? '?zone=' + encodeURIComponent(zoneId) : '');
  }

  /* ------------------------------------------------------------------ */
  /* 3. Onglets et écrans                                                */
  /* ------------------------------------------------------------------ */

  /** Affiche un onglet, masque les autres, met à jour la barre du bas. */
  function ouvrirOnglet(nom) {
    if (ONGLETS.indexOf(nom) === -1) { nom = ONGLET_PAR_DEFAUT; }
    etat.onglet = nom;
    elEcranPseudo.hidden = true;
    elNavigation.hidden = false;

    ONGLETS.forEach(function (autre) {
      var actif = (autre === nom);
      $('onglet-' + autre).hidden = !actif;
      $('tab-' + autre).setAttribute('aria-selected', actif ? 'true' : 'false');
      $('tab-' + autre).tabIndex = actif ? 0 : -1;
    });

    if (nom === 'feed') { afficherFeed(); }
    if (nom === 'ramasser') { afficherRamasser(); }
    if (nom === 'moi') { afficherMoi(); }
    window.scrollTo(0, 0);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.onglet'), function (bouton) {
    bouton.addEventListener('click', function () {
      ouvrirOnglet(bouton.getAttribute('data-onglet'));
    });
  });

  // Flèches gauche / droite entre les onglets, comme attendu d'un tablist.
  elNavigation.addEventListener('keydown', function (evenement) {
    var pas = (evenement.key === 'ArrowRight') ? 1 : (evenement.key === 'ArrowLeft') ? -1 : 0;
    if (!pas) { return; }
    evenement.preventDefault();
    var index = (ONGLETS.indexOf(etat.onglet) + pas + ONGLETS.length) % ONGLETS.length;
    ouvrirOnglet(ONGLETS[index]);
    $('tab-' + ONGLETS[index]).focus();
  });

  /* ------------------------------------------------------------------ */
  /* 4. [S3][US1] Le pseudo                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Affiche l'écran « Choisis ton pseudo ». Si un pseudo existe déjà (on veut
   * en changer), il est pré-rempli et un bouton « Annuler » permet de revenir.
   */
  function afficherEcranPseudo(ongletRetour) {
    var pseudoActuel = session.lirePseudo();
    etat.ongletApresPseudo = ongletRetour || etat.onglet || ONGLET_PAR_DEFAUT;

    ONGLETS.forEach(function (nom) { $('onglet-' + nom).hidden = true; });
    elNavigation.hidden = true;
    elEcranPseudo.hidden = false;

    elChampPseudo.value = pseudoActuel || '';
    elAnnulerPseudo.hidden = !pseudoActuel;
    mettreAJourCompteurPseudo();
    window.scrollTo(0, 0);
    try { elChampPseudo.focus(); } catch (erreur) { /* pas grave */ }
  }

  function mettreAJourCompteurPseudo() {
    var restant = session.LONGUEUR_MAX_PSEUDO - elChampPseudo.value.length;
    elPseudoRestant.textContent = String(Math.max(0, restant));
  }

  elChampPseudo.addEventListener('input', mettreAJourCompteurPseudo);

  $('formulaire-pseudo').addEventListener('submit', function (evenement) {
    evenement.preventDefault();
    var pseudo = session.enregistrerPseudo(elChampPseudo.value);
    if (!pseudo) {
      afficherMessage('Il faut un pseudo, même court.', true);
      elChampPseudo.focus();
      return;
    }
    effacerMessage();
    if (session.lirePseudo() !== pseudo) {
      // Le localStorage a refusé d'écrire : l'app marchera quand même jusqu'au
      // prochain rechargement, mais on prévient.
      afficherMessage('Pseudo gardé pour cette page seulement : le stockage du navigateur est indisponible.', true);
    }
    ouvrirOnglet(etat.ongletApresPseudo);
  });

  elAnnulerPseudo.addEventListener('click', function () {
    ouvrirOnglet(etat.ongletApresPseudo);
  });

  /* ------------------------------------------------------------------ */
  /* 5. [S3][US1] Onglet Moi                                             */
  /* ------------------------------------------------------------------ */

  function afficherMoi() {
    $('moi-pseudo').textContent = session.lirePseudo() || '';
    $('moi-mode').textContent = (store.mode === 'local')
      ? 'Démo locale : les données restent dans ce navigateur.'
      : 'Connecté à Supabase : les données sont partagées avec tout le monde.';
    // [S4][US11] La réinitialisation n'a de sens qu'en démo locale.
    $('carte-demo').hidden = (store.mode !== 'local');
  }

  /** [S4][US11] Remet les zones de départ et vide le feed ; le pseudo reste. */
  $('bouton-reinitialiser').addEventListener('click', function () {
    if (!window.confirm('Réinitialiser la démo ? Les zones reviennent à leur état de départ et le feed est vidé. Ton pseudo est gardé.')) { return; }
    var bouton = this;
    bouton.disabled = true;
    Promise.resolve(store.reinitialiser()).then(function () {
      session.effacerRamassage();
      window.location.reload();
    }).catch(function (erreur) {
      bouton.disabled = false;
      afficherMessage('La réinitialisation a échoué : ' + (erreur.message || 'erreur inconnue'), true);
    });
  });

  $('bouton-changer-pseudo').addEventListener('click', function () {
    afficherEcranPseudo('moi');
  });

  $('bouton-deconnexion').addEventListener('click', function () {
    session.effacerPseudo();
    afficherMessage('À bientôt. Ton pseudo a été effacé de ce navigateur.');
    afficherEcranPseudo(ONGLET_PAR_DEFAUT);
  });

  /* ------------------------------------------------------------------ */
  /* 6. [S3][US5] Position et distances                                  */
  /* ------------------------------------------------------------------ */

  /** Distance à vol d'oiseau en km entre deux points { lat, lon } (haversine). */
  function distanceKm(a, b) {
    var R = 6371;
    var rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad;
    var dLon = (b.lon - a.lon) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  /** « 0.85 » devient « 850 m », « 2.34 » devient « 2,3 km ». */
  function formaterDistance(km) {
    if (km < 1) { return Math.max(10, Math.round(km * 100) * 10) + ' m'; }
    return km.toFixed(1).replace('.', ',') + ' km';
  }

  /**
   * Demande la position une seule fois. Renvoie une promesse qui tient
   * toujours : { lat, lon } si on l'a, null sinon (refus, délai dépassé, http).
   */
  var promessePosition = null;
  function localiser() {
    if (promessePosition) { return promessePosition; }
    promessePosition = new Promise(function (resoudre) {
      if (!navigator.geolocation) {
        etat.positionRefusee = true;
        resoudre(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(function (position) {
        etat.position = { lat: position.coords.latitude, lon: position.coords.longitude };
        resoudre(etat.position);
      }, function () {
        etat.positionRefusee = true;
        resoudre(null);
      }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    });
    return promessePosition;
  }

  /* ------------------------------------------------------------------ */
  /* 7. [S3][US5] Onglet Ramasser : choisir une zone                     */
  /* ------------------------------------------------------------------ */

  var elVueZones = $('vue-zones');
  var elVueEnCours = $('vue-en-cours');
  var elVueRelecture = $('vue-relecture');
  var elVueBravo = $('vue-bravo');
  var elListeZones = $('liste-zones');
  var elZoneChoisie = $('zone-choisie');
  var elZonesPosition = $('zones-position');

  /**
   * Point d'entrée de l'onglet : liste des zones, ramassage en cours, ou
   * relecture avant / après quand les deux photos sont là.
   */
  function afficherRamasser() {
    var ramassage = session.lireRamassage();
    if (!ramassage) {
      afficherListeZones();
    } else if (ramassage.photo_avant && ramassage.photo_apres) {
      afficherRelecture(ramassage);
    } else {
      afficherEnCours(ramassage);
    }
  }

  function montrerVue(vue) {
    elVueZones.hidden = (vue !== elVueZones);
    elVueEnCours.hidden = (vue !== elVueEnCours);
    elVueRelecture.hidden = (vue !== elVueRelecture);
    elVueBravo.hidden = (vue !== elVueBravo);
  }

  /** Le nom et la commune d'une zone, écrits dans deux éléments donnés. */
  function ecrireZone(zoneId, idNom, idCommune) {
    $(idNom).textContent = '...';
    $(idCommune).textContent = '';
    store.chargerZones().then(function (zones) {
      var zone = zones.filter(function (z) { return z.id === zoneId; })[0];
      $(idNom).textContent = zone ? zone.nom : 'Zone inconnue';
      $(idCommune).textContent = zone ? zone.commune : 'Cette zone n\'est plus dans la liste.';
    }).catch(function () {
      $(idNom).textContent = 'Zone ' + zoneId;
    });
  }

  /**
   * Charge les zones et les affiche, triées par distance. On affiche tout de
   * suite depuis le centre de la rade, puis on retrie quand la position arrive.
   */
  function afficherListeZones() {
    montrerVue(elVueZones);
    elZonesPosition.textContent = 'Chargement des zones...';

    store.chargerZones().then(function (zones) {
      construireListeZones(zones);
      if (!etat.position && !etat.positionRefusee) {
        elZonesPosition.textContent = 'Recherche de ta position...';
        localiser().then(function () {
          // Toujours sur la liste ? Alors on retrie avec la vraie position.
          if (!elVueZones.hidden && etat.onglet === 'ramasser' && !session.lireRamassage()) {
            construireListeZones(zones);
          }
        });
      }
    }).catch(function (erreur) {
      elZonesPosition.textContent = '';
      vider(elListeZones);
      elListeZones.appendChild(creer('p', { 'class': 'vide', texte: 'Impossible de charger les zones : ' + erreur.message }));
    });
  }

  function construireListeZones(zones) {
    var origine = etat.position || CENTRE_RADE;
    var zoneChoisie = null;

    // Zone arrivée depuis la carte : mise en avant au-dessus de la liste.
    vider($('zone-choisie-carte'));
    if (etat.zoneDepuisCarte) {
      zoneChoisie = zones.filter(function (z) { return z.id === etat.zoneDepuisCarte; })[0] || null;
      if (!zoneChoisie) {
        afficherMessage('Cette zone n\'est pas (ou plus) dans la liste. Choisis-en une ci-dessous.');
        etat.zoneDepuisCarte = null;
        nettoyerUrl();
      } else {
        $('zone-choisie-carte').appendChild(carteZone(zoneChoisie, origine, true));
      }
    }
    elZoneChoisie.hidden = !zoneChoisie;

    // Les zones rouges, de la plus proche à la plus loin.
    var rouges = zones.filter(function (z) {
      return z.etat === 'rouge' && (!zoneChoisie || z.id !== zoneChoisie.id);
    }).map(function (z) {
      return { zone: z, km: distanceKm(origine, z) };
    }).sort(function (a, b) { return a.km - b.km; });

    vider(elListeZones);
    if (!rouges.length) {
      elListeZones.appendChild(creer('p', { 'class': 'vide',
        texte: 'Aucune zone rouge pour le moment. Tout est propre, ou presque.' }));
    }
    rouges.forEach(function (entree) {
      elListeZones.appendChild(carteZone(entree.zone, origine, false));
    });

    if (etat.position) {
      elZonesPosition.textContent = 'Distances calculées depuis ta position.';
    } else if (etat.positionRefusee) {
      elZonesPosition.textContent = 'Position indisponible : distances calculées depuis le centre de la rade.';
    }
  }

  /** La carte d'une zone : nom, commune, détails, « Voir sur la carte », « J'y vais ». */
  function carteZone(zone, origine, miseEnAvant) {
    var km = distanceKm(origine, zone);
    var details = [
      creer('li', { texte: majusculeInitiale(zone.type) || 'Déchets' }),
      creer('li', { texte: majusculeInitiale(zone.quantite) || 'Quantité inconnue' }),
      creer('li', { 'class': 'distance', texte: formaterDistance(km) })
    ];
    var actions;

    if (zone.etat === 'vert') {
      actions = creer('p', { 'class': 'aide', texte: 'Cette zone est déjà verte. Choisis-en une autre en dessous.' });
    } else {
      actions = creer('div', { 'class': 'actions-ligne' }, [
        creer('a', { 'class': 'bouton bouton-secondaire', href: lienCarte(zone.id), texte: 'Voir sur la carte' }),
        creer('button', { type: 'button', 'class': 'bouton bouton-principal', texte: 'J\'y vais',
          onClick: function () { demarrerRamassage(zone); } })
      ]);
    }

    return creer('article', { 'class': 'carte carte-zone' + (miseEnAvant ? ' mise-en-avant' : '') }, [
      creer('h3', { texte: zone.nom || 'Zone sans nom' }),
      creer('p', { 'class': 'commune' }, [
        zone.commune || '',
        (zone.etat !== 'rouge') ? ' ' : null,
        (zone.etat !== 'rouge') ? badgeEtat(zone.etat) : null
      ]),
      creer('ul', { 'class': 'details' }, details),
      actions
    ]);
  }

  function badgeEtat(etatZone) {
    var libelles = { rouge: 'À nettoyer', orange: 'En cours', vert: 'Nettoyée' };
    return creer('span', { 'class': 'badge badge-' + (libelles[etatZone] ? etatZone : 'inconnu'),
      texte: libelles[etatZone] || 'État inconnu' });
  }

  /* ------------------------------------------------------------------ */
  /* 8. [S3][US5] Ramassage en cours                                     */
  /* ------------------------------------------------------------------ */

  /** « J'y vais » : on mémorise la zone, le reste se passe sur le terrain. */
  function demarrerRamassage(zone) {
    var ok = session.enregistrerRamassage({
      zone_id: zone.id,
      debut: new Date().toISOString(),
      photo_avant: null,
      photo_apres: null
    });
    if (!ok) {
      afficherMessage('Impossible de garder ce ramassage : le stockage du navigateur est indisponible.', true);
      return;
    }
    etat.zoneDepuisCarte = null;
    nettoyerUrl();
    effacerMessage();
    afficherRamasser();
    window.scrollTo(0, 0);
  }

  /** L'écran « Ramassage en cours » : la zone et les quatre étapes. */
  function afficherEnCours(ramassage) {
    montrerVue(elVueEnCours);
    $('en-cours-lien-carte').href = lienCarte(ramassage.zone_id);
    ecrireZone(ramassage.zone_id, 'en-cours-nom', 'en-cours-commune');
    afficherEtapes(ramassage);
  }

  /** Met à jour l'état des quatre étapes (faite, courante, à venir) et leur contenu. */
  function afficherEtapes(ramassage) {
    var courante = !ramassage.photo_avant ? 1
      : !ramassage.photo_apres ? (etat.pretPourApres ? 3 : 2)
      : 4;
    [1, 2, 3, 4].forEach(function (numero) {
      var valeur = (numero < courante) ? 'faite' : (numero === courante) ? 'courante' : 'a-venir';
      $('etape-' + numero).setAttribute('data-etat', valeur);
    });

    // Étape 1 : le bouton photo avant la prise, l'aperçu après.
    $('avant-prise').hidden = !!ramassage.photo_avant;
    $('avant-apercu').hidden = !ramassage.photo_avant;
    $('avant-image').src = ramassage.photo_avant || '';
    $('avant-reprendre').hidden = !ramassage.photo_avant;
    // Tant que la photo après n'est pas prise, on peut reprendre l'avant.
    $('avant-reprendre').className = 'bouton bouton-lien' + (ramassage.photo_apres ? ' seulement-courante' : '');
  }

  function abandonnerRamassage() {
    if (!window.confirm('Abandonner ce ramassage ? Les photos déjà prises seront perdues.')) { return; }
    session.effacerRamassage();
    etat.pretPourApres = false;
    afficherMessage('Ramassage abandonné. La zone reste à nettoyer.');
    afficherRamasser();
    window.scrollTo(0, 0);
  }

  $('bouton-abandonner').addEventListener('click', abandonnerRamassage);
  $('bouton-abandonner-relecture').addEventListener('click', abandonnerRamassage);

  /* ------------------------------------------------------------------ */
  /* 8b. [S4][US9] Relecture avant / après                               */
  /* ------------------------------------------------------------------ */

  /** Les deux photos côte à côte, avant de publier. */
  function afficherRelecture(ramassage) {
    montrerVue(elVueRelecture);
    ecrireZone(ramassage.zone_id, 'relecture-nom', 'relecture-commune');
    $('relecture-avant').src = ramassage.photo_avant || '';
    $('relecture-apres').src = ramassage.photo_apres || '';
    // « Publier » n'est actif que si les deux photos sont là.
    $('bouton-publier').disabled = !(ramassage.photo_avant && ramassage.photo_apres);
  }

  /**
   * [S4][US10] Publier : les deux photos sont enregistrées (en local, la data
   * URL sert d'adresse ; sur Supabase, elles partent dans le bucket), puis la
   * publication est ajoutée et le ramassage en cours effacé.
   */
  $('bouton-publier').addEventListener('click', function () {
    var bouton = this;
    var ramassage = session.lireRamassage();
    var pseudo = session.lirePseudo();
    if (!ramassage || !ramassage.photo_avant || !ramassage.photo_apres) {
      afficherMessage('Il manque une photo pour publier.', true);
      return;
    }
    if (!pseudo) {
      afficherEcranPseudo('ramasser');
      return;
    }

    bouton.disabled = true;
    afficherMessage('Publication en cours...');

    Promise.all([
      store.enregistrerPhoto(ramassage.photo_avant, photos.nomDeFichier('avant')),
      store.enregistrerPhoto(ramassage.photo_apres, photos.nomDeFichier('apres'))
    ]).then(function (urls) {
      return store.ajouterPublication({
        zone_id: ramassage.zone_id,
        pseudo: pseudo,
        photo_avant_url: urls[0],
        photo_apres_url: urls[1],
        publie_le: new Date().toISOString()
      });
    }).then(function () {
      // [S4][US11] La publication est là : la zone passe au vert sur la carte.
      return store.mettreAJourZone(ramassage.zone_id, { etat: 'vert' }).then(function (zone) {
        return zone;
      }, function (erreur) {
        // La publication existe déjà : on ne bloque pas, on prévient.
        afficherMessage('Publié, mais la zone n\'a pas pu passer au vert : ' + (erreur.message || 'erreur inconnue'), true);
        return null;
      });
    }).then(function (zone) {
      session.effacerRamassage();
      etat.pretPourApres = false;
      if (elMessage.textContent === 'Publication en cours...') { effacerMessage(); }
      afficherBravo(pseudo, ramassage.zone_id, zone);
    }).catch(function (erreur) {
      bouton.disabled = false;
      afficherMessage('La publication a échoué : ' + (erreur.message || 'erreur inconnue') + '. Réessaie.', true);
    });
  });

  /** [S4][US11] L'écran « Bravo » : la zone est passée au vert. */
  function afficherBravo(pseudo, zoneId, zone) {
    montrerVue(elVueBravo);
    $('bravo-pseudo').textContent = pseudo;
    $('bravo-zone').textContent = (zone && zone.nom) || 'la zone';
    $('bravo-lien-carte').href = lienCarte(zoneId);
    if (!zone || !zone.nom) {
      store.chargerZones().then(function (zones) {
        var trouvee = zones.filter(function (z) { return z.id === zoneId; })[0];
        if (trouvee) { $('bravo-zone').textContent = trouvee.nom; }
      });
    }
    window.scrollTo(0, 0);
  }

  $('bouton-voir-feed').addEventListener('click', function () { ouvrirOnglet('feed'); });

  /* ------------------------------------------------------------------ */
  /* 8c. [S4][US10] Onglet Feed                                          */
  /* ------------------------------------------------------------------ */

  var elListeFeed = $('liste-feed');
  var elFeedVide = $('feed-vide');
  var elFeedEtat = $('feed-etat');

  $('bouton-feed-ramasser').addEventListener('click', function () { ouvrirOnglet('ramasser'); });

  /** Les publications, de la plus récente à la plus ancienne. */
  function afficherFeed() {
    elFeedEtat.textContent = 'Chargement...';
    elFeedVide.hidden = true;

    Promise.all([store.chargerPublications(), store.chargerZones()]).then(function (resultats) {
      var publications = resultats[0].slice().sort(function (a, b) {
        return (b.publie_le || '') < (a.publie_le || '') ? -1 : 1;
      });
      var zonesParId = {};
      resultats[1].forEach(function (z) { zonesParId[z.id] = z; });

      elFeedEtat.textContent = '';
      vider(elListeFeed);
      elFeedVide.hidden = publications.length > 0;
      publications.forEach(function (publication) {
        elListeFeed.appendChild(cartePublication(publication, zonesParId[publication.zone_id]));
      });
    }).catch(function (erreur) {
      elFeedEtat.textContent = 'Impossible de charger le feed : ' + erreur.message;
    });
  }

  /** Une publication : qui, où, quand, les deux photos, le lien vers la carte. */
  function cartePublication(publication, zone) {
    var nom = zone ? zone.nom : 'une zone';
    var commune = zone && zone.commune ? ' (' + zone.commune + ')' : '';
    return creer('article', { 'class': 'carte publication' }, [
      creer('p', { 'class': 'en-tete' }, [
        creer('span', { 'class': 'pseudo-auteur', texte: publication.pseudo || 'Quelqu\'un' }),
        ' a nettoyé ' + nom + commune
      ]),
      creer('time', { 'class': 'date', datetime: publication.publie_le || '', texte: formaterDate(publication.publie_le) }),
      creer('div', { 'class': 'avant-apres' }, [
        creer('figure', { 'class': 'apercu' }, [
          creer('img', { src: publication.photo_avant_url || '', alt: 'Avant le ramassage', loading: 'lazy' }),
          creer('figcaption', { texte: 'Avant' })
        ]),
        creer('figure', { 'class': 'apercu' }, [
          creer('img', { src: publication.photo_apres_url || '', alt: 'Après le ramassage', loading: 'lazy' }),
          creer('figcaption', { texte: 'Après' })
        ])
      ]),
      creer('a', { 'class': 'lien', href: lienCarte(publication.zone_id), texte: 'Voir sur la carte' })
    ]);
  }

  /** Une date courte en français : « 17 nov. 2026, 14:05 ». */
  function formaterDate(iso) {
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d.getTime())) { return ''; }
    var mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    var deux = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getDate() + ' ' + mois[d.getMonth()] + ' ' + d.getFullYear() + ', ' + deux(d.getHours()) + ':' + deux(d.getMinutes());
  }

  /* ------------------------------------------------------------------ */
  /* 9. [S4][US7] Les photos                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Branche un <input type="file"> : la photo choisie est réduite (JPEG,
   * 1024 px max) puis rangée dans le ramassage en cours sous la clé donnée
   * ('photo_avant' ou 'photo_apres'). L'écran est ensuite redessiné.
   */
  function brancherPhoto(idInput, cle) {
    var input = $(idInput);
    input.addEventListener('change', function () {
      var fichier = input.files && input.files[0];
      input.value = ''; // permet de rechoisir le même fichier (« Reprendre »)
      if (!fichier) { return; }
      var ramassage = session.lireRamassage();
      if (!ramassage) { return; }

      var bouton = input.parentNode;
      bouton.classList.add('en-cours');
      afficherMessage('Photo en cours de traitement...');

      photos.lireEtReduire(fichier).then(function (dataUrl) {
        var modifie = Object.assign({}, ramassage);
        modifie[cle] = dataUrl;
        if (!session.enregistrerRamassage(modifie)) {
          afficherMessage('Stockage plein : la photo n\'a pas pu être gardée. Réinitialise la démo (onglet Moi) pour faire de la place.', true);
          return;
        }
        effacerMessage();
        afficherRamasser();
        window.scrollTo(0, 0);
      }).catch(function (erreur) {
        afficherMessage(erreur.message || 'Impossible de lire cette photo.', true);
      }).then(function () {
        bouton.classList.remove('en-cours');
      });
    });
  }

  brancherPhoto('fichier-avant', 'photo_avant');
  // [S4][US9] La photo après : à l'étape 3, et « Reprendre l'après » en relecture.
  brancherPhoto('fichier-apres', 'photo_apres');
  brancherPhoto('fichier-apres-reprise', 'photo_apres');

  // Étape 2 : « J'ai fini, photo après » ouvre l'étape 3.
  $('bouton-fini').addEventListener('click', function () {
    etat.pretPourApres = true;
    afficherEtapes(session.lireRamassage());
  });

  /* ------------------------------------------------------------------ */
  /* 10. Démarrage                                                       */
  /* ------------------------------------------------------------------ */

  function demarrer() {
    var ramassage = session.lireRamassage();
    etat.zoneDepuisCarte = ramassage ? null : lireParametre('zone');
    if (ramassage) { nettoyerUrl(); }

    // Avec un ramassage en cours ou une zone venue de la carte, on arrive
    // directement sur l'onglet Ramasser.
    var ongletDepart = (ramassage || etat.zoneDepuisCarte) ? 'ramasser' : ONGLET_PAR_DEFAUT;

    if (!session.lirePseudo()) {
      afficherEcranPseudo(ongletDepart);
      return;
    }
    ouvrirOnglet(ongletDepart);
  }

  demarrer();
})();
