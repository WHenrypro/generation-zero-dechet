/*
 * Géné Z(éro) Déchet, l'app : le parcours de Léa
 * ==============================================
 *
 * Une seule page, plusieurs « écrans » affichés ou masqués en JavaScript :
 * l'écran pseudo, puis trois onglets (Feed, Ramasser, Moi).
 *
 * Sprint 3 (US1) : pseudo sans compte ni mot de passe, onglet Moi.
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

  var etat = {
    onglet: null,            // onglet affiché : 'feed', 'ramasser' ou 'moi'
    ongletApresPseudo: null  // onglet à rouvrir une fois le pseudo choisi
  };

  function $(id) { return document.getElementById(id); }

  var elMessage = $('message');
  var elNavigation = document.querySelector('.navigation');
  var elEcranPseudo = $('ecran-pseudo');
  var elChampPseudo = $('champ-pseudo');
  var elPseudoRestant = $('pseudo-restant');
  var elAnnulerPseudo = $('bouton-annuler-pseudo');

  /* ------------------------------------------------------------------ */
  /* 2. Messages                                                         */
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
  /* 6. Démarrage                                                        */
  /* ------------------------------------------------------------------ */

  function demarrer() {
    if (!session.lirePseudo()) {
      afficherEcranPseudo(ONGLET_PAR_DEFAUT);
      return;
    }
    ouvrirOnglet(ONGLET_PAR_DEFAUT);
  }

  demarrer();
})();
