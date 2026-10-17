/* Historical market observations never change DC values or personal estimates. */
let trendHistory=[],trendChart=null,trendPending=null,trendSelected='',trendRange='all';
try{trendHistory=JSON.parse(localStorage.getItem('pc-price-history-v1')||'[]');if(!Array.isArray(trendHistory))trendHistory=[]}catch{trendHistory=[]}
const trendSection=document.createElement('section');trendSection.id='tab-trends';trendSection.className='tab';document.getElementById('tab-cartes').after(trendSection);
const trendNav=document.querySelector('.ni[data-tab=trends]')||document.createElement('button');trendNav.className='ni';trendNav.dataset.tab='trends';trendNav.innerHTML='<span class="ni-pill" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M6 15l5-5 4 3 6-8"/></svg></span><span class="ni-lbl">Tendance prix</span>';trendNav.onclick=()=>{jump('trends');renderTrends()};document.querySelector('.nav-track').append(trendNav);
function sealedTrendItem(d){return {...d,nom:d.art,num:'Scellé',ett:'Scellé',val:d.ven,lng:d.lng||'Fr'}}
function trendCards(){return [...DC,...DS.map(sealedTrendItem)].filter(d=>cardmarketLink(d))}
function trendDate(x){return new Date(x).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})}
function renderTrends(){
 const cards=trendCards();if(!cards.some(c=>PriceTrends.identity(c)===trendSelected))trendSelected=cards[0]?PriceTrends.identity(cards[0]):'';
 trendSection.innerHTML=`${titleBlock('CARDMARKET','Tendance prix','Relevés des offres · indépendants de vos estimations')}<div class="trend-grid"><section class="surface"><h2>Nouveau relevé</h2><p class="data-note">Dans Safari : ouvrez la fiche Cardmarket, chargez les offres, puis Partager → Relever les offres. Collez le résultat ici : le relevé valide est enregistré automatiquement.</p><div class="trend-picker"><label class="trend-label" for="trend-search">Rechercher une carte ou un scellé</label><input id="trend-search" type="search" placeholder="Nom, numéro ou série…" autocomplete="off" aria-controls="trend-results"><div id="trend-results" class="trend-results"></div><p id="trend-selected-card" class="data-note" aria-live="polite"></p></div><label class="trend-label" hidden>Carte<select id="trend-card">${cards.map(d=>`<option value="${esc(PriceTrends.identity(d))}" ${PriceTrends.identity(d)===trendSelected?'selected':''}>${esc(d.nom)} · ${esc(d.num)} · ${esc(d.lng)} · ${esc(d.ett)}</option>`).join('')}</select></label><a id="trend-source" class="text-action" target="_blank" rel="noopener noreferrer">Ouvrir la page Cardmarket ↗</a><label class="trend-label">Relevé Safari<textarea id="trend-input" rows="4" placeholder="Collez le relevé ici…" spellcheck="false"></textarea></label><button class="primary-action" id="trend-calculate">Réessayer le relevé</button><div id="trend-preview" aria-live="polite"></div><details class="trend-help"><summary>Installer le raccourci Safari</summary><ol><li>Dans Raccourcis sur iPhone, créez « Relever les offres ».</li><li>Activez « Dans la feuille de partage » et conservez le type « Pages web Safari ».</li><li>Ajoutez « Exécuter JavaScript sur la page web », avec la page Safari en entrée. Remplacez son texte par le script ci-dessous.</li><li>Ajoutez « Copier dans le presse-papiers » avec le résultat de l’étape précédente. Revenez dans PokéCollect et collez le relevé : il est enregistré automatiquement.</li><li>Dans Safari, ouvrez Cardmarket puis Partager → Relever les offres.</li></ol><button class="text-action" id="trend-script">Copier le script Safari</button><p id="trend-script-status" role="status"></p><p class="data-note">Le raccourci lit seulement les offres chargées. Il ne se connecte pas à votre compte et ne lance aucun achat. Safari peut demander votre autorisation lors de la première utilisation.</p></details></section><section class="surface"><h2>Évolution des offres</h2><div class="segmented trend-period">${[['day','24 h'],['week','7 jours'],['month','30 jours'],['all','Tout']].map(([k,v])=>`<button data-range="${k}" aria-pressed="${trendRange===k}">${v}</button>`).join('')}</div><div id="trend-graph" class="trend-graph"></div><div id="trend-observations"></div><p class="data-note">Moyenne des 5 offres les moins chères du relevé, dans la langue et l’état exacts. Hors livraison. Chaque point correspond à une observation réelle.</p></section></div><section class="surface trend-storage"><strong>Historique sur cet appareil</strong><p class="data-note">Les relevés restent disponibles dans ce navigateur. La sauvegarde locale est automatique. Le relevé reste enregistré sur cet appareil sans quitter l’app. Le lien « Synchroniser avec Google Sheets » permet de le conserver aussi dans votre tableau. L’historique est récupéré automatiquement à l’ouverture et au retour dans l’app.</p><button class="text-action" id="trend-export">Exporter l’historique</button> <button class="text-action" onclick="connectTrendSheet()">Configurer Google Sheets</button> <button class="text-action" onclick="readTrendSheet()">Charger l’historique Google Sheets</button> <p id="trend-sync-status" role="status"></p></section>`;
 document.getElementById('trend-card').onchange=e=>{trendSelected=e.target.value;trendPending=null;document.getElementById('trend-preview').textContent='';const card=trendCards().find(d=>PriceTrends.identity(d)===trendSelected);if(card)localStorage.setItem('pc-trend-choice:'+PriceTrends.product(cardmarketLink(card).url),trendSelected);updateTrendView()};
 document.getElementById('trend-calculate').onclick=analyzeTrend;
 document.getElementById('trend-input').addEventListener('input',()=>{clearTimeout(trendImportTimer);trendImportTimer=setTimeout(analyzeTrend,500)});
 document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{trendRange=b.dataset.range;document.querySelectorAll('[data-range]').forEach(x=>x.setAttribute('aria-pressed',x===b));updateTrendView()});
 document.getElementById('trend-export').onclick=()=>{const blob=new Blob([JSON.stringify(trendHistory,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pokecollect-tendances.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 document.getElementById('trend-script').onclick=async()=>{const status=document.getElementById('trend-script-status');try{const r=await fetch('cm-capture.js?v=20261017-sealed');if(!r.ok)throw Error();const script=await r.text();try{await navigator.clipboard.writeText(script);status.textContent='Script copié.'}catch{const t=document.createElement('textarea');t.value=script;t.setAttribute('aria-label','Script Safari à copier');status.replaceChildren(t);t.select()}}catch{status.textContent='Le script n’a pas pu être chargé. Réessayez.'}};
 initTrendSearch();
 updateTrendView();
}
function updateTrendView(){
 const card=trendCards().find(d=>PriceTrends.identity(d)===trendSelected),source=document.getElementById('trend-source');
 if(card&&source){source.href=trendCardURL(card);source.onclick=()=>localStorage.setItem('pc-trend-choice:'+PriceTrends.product(cardmarketLink(card).url),PriceTrends.identity(card))}
 const selected=document.getElementById('trend-selected-card');if(selected)selected.textContent=card?`${card.nom} · ${card.num} · ${card.lng} · ${card.ett}`:'';
 document.querySelectorAll('#trend-results [data-card]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.card===trendSelected));
 const graph=document.getElementById('trend-graph');if(!graph)return;
 const cutoff=trendRange==='all'?0:Date.now()-({day:1,week:7,month:30}[trendRange]*86400000);
 const points=trendHistory.filter(r=>r.key===trendSelected&&Number.isFinite(r.mean)&&Date.parse(r.capturedAt)>=cutoff).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
 trendChart?.destroy();trendChart=null;
 document.getElementById('trend-headline')?.remove();document.getElementById('trend-readout')?.remove();
 const history=document.getElementById('trend-observations');history.innerHTML='';
 if(!points.length){graph.innerHTML='<p class="data-note">Aucun relevé sur cette période. Choisissez une autre période ou ajoutez un relevé.</p>';return}
 const first=points[0],last=points[points.length-1],delta=last.mean-first.mean,percent=first.mean?100*delta/first.mean:0;
 graph.insertAdjacentHTML('beforebegin',`<div id="trend-headline" class="trend-headline"><div><small>Dernier relevé de la période</small><strong>${money(last.mean)}</strong></div><div class="trend-change ${delta<0?'negative':''}">${points.length>1?`${delta>=0?'+':''}${money(delta)}<br>${percent>=0?'+':''}${percent.toLocaleString('fr-FR',{maximumFractionDigits:1})} % sur la période`:'Premier relevé'}<small>${points.length} point${points.length>1?'s':''}</small></div></div>`);
 graph.innerHTML='<canvas id="trend-canvas" aria-label="Évolution des moyennes Cardmarket. Les relevés sont également consultables dans la liste sous le graphique." role="img"></canvas>';
 graph.insertAdjacentHTML('afterend','<div id="trend-readout" class="trend-readout" aria-live="polite"></div>');
 const show=i=>{const p=points[i];document.getElementById('trend-readout').innerHTML=`<b>${money(p.mean)}</b> · ${esc(trendDate(p.capturedAt))}<br>${p.count} offre${p.count>1?'s':''} retenue${p.count>1?'s':''}${p.incomplete?' · Relevé partiel':''}${points.length===1?' · Ajoutez un deuxième relevé pour voir une évolution.':''}`;history.querySelectorAll('[data-point]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.point)===i));};
 history.innerHTML=points.map((p,i)=>`<button class="trend-history-point" data-point="${i}" aria-pressed="false"><span>${esc(trendDate(p.capturedAt))}<small>${p.count} offres${p.incomplete?' · partiel':''}</small></span><strong>${money(p.mean)}</strong></button>`).reverse().join('');
 history.querySelectorAll('[data-point]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.point);show(i);if(trendChart){trendChart.setActiveElements([{datasetIndex:0,index:i}]);trendChart.update('none')}});
 show(points.length-1);
 if(typeof Chart==='undefined'){graph.innerHTML='<p class="data-note">Graphique indisponible. Vos relevés restent consultables ci-dessous.</p>';return}
 const cursor={id:'trendCursor',afterDatasetsDraw(chart){const active=chart.getActiveElements();if(!active.length)return;const x=active[0].element.x,{ctx,chartArea}=chart;ctx.save();ctx.beginPath();ctx.setLineDash([4,5]);ctx.strokeStyle='#a6b7f077';ctx.moveTo(x,chartArea.top);ctx.lineTo(x,chartArea.bottom);ctx.stroke();ctx.restore()}};
 trendChart=new Chart(document.getElementById('trend-canvas'),{type:'line',plugins:[cursor],data:{datasets:[{label:'Moyenne Cardmarket',data:points.map(p=>({x:Date.parse(p.capturedAt),y:p.mean})),borderColor:'#a6b7f0',borderWidth:3,backgroundColor:context=>{const {ctx,chartArea}=context.chart;if(!chartArea)return '#889de122';const g=ctx.createLinearGradient(0,chartArea.top,0,chartArea.bottom);g.addColorStop(0,'#889de14d');g.addColorStop(1,'#889de100');return g},pointBackgroundColor:'#dce4ff',pointBorderColor:'#171a21',pointBorderWidth:2,pointRadius:points.length===1?7:4,pointHoverRadius:8,pointHitRadius:22,tension:0,fill:true}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:500},interaction:{mode:'nearest',axis:'x',intersect:false},onHover:(e,active)=>{if(active.length)show(active[0].index)},onClick:(e,active)=>{if(active.length)show(active[0].index)},plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{x:{type:'linear',min:points.length===1?Date.parse(first.capturedAt)-3600000:undefined,max:points.length===1?Date.parse(last.capturedAt)+3600000:undefined,ticks:{color:'#8e9bb2',maxTicksLimit:4,maxRotation:0,callback:v=>new Date(v).toLocaleString('fr-FR',trendRange==='day'?{hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'short'})},grid:{display:false},border:{display:false}},y:{grace:'12%',ticks:{color:'#8e9bb2',maxTicksLimit:5,callback:v=>money(v)},grid:{color:'#ffffff09'},border:{display:false}}}}});
}
function analyzeTrend(){
 const out=document.getElementById('trend-preview');trendPending=null;
 try{
  const text=document.getElementById('trend-input').value;let raw;try{raw=JSON.parse(text)}catch{}
  // Auto-select only when a unique product belongs to the collection. Language variants require selection.
  if(raw?.url){const matches=trendCards().filter(d=>{try{return PriceTrends.product(cardmarketLink(d).url)===PriceTrends.product(raw.url)}catch{return false}});const remembered=localStorage.getItem('pc-trend-choice:'+PriceTrends.product(raw.url));if(matches.length>1&&!matches.some(c=>PriceTrends.identity(c)===remembered))throw Error('Plusieurs langues ou états existent : sélectionnez votre carte, puis réessayez. Ce choix sera mémorisé.');if(matches.length){trendSelected=matches.length===1?PriceTrends.identity(matches[0]):remembered;document.getElementById('trend-card').value=trendSelected;updateTrendView()}}
  const card=trendCards().find(d=>PriceTrends.identity(d)===trendSelected);if(!card)throw Error('Sélectionnez une carte.');
  trendPending=PriceTrends.prepare(text,card,cardmarketLink(card).url);
  const p=trendPending;
  if(p.requiresReview){out.textContent='Relevé nécessitant une vérification détecté. Ouvrez la fiche de cette carte pour vérifier les commentaires vendeurs et valider le relevé.';return}
  if(trendHistory.some(r=>r.id===p.id)){out.innerHTML='Ce relevé est déjà dans votre historique. <a class="cardmarket-link" href="'+esc(trendConnection()+'#'+encodeURIComponent(JSON.stringify({action:'observation',record:p})))+'">Réessayer la synchronisation Google</a>';return}
  const next=[...trendHistory,p];localStorage.setItem('pc-price-history-v1',JSON.stringify(next));trendHistory=next;trendPending=null;
  out.innerHTML=`<h3>${money(p.mean)}</h3><p>${esc(p.name)} · ${esc(p.language)} · ${esc(p.condition)}</p><p class="data-note">Enregistré sur cet appareil · ${p.count} offre(s)${p.incomplete?' · relevé partiel':''}. Votre estimation reste inchangée.</p><a class="cardmarket-link" href="${esc(trendConnection()+'#'+encodeURIComponent(JSON.stringify({action:'observation',record:p}))) }">Synchroniser avec Google Sheets ↗</a>`;
  updateTrendView();decorateTrendCards();


 }catch(e){trendPending=null;out.textContent=e.message}
}
function trendConnection(){try{return localStorage.getItem('pc-sheets-private-url')||'https://script.google.com/macros/s/AKfycbwKVPY_udprF97AgoWb8rbOTwNT52LooGnizs1hv4XNWrOfbiLw9-KepfGOPnJXpCqT/exec'}catch{return ''}}
function connectTrendSheet(){const input=prompt('URL du panneau Google privé (déploiement Apps Script limité à votre compte)',trendConnection());if(input===null)return;try{const u=new URL(input);if(u.protocol!=='https:'||u.hostname!=='script.google.com'||!/^\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(u.pathname))throw Error();localStorage.setItem('pc-sheets-private-url',u.origin+u.pathname);alert('Connexion enregistrée sur cet appareil.')}catch{alert('URL de déploiement Google Apps Script invalide.')}}
function openPrivateSheet(request){const base=trendConnection();if(!base){alert('La connexion privée Google Sheets doit d’abord être activée.');return}window.open(base+'#'+encodeURIComponent(JSON.stringify(request)),'_blank','noopener');}
function editPersonalEstimate(card){if(!trendConnection()){alert('La modification depuis l’app nécessite l’activation de la connexion privée Google Sheets.');return}const text=prompt('Votre estimation unitaire (€)',String(card.val));if(text===null)return;const price=Number(text.replace(',','.'));if(!text.trim()||!Number.isFinite(price)||price<0){alert('Saisissez un prix valide.');return}openPrivateSheet({action:'estimate',key:PriceTrends.identity(card),name:card.nom,previous:card.val,price});}
const trendOriginalCard=openC;
let activeTrendCard=null,cardTrendPending=null,cardTrendSaving=null,cardTrendSavingKey=null;
const cardTrendDrafts=new Map();
openC=function(i){
 const d=_vc[i];trendOriginalCard(i);if(d)mountProductTrend(d);
};
const trendOriginalSealed=openS;
openS=function(i){const d=_vs[i];trendOriginalSealed(i);if(d)mountProductTrend(sealedTrendItem(d));};
function mountProductTrend(d){
 activeTrendCard=d;cardTrendPending=null;
 const body=document.getElementById('shtB');
 body.querySelectorAll('a.cardmarket-link').forEach(a=>a.remove());
 const block=document.createElement('section');block.className='card-releve';
 const link=cardmarketLink(d);
 block.innerHTML=`<h3>Cardmarket</h3>${link?.note?`<p class="data-note">${esc(link.note)}</p>`:''}${link?`<a class="cardmarket-link" id="card-trend-source" href="${esc(trendCardURL(d))}" target="_blank" rel="noopener noreferrer">Relever sur Cardmarket ↗</a>`:'<p>Aucun lien Cardmarket renseigné.</p>'}<p class="data-note">${esc(d.lng)} · ${esc(d.ett)} · Votre estimation personnelle reste inchangée.</p><label class="trend-label">Relevé Cardmarket<textarea id="card-trend-input" rows="4" placeholder="Collez le relevé du raccourci Safari…" spellcheck="false"></textarea></label><button class="primary-action" id="card-trend-analyze" ${link?'':'disabled'}>Analyser le relevé</button><div id="card-trend-result" aria-live="polite"></div><p id="card-trend-status" role="status"></p><div class="card-trend-detail" id="card-trend-detail">${trendCardSummary(d)}</div>`;
 body.append(block);
 const input=block.querySelector('textarea');input.value=cardTrendDrafts.get(PriceTrends.identity(d))||'';
 input.oninput=()=>{cardTrendDrafts.set(PriceTrends.identity(d),input.value);cardTrendPending=null;block.querySelector('#card-trend-result').replaceChildren()};
 block.querySelector('#card-trend-source')?.addEventListener('click',()=>localStorage.setItem('pc-trend-choice:'+PriceTrends.product(link.url),PriceTrends.identity(d)));
 block.querySelector('#card-trend-analyze').onclick=()=>analyzeCardTrend(d);
 const button=document.createElement('button');button.className='cardmarket-link';button.textContent='Modifier mon estimation';button.onclick=()=>editPersonalEstimate(d);body.append(button);
};
function analyzeCardTrend(card,selectedIds){
 const out=document.getElementById('card-trend-result');cardTrendPending=null;
 try{
 const p=PriceTrends.prepare(document.getElementById('card-trend-input').value,card,cardmarketLink(card).url,selectedIds);cardTrendPending=p;
 if(p.variant&&!selectedIds){out.innerHTML='<p>Vérifiez les photos et commentaires sur Cardmarket, puis sélectionnez uniquement les annonces correspondant à votre référence et à son emballage ou sa variante.</p>'+p.candidates.map((o,i)=>`<label class="trend-label"><input type="checkbox" data-variant-index="${i}"> ${esc(o.seller)} · ${money(o.price)}<small style="display:block">${esc(o.description)} · ${esc(o.attributes.join(', '))}</small></label>`).join('')+'<button class="primary-action" id="variant-calculate">Calculer avec les annonces sélectionnées</button>';document.getElementById('variant-calculate').onclick=()=>{const ids=[...out.querySelectorAll('input:checked')].map(e=>p.candidates[Number(e.dataset.variantIndex)].id);if(!ids.length)return;analyzeCardTrend(card,ids)};return;}
 out.innerHTML=`<h3>${money(p.mean)}</h3><p>${p.loadedCount} annonces chargées · ${p.matchingCount} compatibles · ${p.count} retenues (5 moins chères maximum)</p><p> ${esc(trendDate(p.capturedAt))}${p.incomplete?' · Relevé partiel':''}</p>${p.offers.map(o=>`<div class="det-row"><span>${esc(o.seller)}${o.description?`<small class="data-note" style="display:block">${esc(o.description)}</small>`:''}</span><strong>${money(o.price)}</strong></div>`).join('')}${p.requiresReview?'<label class="trend-label"><input type="checkbox" id="card-psa-review"> J’ai vérifié les commentaires : les annonces concernent bien cette référence, sa variante et son état ou son emballage.</label>':''}<button class="primary-action" id="card-trend-save" ${p.requiresReview?'disabled':''}>Enregistrer le relevé</button><p class="data-note">Le panneau Google privé s’ouvre pour écrire dans votre tableau. Cette fiche reste ouverte ; le graphique se met à jour après confirmation.</p>`;
 document.getElementById('card-trend-save').onclick=()=>saveCardTrend(card,p);
 document.getElementById('card-psa-review')?.addEventListener('change',e=>document.getElementById('card-trend-save').disabled=!e.target.checked);
 }catch(e){out.textContent=e.message}
}
function saveCardTrend(card,p){
 if(cardTrendPending!==p||(p.requiresReview&&!document.getElementById('card-psa-review')?.checked))return;
 const status=document.getElementById('card-trend-status');
 try{
 const next=[...new Map([...trendHistory,p].map(r=>[r.id,r])).values()];localStorage.setItem('pc-price-history-v1',JSON.stringify(next));trendHistory=next;
 cardTrendSaving=p.id;cardTrendSavingKey=p.key;status.textContent='Relevé conservé sur cet appareil. Enregistrement Google en cours…';
 const b=document.getElementById('card-trend-save');b.disabled=true;
 openPrivateSheet({action:'observation',record:p});
 decorateTrendCards();document.getElementById('card-trend-detail').innerHTML=trendCardSummary(card);
 let tries=0;const poll=setInterval(async()=>{await readTrendSheet();if(cardTrendSaving!==p.id||++tries>=12){clearInterval(poll);if(cardTrendSaving===p.id){if(activeTrendCard&&PriceTrends.identity(activeTrendCard)===p.key&&document.getElementById('card-trend-status'))document.getElementById('card-trend-status').textContent='Copie locale enregistrée ; confirmation Google non reçue. Revenez du panneau Google ou réessayez.';b.disabled=false}}},5000);
 }catch(e){status.textContent='Enregistrement impossible : '+e.message}
}


async function readTrendSheet(){const status=document.getElementById('trend-sync-status');if(status)status.textContent='Chargement…';try{const response=await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Tendance prix')}`);if(!response.ok)throw Error();const rows=trendCSV(await response.text());const records=[];for(const row of rows){try{const r=JSON.parse(row[9]);if(r.id&&r.key&&Number.isFinite(r.mean)&&Array.isArray(r.offers)&&Number.isFinite(Date.parse(r.capturedAt)))records.push(r)}catch{}}if(!rows.some(r=>r[0]==='ID')&&!records.length)throw Error();const merged=new Map(trendHistory.map(r=>[r.id,r]));records.forEach(r=>merged.set(r.id,r));if(cardTrendSaving&&records.some(r=>r.id===cardTrendSaving)){cardTrendSaving=null;const st=document.getElementById('card-trend-status');if(st&&activeTrendCard&&PriceTrends.identity(activeTrendCard)===cardTrendSavingKey)st.textContent='Enregistré dans Google Sheets et dans l’historique ✅';}const next=[...merged.values()];localStorage.setItem('pc-price-history-v1',JSON.stringify(next));trendHistory=next;if(status)status.textContent=records.length+' relevés synchronisés avec Google Sheets.';if(document.getElementById('trend-graph'))updateTrendView();decorateTrendCards()}catch{if(status)status.textContent='Historique Google indisponible. Vérifiez que la connexion privée a enregistré au moins un relevé.'}}

function trendCSV(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}return rows}
const trendBuildCards=buildCartes;
buildCartes=function(){trendBuildCards();decorateTrendCards();if(trendSection.classList.contains('on')&&!document.getElementById('trend-card')?.options.length)renderTrends();};

let trendImportTimer,trendSyncBusy=false,trendLastSync=0;
function trendCardURL(card){const link=cardmarketLink(card);if(!link)return '#';const u=new URL(link.url);const lang={fr:2,'français':2,en:1,anglais:1,jap:7,jp:7,japonais:7,'coréen':10,ko:10}[String(card.lng).trim().toLowerCase()];const state={'PSA 10':1,PSA10:1,'M/NM':2,M:2,MINT:2,NM:2,'NEAR MINT':2,EX:3,EXC:3,EXCELLENT:3,'EX/NM':3,GD:4,GOOD:4,LP:5,PL:6,PO:7}[String(card.ett).trim().toUpperCase()];if(lang)u.searchParams.set('language',lang);if(state)u.searchParams.set('minCondition',state);return u.href}
function trendCardSummary(card){
 const points=trendHistory.filter(p=>p.key===PriceTrends.identity(card)).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
 const badge=`<small>${esc(card.lng)} · ${esc(card.ett)} · Cardmarket</small>`;
 if(!points.length)return badge+'<span class="data-note">Aucun relevé</span>';
 const last=points.at(-1),first=points[0],diff=last.mean-first.mean;
 const times=points.map(p=>Date.parse(p.capturedAt)),values=points.map(p=>p.mean),min=Math.min(...values),max=Math.max(...values);
 const coords=points.map((p,i)=>`${points.length===1?140:8+(times[i]-times[0])/(times.at(-1)-times[0]||1)*264},${max===min?30:52-(p.mean-min)/(max-min)*44}`);
 return `${badge}<strong>${money(last.mean)}</strong><svg viewBox="0 0 280 60" role="img" aria-label="Historique des relevés Cardmarket"><polyline fill="none" stroke="#889de1" stroke-width="2.5" points="${coords.join(' ')}"/>${coords.map((v,i)=>`<circle cx="${v.split(',')[0]}" cy="${v.split(',')[1]}" r="3" fill="#889de1"><title>${esc(trendDate(points[i].capturedAt))} : ${money(points[i].mean)}</title></circle>`).join('')}</svg><small>${points.length>1?(diff>=0?'+':'')+money(diff)+' depuis le premier relevé':'Premier relevé'} · ${last.count} offres${last.incomplete?' · partiel':''}</small>`;
}
function decorateTrendCards(){if(activeTrendCard&&document.getElementById('card-trend-detail'))document.getElementById('card-trend-detail').innerHTML=trendCardSummary(activeTrendCard);document.querySelectorAll('.c-gal-card,.c-list-card').forEach(el=>{const m=(el.getAttribute('onclick')||'').match(/openC\((\d+)\)/),card=m&&_vc[Number(m[1])];if(!card)return;let block=el.querySelector('.card-trend-mini');if(!block){block=document.createElement('div');block.className='card-trend-mini';el.append(block)}block.innerHTML=trendCardSummary(card)})}
async function autoTrendSync(){if(trendSyncBusy||Date.now()-trendLastSync<30000)return;trendSyncBusy=true;trendLastSync=Date.now();try{await readTrendSheet()}finally{trendSyncBusy=false}}
window.addEventListener('focus',autoTrendSync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoTrendSync()});setInterval(()=>{if(!document.hidden)autoTrendSync()},60000);setTimeout(autoTrendSync,1000);
async function importTrendHash(){if(!location.hash.startsWith('#releve='))return;const raw=location.hash.slice(8);history.replaceState(null,'',location.pathname+location.search);let text;try{text=decodeURIComponent(raw)}catch{return}if(text.length>2000000)return;for(let i=0;i<30&&!trendCards().length;i++)await new Promise(r=>setTimeout(r,300));jump('trends');renderTrends();document.getElementById('trend-input').value=text;analyzeTrend()}
window.addEventListener('hashchange',importTrendHash);setTimeout(importTrendHash,500);

const trendRenderC=renderC;renderC=function(){trendRenderC();decorateTrendCards()};

function initTrendSearch(){
 const picker=document.querySelector('.trend-picker'),form=picker.closest('section.surface'),grid=form.parentElement;
 const library=document.createElement('section');library.className='surface trend-library';library.innerHTML='<h2>Cartes et scellés</h2>';library.append(picker);grid.replaceChild(library,form);grid.after(form);form.classList.add('trend-import-panel');
 const input=document.getElementById('trend-search'),results=document.getElementById('trend-results');
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const draw=()=>{
  const tokens=normalize(input.value).trim().split(/\s+/).filter(Boolean);
  const cards=trendCards().filter(d=>tokens.every(t=>normalize([d.nom,d.num,d.ser,d.lng,d.ett].join(' ')).includes(t)));
  results.innerHTML=cards.length?cards.map(d=>`<button type="button" class="trend-result" data-card="${esc(PriceTrends.identity(d))}" aria-pressed="${PriceTrends.identity(d)===trendSelected}">${d.img?`<img src="${esc(d.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span><strong>${esc(d.nom)}</strong><small>${esc(d.num)} · ${esc(d.ser)} · ${esc(d.lng)} · ${esc(d.ett)}</small></span><span aria-hidden="true">↗</span></button>`).join(''):'<p class="data-note" role="status">Aucune référence ne correspond à cette recherche.</p>';
  results.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{
   const select=document.getElementById('trend-card');select.value=b.dataset.card;select.dispatchEvent(new Event('change'));
   results.querySelectorAll('[data-card]').forEach(x=>x.setAttribute('aria-pressed',x===b));
  });
 };
 input.oninput=draw;
 input.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('button')?.focus()}if(e.key==='Escape'){input.value='';draw()}};
 draw();
}
const trendStyle=document.createElement('style');trendStyle.textContent=`
#tab-trends .trend-grid{grid-template-columns:minmax(260px,.85fr) minmax(0,1.5fr);align-items:start}
#tab-trends .trend-label[hidden]{display:none}
#trend-search{width:100%;box-sizing:border-box;border:1px solid #ffffff25;border-radius:12px;background:#101319;color:#f5f4f0;padding:15px;font:inherit;font-size:16px;outline-offset:4px}
.trend-import-panel{margin-top:24px}.trend-results{max-height:460px;overflow:auto;margin:12px 0;overscroll-behavior:contain}
.trend-result{display:flex;align-items:center;gap:12px;width:100%;min-height:68px;text-align:left;padding:10px;background:transparent;border:1px solid transparent;border-bottom-color:#ffffff0b;border-radius:10px;color:inherit;cursor:pointer}
.trend-result:hover,.trend-result[aria-pressed=true]{background:#889de114;border-color:#889de155}
.trend-result img{width:32px;height:45px;object-fit:contain}.trend-result span:nth-last-child(2){flex:1}.trend-result strong{font-size:13px}.trend-result small{display:block;color:#9fa8b7;margin-top:5px;font-size:11px}
.trend-headline{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-top:24px}.trend-headline strong{font-size:clamp(30px,4vw,48px);letter-spacing:-2px;font-weight:600}.trend-headline small{display:block;color:#9fa8b7;margin-bottom:8px}.trend-change{font-size:13px;text-align:right;color:#9fe0c4}.trend-change.negative{color:#f58d83}
.trend-readout{min-height:56px;padding:14px 16px;background:#889de10b;border:1px solid #889de122;border-radius:12px;font-size:13px;color:#b9c3d4;line-height:1.6}.trend-readout b{color:#f1f3f7}
#trend-observations{max-height:260px;overflow:auto;margin-top:22px}.trend-history-point{display:flex;justify-content:space-between;width:100%;padding:15px 4px;border:0;border-bottom:1px solid #ffffff10;background:transparent;color:inherit;text-align:left;cursor:pointer;gap:10px}.trend-history-point small{display:block;color:#9fa8b7;margin-top:5px}.trend-history-point[aria-pressed=true]{background:#889de115}
#tab-trends .trend-graph{height:330px}#tab-trends .trend-period{display:flex;flex-wrap:wrap;gap:6px}#tab-trends .trend-period button{min-height:42px;flex:1}
@media(max-width:800px){#tab-trends .trend-grid{grid-template-columns:1fr}.trend-results{max-height:200px}#tab-trends .trend-graph{height:270px}.trend-headline strong{font-size:36px}}
`;document.head.append(trendStyle);
