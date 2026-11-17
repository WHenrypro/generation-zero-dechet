/*
 * Géné Z(éro) Déchet, couche de données
 * =====================================
 * [S2][US2] Un seul endroit pour lire et écrire les zones et les publications.
 *
 * Partagée par le site (site/) et l'app (app/) : même stockage, mêmes données.
 * Deux modes, choisis automatiquement au chargement :
 *   - « local »    : pas de commun/js/config.js (ou clés vides). Les données vivent
 *                    dans le localStorage du navigateur, initialisées depuis
 *                    commun/data/zones.geojson (zones) et
 *                    commun/data/publications-demo.json (une publication
 *                    exemple pour que le feed ne soit pas vide en démo). C'est le mode de la démo du TP : ça
 *                    marche sans compte ni serveur, chaque navigateur a sa copie.
 *   - « supabase » : commun/js/config.js renseigne SUPABASE_URL et SUPABASE_ANON_KEY.
 *                    On parle à l'API REST de Supabase (PostgREST pour les
 *                    tables, Storage pour les photos) avec fetch, sans
 *                    bibliothèque. Ce mode n'a pas pu être testé sans projet
 *                    Supabase : à vérifier dès que le projet existe (tâche T2).
 *
 * Toutes les fonctions renvoient une promesse. app.js ne sait pas quel mode
 * tourne : il appelle GZD.store.chargerZones(), GZD.store.ajouterZone(...), etc.
 *
 * Forme d'une zone (même chose que la table « zones » de supabase/schema.sql) :
 *   { id, code, nom, commune, etat, type, quantite, lat, lon, description,
 *     signale_le, photo_url }
 * Forme d'une publication (table « publications ») :
 *   { id, zone_id, pseudo, photo_avant_url, photo_apres_url, publie_le }
 */
