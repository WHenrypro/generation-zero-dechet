/*
 * Géné Z(éro) Déchet, session partagée
 * ====================================
 * [S3][US1] Le « compte » du MVP tient en un pseudo, sans email ni mot de
 * passe, gardé dans le localStorage. Le site (site/) et l'app (app/) sont
 * servis depuis la même origine, donc ils voient le même pseudo.
 *
 * On y garde aussi le ramassage en cours (US5, US7, US9) : la zone choisie
 * et les photos avant / après pas encore publiées, pour qu'un rechargement de
 * la page ne fasse rien perdre.
 */
(function () {
  'use strict';
  window.GZD = window.GZD || {};

  var CLE_PSEUDO = 'gzd.pseudo';
  var CLE_RAMASSAGE = 'gzd.ramassage';
  var LONGUEUR_MAX_PSEUDO = 24;

  function lire(cle) {
    try {
      var texte = localStorage.getItem(cle);
      return texte ? JSON.parse(texte) : null;
    } catch (erreur) {
      return null;
    }
  }

  function ecrire(cle, valeur) {
    try {
      if (valeur === null || valeur === undefined) {
        localStorage.removeItem(cle);
      } else {
        localStorage.setItem(cle, JSON.stringify(valeur));
      }
      return true;
    } catch (erreur) {
      console.warn('Stockage local indisponible :', erreur);
      return false;
    }
  }

  GZD.session = {
    /** @returns {string|null} le pseudo choisi, ou null si personne n'est « connecté » */
    lirePseudo: function () {
      var pseudo = lire(CLE_PSEUDO);
      return (typeof pseudo === 'string' && pseudo.trim()) ? pseudo : null;
    },

    /** Nettoie et enregistre le pseudo. Renvoie le pseudo gardé, ou null s'il est vide. */
    enregistrerPseudo: function (pseudo) {
      var propre = String(pseudo || '').trim().replace(/\s+/g, ' ').slice(0, LONGUEUR_MAX_PSEUDO);
      if (!propre) { return null; }
      ecrire(CLE_PSEUDO, propre);
      return propre;
    },

    effacerPseudo: function () { ecrire(CLE_PSEUDO, null); },

    /**
     * Ramassage en cours : { zone_id, debut (ISO), photo_avant (data URL ou null),
     * photo_apres (data URL ou null) }, ou null.
     */
    lireRamassage: function () {
      var r = lire(CLE_RAMASSAGE);
      return (r && r.zone_id) ? r : null;
    },

    /** Remplace le ramassage en cours. Renvoie false si le stockage est plein. */
    enregistrerRamassage: function (ramassage) {
      return ecrire(CLE_RAMASSAGE, Object.assign({
        zone_id: null, debut: new Date().toISOString(), photo_avant: null, photo_apres: null
      }, ramassage || {}));
    },

    effacerRamassage: function () { ecrire(CLE_RAMASSAGE, null); },

    LONGUEUR_MAX_PSEUDO: LONGUEUR_MAX_PSEUDO
  };
})();
