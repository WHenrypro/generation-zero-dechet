/* Génération Z(éro déchet) — prototype pédagogique, sans serveur.
   Les données et photos sont stockées dans le navigateur local (localStorage).
   CONFIG.SPRINT active progressivement les fonctionnalités du MVP. */
const CONFIG={SPRINT:Number(document.body.dataset.sprint||4),KEY:'gzdd-demo-v1'};
const $=id=>document.getElementById(id);
const SEED=[
{id:'z1',name:'Plage du Moulin Blanc',lat:48.3914,lng:-4.4325,type:'Plastiques',quantity:'Moyenne',description:'Déchets plastiques près du chemin côtier.',status:'sale',before:null,after:null,by:null},
{id:'z2',name:'Anse de Sainte-Anne',lat:48.3597,lng:-4.5561,type:'Emballages',quantity:'Faible',description:'Emballages signalés sur la plage.',status:'sale',before:null,after:null,by:null},
{id:'z3',name:'Plage de Trez-Hir',lat:48.3373,lng:-4.7016,type:'Divers',quantity:'Élevée',description:'Déchets sur la partie haute de la plage.',status:'sale',before:null,after:null,by:null},
{id:'z4',name:'Pointe de l’Armorique',lat:48.3439,lng:-4.4158,type:'Plastiques',quantity:'Faible',description:'Quelques déchets à proximité du sentier.',status:'sale',before:null,after:null,by:null}];
const clone=x=>JSON.parse(JSON.stringify(x));
function load(){try{const x=JSON.parse(localStorage.getItem(CONFIG.KEY));if(x&&Array.isArray(x.zones))return x;}catch(e){}return{pseudo:'',zones:clone(SEED)}}
let state=load(),selected=state.zones[0].id,map,markers=[],pendingBefore=null,pendingAfter=null;
function save(){try{localStorage.setItem(CONFIG.KEY,JSON.stringify(state));return true}catch(e){alert('Stockage local saturé : utilisez des photos plus petites ou réinitialisez la démo.');return false}}
function enabled(s){return CONFIG.SPRINT>=s}
function statusText(z){return z.status==='clean'?'Nettoyée':z.status==='progress'?'En cours':'À nettoyer'}
function statusColor(z){return z.status==='clean'?'#239c63':z.status==='progress'?'#e4a02d':'#d64b46'}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function selectedZone(){return state.zones.find(z=>z.id===selected)}
function drawMarkers(){markers.forEach(m=>map.removeLayer(m));markers=[];state.zones.forEach(z=>{const marker=L.circleMarker([z.lat,z.lng],{radius:11,color:'#fff',weight:2,fillColor:statusColor(z),fillOpacity:.96}).addTo(map);marker.bindTooltip(esc(z.name));marker.on('click',()=>select(z.id));markers.push(marker)})}
function select(id){selected=id;const z=selectedZone();if(z)map.panTo([z.lat,z.lng]);render()}
function render(){drawMarkers();$('zoneCount').textContent=state.zones.length;$('cleanCount').textContent=state.zones.filter(z=>z.status==='clean').length;
$('list').innerHTML=state.zones.map(z=>`<div class="zone ${z.id===selected?'active':''}" data-zone="${esc(z.id)}"><h4>${esc(z.name)}</h4><span class="pill ${z.status==='clean'?'green':z.status==='progress'?'orange':''}">${statusText(z)}</span> <span class="muted small">${esc(z.type)}</span></div>`).join('');
document.querySelectorAll('[data-zone]').forEach(el=>el.onclick=()=>select(el.dataset.zone));
const z=selectedZone();if(!z){$('details').innerHTML='<p>Sélectionnez une zone sur la carte.</p>';return}
let html=`<h3>${esc(z.name)}</h3><p><span class="pill ${z.status==='clean'?'green':z.status==='progress'?'orange':''}">${statusText(z)}</span></p><p>${esc(z.description)}</p><p><b>Type :</b> ${esc(z.type)}<br><b>Quantité estimée :</b> ${esc(z.quantity)}</p>`;
if(enabled(3)){html+=`<hr><h4>Participer au ramassage</h4><p class="muted">Profil : <b>${esc(state.pseudo||'visiteur')}</b></p><div class="actions"><button id="startClean" ${z.status==='clean'?'disabled':''}>${z.status==='progress'?'Continuer le ramassage':'Choisir cette zone'}</button></div>`;
if(z.status==='progress')html+='<div class="notice">Ramassage commencé. Vous pouvez maintenant ajouter vos photos.</div>';
if(z.status!=='clean')html+=`<div id="photoArea" class="${z.status==='progress'?'':'hidden'}"><label>Photo avant (US7)</label><input id="beforeFile" type="file" accept="image/*" capture="environment"><label>Photo après (US9)</label><input id="afterFile" type="file" accept="image/*" capture="environment"><p class="filehint">Les photos sont réduites et enregistrées dans ce navigateur.</p><button id="publish" style="width:100%">Publier l'avant/après et terminer</button></div>`;
if(z.before||z.after)html+=`<div class="photos"><div><b>Avant</b>${z.before?`<img alt="Avant" src="${z.before}">`:''}</div><div><b>Après</b>${z.after?`<img alt="Après" src="${z.after}">`:''}</div></div>`;
if(z.by)html+=`<p class="muted">Action réalisée par ${esc(z.by)}</p>`;
}
$('details').innerHTML=html;
if(enabled(3)){const start=$('startClean');if(start)start.onclick=()=>{if(!state.pseudo){alert('Choisissez d’abord un pseudo dans « Mon profil ».');showTab('profile');return}if(z.status==='sale')z.status='progress';save();render()};const pub=$('publish');if(pub)pub.onclick=async()=>{const b=$('beforeFile').files[0],a=$('afterFile').files[0];if(!b||!a){alert('Ajoutez une photo avant ET une photo après.');return}pub.disabled=true;pub.textContent='Traitement des photos…';try{const before=await shrink(b),after=await shrink(a);z.before=before;z.after=after;z.status='clean';z.by=state.pseudo;if(save()){render();alert('Bravo ! La zone est maintenant verte.')}else{z.before=null;z.after=null;z.status='progress'}}catch(e){alert('Impossible de traiter les images : '+e.message);pub.disabled=false}}}
}
function showTab(tab){document.querySelectorAll('.tabview').forEach(x=>x.classList.add('hidden'));$(tab+'View').classList.remove('hidden');document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('secondary',b.dataset.tab!==tab))}
function shrink(file){return new Promise((resolve,reject)=>{if(!file.type.startsWith('image/'))return reject(Error('fichier non image'));const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,850/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.68))};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('image illisible'))};img.src=url})}
function init(){map=L.map('map').setView([48.375,-4.53],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);
$('sprintLabel').textContent='Sprint '+CONFIG.SPRINT;$('appFeatures').classList.toggle('hidden',!enabled(3));$('reportSection').classList.toggle('hidden',!enabled(2));$('tabs').classList.toggle('hidden',!enabled(3));
$('profileForm').onsubmit=e=>{e.preventDefault();const p=$('pseudo').value.trim();if(p.length<2||p.length>30)return alert('Pseudo : entre 2 et 30 caractères.');state.pseudo=p;save();render();showTab('zones')};$('pseudo').value=state.pseudo;
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));$('reportForm').onsubmit=e=>{e.preventDefault();const name=$('newName').value.trim(),lat=Number($('newLat').value),lng=Number($('newLng').value);if(!name||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<48.2||lat>48.55||lng< -4.9||lng> -4.1)return alert('Nom ou coordonnées invalides pour la rade de Brest.');const z={id:'z'+Date.now(),name,lat,lng,type:$('newType').value,quantity:$('newQty').value,description:$('newDesc').value.trim()||'Signalement citoyen',status:'sale',before:null,after:null,by:null};state.zones.push(z);if(!save()){state.zones.pop();return}e.target.reset();select(z.id);showTab('zones');alert('Nouvelle zone signalée !')};
$('pickOnMap').onclick=()=>{alert('Cliquez sur la carte pour renseigner les coordonnées du signalement.');map.once('click',e=>{$('newLat').value=e.latlng.lat.toFixed(5);$('newLng').value=e.latlng.lng.toFixed(5)})};
$('reset').onclick=()=>{if(confirm('Effacer les données de démonstration de ce navigateur ?')){localStorage.removeItem(CONFIG.KEY);location.reload()}};
$('locate').onclick=()=>{if(!navigator.geolocation)return alert('Géolocalisation indisponible.');map.locate({setView:true,maxZoom:14});map.once('locationerror',()=>alert('Position indisponible. La carte de la rade reste accessible.'))};
if(!enabled(3))showTab('zones');render()}
document.addEventListener('DOMContentLoaded',init);
