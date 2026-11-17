/* Génération Z(éro déchet) — versions cumulatives alignées sur les sprints Jira.
   Sprint 1 : GZD-6/7/8/9 ; Sprint 2 : GZD-10/11/12 ;
   Sprint 3 : GZD-13/14/15/16/17/18 ; Sprint 4 : GZD-19/20.
   IndexedDB = vraie base locale du navigateur, PAS un serveur partagé.
*/
'use strict';

const supabaseStore = window.GZD.store;

function convertirZoneSupabase(zone) {
  const etats = {
    rouge: 'sale',
    orange: 'progress',
    vert: 'clean'
  };

  return {
    id: zone.id,
    name: zone.nom,
    lat: zone.lat,
    lng: zone.lon,
    type: zone.type,
    quantity: zone.quantite,
    description: zone.description || '',
    status: etats[zone.etat] || 'sale',

    beforeId: null,
    afterId: null,
    reportId: null,
    by: null,
    challenge: false,
    photo_url: zone.photo_url || null
  };
}


const SPRINT=Number(document.body.dataset.sprint||1);
const $=id=>document.getElementById(id);
const GOALS={1:['Une carte de la rade, prête à évoluer','Fondations techniques · base locale · données de démonstration · carte'],2:['Repérer et signaler les déchets','Signalez une zone avec photo, GPS, type et quantité'],3:['Agir pour le littoral','Choisissez une zone, publiez votre avant/après et nettoyez-la'],4:['Agir, mesurer, recommencer','Défi BeReal de 10 minutes et compteur d’impact']};
const SEED=[
{id:'z1',name:'Plage du Moulin Blanc',lat:48.3914,lng:-4.4325,type:'Plastiques',quantity:'Moyenne',description:'Déchets plastiques à proximité du sentier.',status:'sale',beforeId:null,afterId:null,reportId:null,by:null,challenge:false},
{id:'z2',name:'Anse de Sainte-Anne',lat:48.3597,lng:-4.5561,type:'Emballages',quantity:'Faible',description:'Ramassage collectif fictif en cours.',status:'progress',beforeId:null,afterId:null,reportId:null,by:null,challenge:false},
{id:'z3',name:'Plage de Trez-Hir',lat:48.3373,lng:-4.7016,type:'Divers',quantity:'Élevée',description:'Déchets sur le haut de plage.',status:'sale',beforeId:null,afterId:null,reportId:null,by:null,challenge:false},
{id:'z4',name:'Pointe de l’Armorique',lat:48.3439,lng:-4.4158,type:'Plastiques',quantity:'Faible',description:'Zone nettoyée lors d’un précédent ramassage fictif.',status:'clean',beforeId:null,afterId:null,reportId:null,by:'Bénévole démo',challenge:false}
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const color=s=>s==='clean'?'#239b65':s==='progress'?'#e69a38':'#d65752';
const label=s=>s==='clean'?'Nettoyée':s==='progress'?'En cours':'À nettoyer';
let db, zones=[], profile='', selected=null, map, markers=[], photoUrls=[], activeTab='zones', timerHandle=null, pendingPick=false;
let challenge={zoneId:null,deadline:0};
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('gzd-jira-prototype',1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('zones'))d.createObjectStore('zones',{keyPath:'id'});if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'});if(!d.objectStoreNames.contains('settings'))d.createObjectStore('settings',{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function getAll(store){return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function get(store,key){return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function put(store,value){return new Promise((resolve,reject)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).put(value);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error)})}
function clearAll(){return Promise.all(['zones','photos','settings'].map(store=>new Promise((resolve,reject)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).clear();t.oncomplete=resolve;t.onerror=()=>reject(t.error)})))}

async function load() {
  const zonesSupabase = await supabaseStore.chargerZones();

  zones = zonesSupabase.map(convertirZoneSupabase);

  const p = await get('settings', 'profile');
  profile = p?.value || '';

  const ch = await get('settings', 'challenge');
  challenge = ch?.value || { zoneId: null, deadline: 0 };

  if (challenge.deadline < Date.now()) {
    challenge = { zoneId: null, deadline: 0 };
  }

  selected = zones[0]?.id || null;
}

