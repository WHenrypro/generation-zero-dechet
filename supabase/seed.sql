-- ===========================================================================
-- Géné Z(éro) Déchet, données de démo (Sprint 1, tâche T3)
-- ===========================================================================
-- Les 15 zones de app/data/zones.geojson, avec exactement les mêmes valeurs.
-- À exécuter dans le SQL Editor de Supabase APRÈS schema.sql.
-- Relançable sans risque : une zone dont le code existe déjà est ignorée.
-- Les dates sont en heure de Paris (UTC+1 en novembre).
-- ===========================================================================

insert into public.zones
  (code, nom, commune, etat, type, quantite, lat, lon, description, signale_le)
values
  ('z01', 'Plage du Minou', 'Plouzané', 'rouge', 'filets et cordages', 'plusieurs sacs', 48.33947, -4.61576, 'Cordages et morceaux de filets échoués au pied de la dune après les coups de vent de la semaine.', '2026-11-08T09:15:00+01:00'),
  ('z02', 'Anse du Dellec', 'Plouzané', 'vert', 'plastique', 'un sac', 48.35170, -4.56791, 'Bouteilles et emballages dans les rochers sous le fort. Zone nettoyée le 9 novembre.', '2026-11-02T16:40:00+01:00'),
  ('z03', 'Plage de Sainte-Anne du Portzic', 'Brest', 'rouge', 'mégots', 'poignée', 48.36163, -4.55377, 'Mégots concentrés autour des bancs et de l''escalier d''accès à la plage.', '2026-11-15T18:05:00+01:00'),
  ('z04', 'Quai de la Douane, port de commerce', 'Brest', 'orange', 'verre', 'un sac', 48.38276, -4.48387, 'Bouteilles cassées le long du quai après le week-end. Un ramassage est en cours.', '2026-11-14T08:30:00+01:00'),
  ('z05', 'Port de plaisance du Moulin Blanc', 'Brest', 'vert', 'métal', 'poignée', 48.39205, -4.43216, 'Canettes et capsules près de la cale de mise à l''eau. Nettoyée le 5 novembre.', '2026-11-03T12:20:00+01:00'),
  ('z06', 'Plage du Moulin Blanc', 'Brest', 'rouge', 'plastique', 'plusieurs sacs', 48.39522, -4.43350, 'Laisse de mer chargée de plastiques (bouchons, fragments, emballages) sur la partie ouest de la plage.', '2026-11-16T10:45:00+01:00'),
  ('z07', 'Cale du Passage', 'Le Relecq-Kerhuon', 'rouge', 'autre', 'encombrant', 48.39687, -4.38191, 'Un pneu et des morceaux de polystyrène coincés dans la vase à côté de la cale.', '2026-11-11T14:10:00+01:00'),
  ('z08', 'Anse de Kerhuon', 'Le Relecq-Kerhuon', 'rouge', 'plastique', 'plusieurs sacs', 48.40661, -4.38284, 'Déchets plastiques piégés dans la végétation de la vasière, visibles à marée basse.', '2026-11-09T11:00:00+01:00'),
  ('z09', 'Pointe de l''Armorique', 'Plougastel-Daoulas', 'rouge', 'filets et cordages', 'encombrant', 48.32696, -4.45917, 'Gros morceau de filet de pêche et bouts de cordage entre les rochers sous la pointe.', '2026-11-06T15:30:00+01:00'),
  ('z10', 'Grève du Caro', 'Plougastel-Daoulas', 'vert', 'verre', 'poignée', 48.34101, -4.44023, 'Quelques bouteilles sur la grève. Nettoyée le 4 novembre lors d''une sortie du dimanche.', '2026-11-01T10:00:00+01:00'),
  ('z11', 'Port du Tinduff', 'Plougastel-Daoulas', 'orange', 'métal', 'un sac', 48.33718, -4.36964, 'Ferraille et vieux câbles au bout du quai. Une bénévole a commencé le ramassage.', '2026-11-13T17:20:00+01:00'),
  ('z12', 'Port de Lauberlac''h', 'Plougastel-Daoulas', 'rouge', 'autre', 'un sac', 48.33737, -4.41393, 'Restes de pique-nique et sacs abandonnés près de la cale du port.', '2026-11-10T09:50:00+01:00'),
  ('z13', 'Pointe des Espagnols', 'Roscanvel', 'vert', 'mégots', 'poignée', 48.34178, -4.53186, 'Mégots au point de vue, autour du parking. Nettoyée le 7 novembre.', '2026-11-04T13:15:00+01:00'),
  ('z14', 'Port de Roscanvel', 'Roscanvel', 'rouge', 'plastique', 'un sac', 48.31415, -4.54649, 'Bidons et bouts de plastique échoués sur la grève à côté du port.', '2026-11-12T16:00:00+01:00'),
  ('z15', 'Grève du Fret', 'Crozon', 'rouge', 'filets et cordages', 'plusieurs sacs', 48.28543, -4.50777, 'Filets, cordages et flotteurs déposés par la marée sur la grève à l''ouest du port.', '2026-11-07T08:40:00+01:00')
on conflict (code) do nothing;