(function () {
  'use strict';
  window.GZD = window.GZD || {};

  var URL_GEOJSON = '../commun/data/zones.geojson'; // vu depuis site/ ou app/
  var URL_PUBLICATIONS_DEMO = '../commun/data/publications-demo.json';
  var CLE_ZONES = 'gzd.zones';
  var CLE_PUBLICATIONS = 'gzd.publications';
  var BUCKET_PHOTOS = 'photos';
  var COLONNES_ZONE = ['code', 'nom', 'commune', 'etat', 'type', 'quantite',
    'lat', 'lon', 'description', 'signale_le', 'photo_url'];
  var COLONNES_PUBLICATION = ['zone_id', 'pseudo', 'photo_avant_url', 'photo_apres_url', 'publie_le'];

  // commun/js/config.js, s'il existe, déclare ces deux variables globales.
  var config = {
    url: (typeof SUPABASE_URL === 'string') ? SUPABASE_URL.replace(/\/+$/, '') : '',
    cle: (typeof SUPABASE_ANON_KEY === 'string') ? SUPABASE_ANON_KEY : ''
  };
  var mode = (config.url && config.cle) ? 'supabase' : 'local';

  /* ------------------------------------------------------------------ */
  /* Utilitaires communs                                                  */
  /* ------------------------------------------------------------------ */

  function verifierReponse(reponse) {
    if (!reponse.ok) {
      return reponse.text().then(function (texte) {
        throw new Error('Réponse HTTP ' + reponse.status + ' : ' + (texte || reponse.statusText));
      });
    }
    if (reponse.status === 204) { return null; }
    return reponse.json();
  }

  /** Ne garde que les clés attendues par la base (évite d'envoyer id, created_at...). */
  function garder(objet, colonnes) {
    var resultat = {};
    colonnes.forEach(function (cle) {
      if (objet[cle] !== undefined) { resultat[cle] = objet[cle]; }
    });
    return resultat;
  }

  function identifiantLocal(prefixe) {
    return prefixe + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /** Transforme la FeatureCollection de démo en liste de zones « plates ». */
  function geojsonVersZones(geojson) {
    return (geojson.features || []).map(function (feature, index) {
      var p = feature.properties || {};
      var coordonnees = (feature.geometry && feature.geometry.coordinates) || [0, 0];
      return {
        id: p.id || p.code || ('demo-' + (index + 1)),
        code: p.code || p.id || null,
        nom: p.nom || 'Zone sans nom',
        commune: p.commune || '',
        etat: p.etat || 'rouge',
        type: p.type || 'autre',
        quantite: p.quantite || 'un sac',
        lat: coordonnees[1],
        lon: coordonnees[0],
        description: p.description || '',
        signale_le: p.signale_le || null,
        photo_url: p.photo_url || null
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mode local : localStorage                                            */
  /* ------------------------------------------------------------------ */

  function lireLocal(cle) {
    try {
      var texte = localStorage.getItem(cle);
      return texte ? JSON.parse(texte) : null;
    } catch (erreur) {
      console.warn('Lecture du stockage local impossible :', erreur);
      return null;
    }
  }

  function ecrireLocal(cle, valeur) {
    try {
      localStorage.setItem(cle, JSON.stringify(valeur));
    } catch (erreur) {
      // Quota dépassé (les photos prennent de la place) ou stockage désactivé.
      throw new Error('Impossible d\'enregistrer dans ce navigateur (stockage plein ou désactivé).');
    }
  }

  var local = {
    chargerZones: function () {
      var zones = lireLocal(CLE_ZONES);
      if (zones) { return Promise.resolve(zones); }
      return fetch(URL_GEOJSON)
        .then(verifierReponse)
        .then(function (geojson) {
          var liste = geojsonVersZones(geojson);
          try { ecrireLocal(CLE_ZONES, liste); } catch (erreur) { console.warn(erreur.message); }
          return liste;
        });
    },

    ajouterZone: function (zone) {
      return local.chargerZones().then(function (zones) {
        var nouvelle = Object.assign(
          { etat: 'rouge', signale_le: new Date().toISOString() },
          garder(zone, COLONNES_ZONE),
          { id: identifiantLocal('zone') }
        );
        zones.push(nouvelle);
        ecrireLocal(CLE_ZONES, zones);
        return nouvelle;
      });
    },

    mettreAJourZone: function (id, modifications) {
      return local.chargerZones().then(function (zones) {
        var zone = zones.filter(function (z) { return z.id === id; })[0];
        if (!zone) { throw new Error('Zone introuvable : ' + id); }
        Object.assign(zone, garder(modifications, COLONNES_ZONE));
        ecrireLocal(CLE_ZONES, zones);
        return zone;
      });
    },

    /**
     * [S4][US10] Au premier lancement (clé absente, pas tableau vide), le feed
     * reçoit la publication exemple de publications-demo.json. Comme
     * reinitialiser() supprime la clé, l'exemple revient après une
     * réinitialisation de la démo : c'est voulu, la démo ne commence jamais
     * sur un feed vide.
     */
    chargerPublications: function () {
      var publications = lireLocal(CLE_PUBLICATIONS);
      if (publications) { return Promise.resolve(publications); }
      return fetch(URL_PUBLICATIONS_DEMO)
        .then(verifierReponse)
        .then(function (liste) {
          liste = Array.isArray(liste) ? liste : [];
          try { ecrireLocal(CLE_PUBLICATIONS, liste); } catch (erreur) { console.warn(erreur.message); }
          return liste;
        })
        .catch(function (erreur) {
          console.warn('Publication exemple indisponible :', erreur.message);
          return [];
        });
    },

    ajouterPublication: function (publication) {
      return local.chargerPublications().then(function (publications) {
        var nouvelle = Object.assign(
          { publie_le: new Date().toISOString() },
          garder(publication, COLONNES_PUBLICATION),
          { id: identifiantLocal('pub') }
        );
        publications.push(nouvelle);
        ecrireLocal(CLE_PUBLICATIONS, publications);
        return nouvelle;
      });
    },

    /** En local, la « photo enregistrée » est simplement sa data URL. */
    enregistrerPhoto: function (dataUrl) {
      return Promise.resolve(dataUrl);
    },

    /** Efface les données du navigateur et recharge les 15 zones de démo (et la publication exemple au prochain affichage du feed). */
    reinitialiser: function () {
      try {
        localStorage.removeItem(CLE_ZONES);
        localStorage.removeItem(CLE_PUBLICATIONS);
      } catch (erreur) { /* stockage indisponible : rien à effacer */ }
      return local.chargerZones();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Mode Supabase : API REST (PostgREST + Storage)                      */
  /* ------------------------------------------------------------------ */

  function requete(chemin, methode, corps) {
    var entetes = {
      apikey: config.cle,
      Authorization: 'Bearer ' + config.cle,
      Accept: 'application/json'
    };
    var options = { method: methode || 'GET', headers: entetes };
    if (corps !== undefined) {
      entetes['Content-Type'] = 'application/json';
      entetes.Prefer = 'return=representation'; // renvoyer la ligne écrite
      options.body = JSON.stringify(corps);
    }
    return fetch(config.url + chemin, options).then(verifierReponse);
  }

  function premier(liste) {
    return Array.isArray(liste) ? liste[0] : liste;
  }

  var supabase = {
    chargerZones: function () {
      return requete('/rest/v1/zones?select=*&order=signale_le.desc');
    },

    ajouterZone: function (zone) {
      return requete('/rest/v1/zones', 'POST', garder(zone, COLONNES_ZONE)).then(premier);
    },

    mettreAJourZone: function (id, modifications) {
      return requete('/rest/v1/zones?id=eq.' + encodeURIComponent(id), 'PATCH',
        garder(modifications, COLONNES_ZONE)).then(premier);
    },

    chargerPublications: function () {
      return requete('/rest/v1/publications?select=*&order=publie_le.desc');
    },

    ajouterPublication: function (publication) {
      return requete('/rest/v1/publications', 'POST',
        garder(publication, COLONNES_PUBLICATION)).then(premier);
    },

    /**
     * Envoie une photo (data URL JPEG) dans le bucket public « photos » et
     * renvoie son URL publique, à ranger dans la base.
     */
    enregistrerPhoto: function (dataUrl, nomFichier) {
      return fetch(dataUrl)
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          return fetch(config.url + '/storage/v1/object/' + BUCKET_PHOTOS + '/' + nomFichier, {
            method: 'POST',
            headers: {
              apikey: config.cle,
              Authorization: 'Bearer ' + config.cle,
              'Content-Type': blob.type || 'image/jpeg'
            },
            body: blob
          });
        })
        .then(verifierReponse)
        .then(function () {
          return config.url + '/storage/v1/object/public/' + BUCKET_PHOTOS + '/' + nomFichier;
        });
    },

    reinitialiser: function () {
      return Promise.reject(new Error('La réinitialisation n\'existe qu\'en mode local. Sur Supabase, relancer seed.sql.'));
    }
  };

  GZD.store = Object.assign({ mode: mode }, mode === 'supabase' ? supabase : local);
})();
