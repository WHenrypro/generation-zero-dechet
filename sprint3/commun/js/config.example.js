/*
 * Configuration Supabase (Sprint 2), fichier modèle.
 *
 * 1. Copier ce fichier en config.js (même dossier) :
 *      cp commun/js/config.example.js commun/js/config.js
 * 2. Renseigner les deux valeurs ci-dessous. Elles se trouvent dans le
 *    tableau de bord Supabase, paramètres du projet, rubrique API
 *    (intitulé exact à vérifier dans l'interface).
 * 3. Recharger le site ou l'app : les deux pages chargent ../commun/js/config.js
 *    et passent en mode Supabase si les deux valeurs sont remplies.
 *
 * commun/js/config.js est ignoré par git (voir .gitignore à la racine du dépôt).
 * On ne commite jamais de clés, même la clé « anon » qui est publique par
 * nature, pour garder la même habitude que sur un vrai projet.
 *
 * Les variables sont déclarées avec var, donc globales : store.js pourra les
 * lire directement (window.SUPABASE_URL) sans module ni build.
 */
var SUPABASE_URL = '';      // ex. : https://xxxxxxxxxxxx.supabase.co
var SUPABASE_ANON_KEY = ''; // la clé publique « anon », jamais la clé « service_role »