async function refresh() {
  const zonesSupabase = await supabaseStore.chargerZones();

  zones = zonesSupabase.map(convertirZoneSupabase);

  if (!zones.some(z => z.id === selected)) {
    selected = zones[0]?.id || null;
  }

  await render();
}
function current(){return zones.find(z=>z.id===selected)}
function cleanPhotoUrls(){photoUrls.forEach(u=>URL.revokeObjectURL(u));photoUrls=[]}
async function photoSrc(id){if(!id)return null;const item=await get('photos',id);if(!item)return null;const url=URL.createObjectURL(item.blob);photoUrls.push(url);return url}
async function savePhoto(file){if(!file||!file.type.startsWith('image/'))throw Error('Veuillez sélectionner une image valide.');if(file.size>15*1024*1024)throw Error('Photo trop volumineuse (15 Mo max).');const id=uid();await put('photos',{id,blob:file});return id}
function nav(){const tabs=[['zones','Zones']];if(SPRINT>=2)tabs.push(['report','Signaler']);if(SPRINT>=3)tabs.push(['profile','Mon profil']);if(SPRINT>=4)tabs.push(['impact','Impact']);$('nav').innerHTML=tabs.map(([id,name])=>`<button type="button" class="${activeTab===id?'':'secondary'}" data-tab="${id}">${name}</button>`).join('');document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab))}
function showTab(tab){activeTab=tab;for(const id of ['zones','report','profile','impact'])$(id+'View').classList.toggle('hidden',id!==tab);nav()}
function drawMarkers(){markers.forEach(m=>map.removeLayer(m));markers=[];zones.forEach(z=>{const m=L.circleMarker([z.lat,z.lng],{radius:11,weight:2,color:'white',fillOpacity:.97,fillColor:color(z.status)}).addTo(map);m.bindTooltip(esc(z.name));m.on('click',()=>select(z.id));markers.push(m)})}
async function select(id){selected=id;const z=current();if(z)map.panTo([z.lat,z.lng]);showTab('zones');await render()}
function timerText(){if(!challenge.deadline)return '10:00';const sec=Math.max(0,Math.ceil((challenge.deadline-Date.now())/1000));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function tickTimer(){const t=$('timerText');if(t)t.textContent=timerText();if(challenge.deadline&&challenge.deadline<=Date.now()){challenge={zoneId:null,deadline:0};put('settings',{key:'challenge',value:challenge}).catch(console.error);if(t)t.textContent='Temps écoulé'}}
async function render(){cleanPhotoUrls();drawMarkers();$('zoneCount').textContent=zones.length;$('cleanCount').textContent=zones.filter(z=>z.status==='clean').length;
$('zoneList').innerHTML=zones.map(z=>`<div class="zone ${z.id===selected?'active':''}" data-zone="${esc(z.id)}"><strong>${esc(z.name)}</strong><span class="pill ${z.status}">${label(z.status)}</span> <span class="small">${esc(z.type)}</span></div>`).join('');document.querySelectorAll('[data-zone]').forEach(el=>el.onclick=()=>select(el.dataset.zone));
if(SPRINT>=4){$('impactZones').textContent=zones.filter(z=>z.status==='clean').length;const publications = await supabaseStore.chargerPublications();

$('impactMine').textContent = publications.filter(
  p => p.pseudo === profile && profile !== ''
).length;const defis = await Promise.all(
  zones.map(z => get('settings', 'defi-' + z.id))
);

$('impactChallenges').textContent = defis.filter(
  d => d?.value?.reussi === true && d.value.pseudo === profile
).length;}
const z=current();if(!z){$('details').innerHTML='<p class="empty">Aucune zone sélectionnée.</p>';return}
let h=`<h3>${esc(z.name)}</h3><span class="pill ${z.status}">${label(z.status)}</span><p>${esc(z.description)}</p><div class="facts"><div><b>Déchets :</b> ${esc(z.type)}</div><div><b>Quantité :</b> ${esc(z.quantity)}</div><div><b>Coordonnées :</b> ${Number(z.lat).toFixed(4)}, ${Number(z.lng).toFixed(4)}</div></div>`;
if(SPRINT===1)h+='<p class="notice">Sprint 1 : données de démonstration, carte interactive et stockage IndexedDB prêts. Signalement disponible au sprint 2.</p>';
if(SPRINT>=2){if (z.photo_url) {
  h += `<hr class="divider">
        <b>Photo du signalement</b>
        <img class="photo" src="${esc(z.photo_url)}" alt="Photo du signalement">`;
}}
if(SPRINT>=3){h+='<hr class="divider"><h3>Participer au ramassage</h3>';h+=`<p class="small">Profil : ${esc(profile||'non renseigné')}</p>`;
if(z.status==='sale')h+='<button id="startClean">Choisir cette zone et commencer</button>';
if(z.status==='progress')h+='<div class="notice">Cette zone est en cours de ramassage. Vous pouvez publier un avant/après.</div>';
if(z.status==='progress'){
if(SPRINT>=4){h+=`<hr class="divider"><h3>Défi BeReal du littoral</h3>`;if(challenge.zoneId===z.id&&challenge.deadline>Date.now())h+=`<div class="timer" id="timerText">${timerText()}</div><p class="hint">Publiez avant la fin du compte à rebours pour réussir le défi.</p>`;else h+='<button class="secondary" id="startChallenge">Lancer le défi de 10 minutes</button><p class="hint">Le défi est facultatif ; vous pouvez aussi publier sans chronomètre.</p>'}
h+=`<hr class="divider"><form id="cleanForm" class="stack"><div class="field"><label for="beforeFile">Photo avant (US7)</label><input type="file" id="beforeFile" accept="image/*" required></div><div class="field"><label for="afterFile">Photo après (US9)</label><input type="file" id="afterFile" accept="image/*" required></div><button id="publish" type="submit">Publier l’avant/après · zone verte</button></form>`}

if (z.status === 'clean') {
  const publicationsZone = await supabaseStore.chargerPublications();
  const publication = publicationsZone.find(p => p.zone_id === z.id);

  if (publication) {
    h += `
      <hr class="divider">
      <div class="photos">
        <div>
          <strong>Avant</strong>
          <img class="photo" src="${esc(publication.photo_avant_url)}" alt="Avant ramassage">
        </div>
        <div>
          <strong>Après</strong>
          <img class="photo" src="${esc(publication.photo_apres_url)}" alt="Après ramassage">
        </div>
      </div>
      <p class="hint">Ramassage publié par ${esc(publication.pseudo)}</p>
    `;
  }
}

if(z.by)h+=`<p class="hint">Ramassage publié par ${esc(z.by)}${z.challenge?' · défi réussi':''}.</p>`;
}
$('details').innerHTML=h;

if ($('startClean')) {
  $('startClean').onclick = async () => {

    if (!profile) {
      alert('Créez d’abord un profil simple.');
      showTab('profile');
      return;
    }

    try {
      // Modifier l'état de la zone dans Supabase
      await supabaseStore.mettreAJourZone(z.id, {
        etat: 'orange'
      });

      // Actualiser les données de la carte
      await refresh();

      alert('Ramassage commencé ! La zone est maintenant orange.');

    } catch (err) {
      console.error(err);
      alert('Impossible de commencer le ramassage : ' + err.message);
    }
  };
}

if($('startChallenge'))$('startChallenge').onclick=async()=>{if(!profile){alert('Renseignez votre pseudo.');showTab('profile');return}challenge={zoneId:z.id,deadline:Date.now()+10*60*1000};await put('settings',{key:'challenge',value:challenge});await render()};

if ($('cleanForm')) {
  $('cleanForm').onsubmit = async e => {
    e.preventDefault();

    if (!profile) {
      alert('Renseignez votre pseudo.');
      showTab('profile');
      return;
    }

    const before = $('beforeFile').files[0];
    const after = $('afterFile').files[0];

    if (!before || !after) {
      alert('Les deux photos sont obligatoires.');
      return;
    }

    const btn = $('publish');
    btn.disabled = true;
    btn.textContent = 'Publication en cours...';

    try {
      // 1. Convertir les photos en Data URL
      function lirePhoto(file) {
        return new Promise((resolve, reject) => {
          const lecteur = new FileReader();

          lecteur.onload = () => resolve(lecteur.result);
          lecteur.onerror = () => reject(new Error('Impossible de lire la photo.'));

          lecteur.readAsDataURL(file);
        });
      }

      const photoAvant = await lirePhoto(before);
      const photoApres = await lirePhoto(after);

      // 2. Envoyer les photos dans Supabase Storage
      const identifiant = crypto.randomUUID();

      const urlAvant = await supabaseStore.enregistrerPhoto(
        photoAvant,
        'avant-' + identifiant + '.jpg'
      );

      const urlApres = await supabaseStore.enregistrerPhoto(
        photoApres,
        'apres-' + identifiant + '.jpg'
      );

      // 3. Créer une publication dans Supabase
      await supabaseStore.ajouterPublication({
        zone_id: z.id,
        pseudo: profile,
        photo_avant_url: urlAvant,
        photo_apres_url: urlApres,
        publie_le: new Date().toISOString()
      });

      // 4. Passer la zone au vert dans Supabase
      await supabaseStore.mettreAJourZone(z.id, {
        etat: 'vert'
      });

      // 5. Conserver localement le résultat du défi BeReal
      const defiReussi =
        SPRINT >= 4 &&
        challenge.zoneId === z.id &&
        challenge.deadline > Date.now();

      await put('settings', {
        key: 'defi-' + z.id,
        value: {
          pseudo: profile,
          reussi: defiReussi
        }
      });

      // 6. Réinitialiser le chronomètre
      if (challenge.zoneId === z.id) {
        challenge = { zoneId: null, deadline: 0 };

        await put('settings', {
          key: 'challenge',
          value: challenge
        });
      }

      // 7. Actualiser la carte
      await refresh();

      alert('Bravo ! Ton ramassage a été publié et la zone est maintenant verte.');

    } catch (err) {
      console.error(err);
      alert('Erreur lors de la publication : ' + err.message);

    } finally {
      btn.disabled = false;
      btn.textContent = 'Publier l’avant/après · zone verte';
    }
  };
}
}


async function init(){try{if(typeof L==='undefined')throw Error('Leaflet ne s’est pas chargé : vérifiez la connexion Internet.');db=await openDB();await load();$('dbStatus').textContent='Supabase connecté';$('goal').textContent=GOALS[SPRINT][0];$('subtitle').textContent=GOALS[SPRINT][1];map=L.map('map').setView([48.375,-4.53],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);map.on('click',e=>{if(!pendingPick)return;pendingPick=false;$('newLat').value=e.latlng.lat.toFixed(6);$('newLng').value=e.latlng.lng.toFixed(6);alert('Position sélectionnée. Terminez le signalement dans le formulaire.')});
$('locate').onclick=()=>{map.locate({setView:true,maxZoom:14});map.once('locationerror',()=>alert('Localisation indisponible.'))};$('reset').onclick=async()=>{if(!confirm('Effacer les données locales (profil et défis) ? Les données Supabase seront conservées.'))return;await clearAll();location.reload()};
$('pickOnMap').onclick=()=>{pendingPick=true;alert('Cliquez maintenant sur la carte pour choisir la position du signalement.')};

$('reportForm').onsubmit = async e => {
  e.preventDefault();

  const lat = Number($('newLat').value);
  const lng = Number($('newLng').value);
  const name = $('newName').value.trim();
  const file = $('reportPhoto').files[0];

  if (
    !name ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < 48.20 || lat > 48.55 ||
    lng < -4.90 || lng > -4.10
  ) {
    alert('Nom ou coordonnées invalides pour la rade de Brest.');
    return;
  }

  if (!file) {
    alert('Une photo est obligatoire.');
    return;
  }

  const btn = $('reportSubmit');
  btn.disabled = true;
  btn.textContent = 'Publication en cours...';

  try {
    // Convertir le fichier en Data URL
   const dataUrl = await new Promise((resolve, reject) => {
  const lecteur = new FileReader();

  lecteur.onload = () => resolve(lecteur.result);
  lecteur.onerror = () => reject(new Error('Impossible de lire la photo.'));

  lecteur.readAsDataURL(file);
});

// Envoyer la photo à Supabase
const photoUrl = await supabaseStore.enregistrerPhoto(
  dataUrl,
  'signalement-' + Date.now() + '.jpg'
);

    // 2. Créer la zone dans Supabase
    const nouvelleZone = await supabaseStore.ajouterZone({
      code: 'signalement-' + crypto.randomUUID(),
      nom: name,
      commune: 'Rade de Brest',
      etat: 'rouge',
      type: $('newType').value.toLowerCase(),
      quantite: $('newQty').value.toLowerCase(),
      lat: lat,
      lon: lng,
      description: $('newDesc').value.trim() || 'Signalement citoyen',
      photo_url: photoUrl,
      signale_le: new Date().toISOString()
    });

    // 3. Actualiser la carte
    e.target.reset();

    await refresh();

    if (nouvelleZone && nouvelleZone.id) {
      await select(nouvelleZone.id);
    }

    alert('Signalement publié ! La zone est maintenant visible par tous.');

  } catch (err) {
    console.error(err);
    alert('Erreur lors du signalement : ' + err.message);

  } finally {
    btn.disabled = false;
    btn.textContent = 'Publier le signalement';
  }
};

$('profileForm').onsubmit=async e=>{e.preventDefault();const p=$('pseudo').value.trim();if(p.length<2||p.length>30)return alert('Pseudo : 2 à 30 caractères.');profile=p;await put('settings',{key:'profile',value:p});showTab('zones');await render()};$('pseudo').value=profile;
showTab('zones');await render();if(SPRINT>=4)timerHandle=setInterval(tickTimer,500);
}catch(err){console.error(err);$('dbStatus').textContent='Erreur';$('details').innerHTML=`<p class="notice warning">Initialisation impossible : ${esc(err.message)}. Ouvrez la page avec Live Server et vérifiez la console.</p>`}}
document.addEventListener('DOMContentLoaded',init);
