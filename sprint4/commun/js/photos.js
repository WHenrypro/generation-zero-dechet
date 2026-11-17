/*
 * Géné Z(éro) Déchet, photos
 * ==========================
 * [S2][US21] Partagé par le site et l'app. Lire une photo choisie (ou prise) par la personne et la réduire
 * avant de l'enregistrer. Utilisé par le signalement, puis par les photos
 * avant / après du ramassage (sprint 4).
 *
 * Pourquoi réduire : une photo de téléphone fait 3 à 8 Mo. En mode local elle
 * part dans le localStorage (quota d'environ 5 Mo par site), en mode Supabase
 * elle part sur le réseau. On la ramène à 1024 px de côté maximum, en JPEG,
 * ce qui donne en général 80 à 200 ko.
 */
(function () {
  'use strict';
  window.GZD = window.GZD || {};

  var COTE_MAX = 1024;
  var QUALITE_JPEG = 0.78;

  /**
   * @param {File} fichier  fichier image venant d'un <input type="file">
   * @param {number} [coteMax]  taille maximale du grand côté, en pixels
   * @returns {Promise<string>}  data URL « data:image/jpeg;base64,... »
   */
  function lireEtReduire(fichier, coteMax) {
    coteMax = coteMax || COTE_MAX;
    return new Promise(function (resoudre, rejeter) {
      if (!fichier || !/^image\//.test(fichier.type)) {
        rejeter(new Error('Ce fichier n\'est pas une image.'));
        return;
      }
      var urlTemporaire = URL.createObjectURL(fichier);
      var image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(urlTemporaire);
        var ratio = Math.min(1, coteMax / Math.max(image.naturalWidth, image.naturalHeight));
        var largeur = Math.max(1, Math.round(image.naturalWidth * ratio));
        var hauteur = Math.max(1, Math.round(image.naturalHeight * ratio));
        var canvas = document.createElement('canvas');
        canvas.width = largeur;
        canvas.height = hauteur;
        canvas.getContext('2d').drawImage(image, 0, 0, largeur, hauteur);
        try {
          resoudre(canvas.toDataURL('image/jpeg', QUALITE_JPEG));
        } catch (erreur) {
          rejeter(new Error('Impossible de convertir cette image.'));
        }
      };
      image.onerror = function () {
        URL.revokeObjectURL(urlTemporaire);
        rejeter(new Error('Impossible de lire cette image.'));
      };
      image.src = urlTemporaire;
    });
  }

  /** Nom de fichier unique pour Supabase Storage : « signalement-k3f9a-x7q2.jpg ». */
  function nomDeFichier(prefixe) {
    return prefixe + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7) + '.jpg';
  }

  GZD.photos = { lireEtReduire: lireEtReduire, nomDeFichier: nomDeFichier };
})();
