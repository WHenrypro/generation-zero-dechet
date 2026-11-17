/*
 * Géné Z(éro) Déchet, l'app : le parcours de Léa
 * ==============================================
 *
 * Une seule page, plusieurs « écrans » affichés ou masqués en JavaScript :
 * l'écran pseudo, puis trois onglets (Feed, Ramasser, Moi).
 *
 * Sprint 3 (US1) : pseudo sans compte ni mot de passe, onglet Moi.
 * Sprint 3 (US5) : zones rouges les plus proches, « J'y vais », ramassage en
 *                  cours gardé dans GZD.session, lien profond ?zone=<id>
 *                  depuis la carte du site.
 *
 * Pas de framework ni de build. Les scripts partagés avec le site sont chargés
 * avant ce fichier et exposent GZD.store (données), GZD.photos (réduction des
 * images) et GZD.session (pseudo et ramassage en cours, dans le localStorage).
 */
(function () {
  'use strict';

  var store = window.GZD.store;
  var session = window.GZD.session;

  /* ------------------------------------------------------------------ */
  /* 1. Réglages et état                                                 */
  /* ------------------------------------------------------------------ */

  var ONGLETS = ['feed', 'ramasser', 'moi'];
  var ONGLET_PAR_DEFAUT = 'feed';
  var DUREE_MESSAGE = 6000;

  // Sans géolocalisation, les distances se comptent depuis le centre de la rade.
  var CENTRE_RADE = { lat: 48.36, lon: -4.45 };
  var URL_SITE = '../index.html';

  var etat = {
    onglet: null,             // onglet affiché : 'feed', 'ramasser' ou 'moi'
    ongletApresPseudo: null,  // onglet à rouvrir une fois le pseudo choisi
    position: null,           // { lat, lon } de la personne, une fois connue
    positionRefusee: false,   // la géolocalisation a échoué ou a été refusée
    zoneDepuisCarte: null     // id de zone reçu dans l'URL (?zone=...)
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
  }

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
  var elListeZones = $('liste-zones');
  var elZoneChoisie = $('zone-choisie');
  var elZonesPosition = $('zones-position');

  /** Point d'entrée de l'onglet : liste des zones, ou ramassage en cours. */
  function afficherRamasser() {
    var ramassage = session.lireRamassage();
    if (ramassage) {
      afficherEnCours(ramassage);
    } else {
      afficherListeZones();
    }
  }

  function montrerVue(vue) {
    elVueZones.hidden = (vue !== elVueZones);
    elVueEnCours.hidden = (vue !== elVueEnCours);
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
    var libelles = { rouge: 'À nettoyer', orange: 'Ramassage en cours', vert: 'Nettoyée' };
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
    $('en-cours-nom').textContent = '...';
    $('en-cours-commune').textContent = '';

    store.chargerZones().then(function (zones) {
      var zone = zones.filter(function (z) { return z.id === ramassage.zone_id; })[0];
      $('en-cours-nom').textContent = zone ? zone.nom : 'Zone inconnue';
      $('en-cours-commune').textContent = zone ? zone.commune : 'Cette zone n\'est plus dans la liste.';
    }).catch(function () {
      $('en-cours-nom').textContent = 'Zone ' + ramassage.zone_id;
    });

    afficherEtapes(ramassage);
  }

  /** Met à jour l'état des quatre étapes (faite, courante, à venir). */
  function afficherEtapes(ramassage) {
    var courante = !ramassage.photo_avant ? 1 : !ramassage.photo_apres ? 3 : 4;
    [1, 2, 3, 4].forEach(function (numero) {
      var valeur = (numero < courante) ? 'faite' : (numero === courante) ? 'courante' : 'a-venir';
      $('etape-' + numero).setAttribute('data-etat', valeur);
    });
  }

  $('bouton-abandonner').addEventListener('click', function () {
    if (!window.confirm('Abandonner ce ramassage ? Les photos déjà prises seront perdues.')) { return; }
    session.effacerRamassage();
    afficherMessage('Ramassage abandonné. La zone reste à nettoyer.');
    afficherRamasser();
  });

  /* ------------------------------------------------------------------ */
  /* 9. Démarrage                                                        */
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
