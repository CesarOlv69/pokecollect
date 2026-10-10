/* PokéCollect: collection-first workspace. Existing storage and Sheets remain compatible. */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let analysisScope='all', analysisMetric='value', cardCondition='all';
const scrollPositions={};
const originalRenderS=renderS, originalRenderC=renderC, originalBuildS=buildSellees, originalBuildC=buildCartes;
const totalOf=(xs,fn)=>xs.reduce((n,x)=>n+fn(x),0);
function collectionRows(scope='all') {
 return [...(scope==='cards'?[]:DS.map((d,i)=>({...d,name:d.art,value:d.ven,kind:'sealed',index:i}))),...(scope==='sealed'?[]:DC.map((d,i)=>({...d,name:d.nom,value:d.val,kind:'cards',index:i})))];
}
function collectionMetrics(rows) {
 const known=rows.filter(d=>d.hasCost), cost=totalOf(known,d=>d.qty*(d.ach||0)), value=totalOf(rows,d=>d.qty*d.value), comparable=totalOf(rows.filter(d=>d.hasCost||d.kind==='cards'),d=>d.qty*d.value);
 return {value,cost,gain:comparable-cost,roi:cost?100*(comparable-cost)/cost:null,known:known.length,missing:rows.length-known.length,qty:totalOf(rows,d=>d.qty)};
}
function money(v){return eu(v)}
function pieceImage(d,cls='') {return d.img?`<img class="${cls}" referrerpolicy="no-referrer" src="${esc(d.img)}" alt="${esc(d.name)}" loading="lazy" onerror="this.style.visibility='hidden';this.parentElement.classList.add('image-missing')">`:'<span class="image-placeholder">Visuel indisponible</span>';}
function openPiece(kind,i){
 const previous=kind==='sealed'?_vs:_vc;
 try{if(kind==='sealed'){_vs=DS.map(d=>({...d,_p:d.qty*d.ven-d.qty*d.ach}));openS(i)}else{_vc=DC;openC(i)}}
 finally{if(kind==='sealed')_vs=previous;else _vc=previous}
}
function jump(id){goTab(id,document.querySelector(`.ni[data-tab="${id}"]`))}
function metric(label,value,note='',cls=''){return `<div class="metric ${cls}"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`}
function titleBlock(kicker,title,sub){return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="page-sub">${sub}</p></div></div>`}
function panelTitle(kicker,title,action=''){return `<div class="panel-heading"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2></div>${action}</div>`}
function pieceRow(d,i,metricValue){return `<button class="piece-row" onclick="openPiece('${d.kind}',${d.index})"><span class="row-rank">${String(i+1).padStart(2,'0')}</span><span class="row-image">${pieceImage(d)}</span><span class="row-copy"><strong>${esc(d.name)}</strong><small>${esc(d.ser||'Sans série')} · ${d.qty} exemplaire${d.qty>1?'s':''}</small></span><span class="row-value">${metricValue}<small>Voir la pièce ↗</small></span></button>`}
buildDash=function(){
 if(!ready){document.getElementById('tab-dash').innerHTML=titleBlock('VOTRE ESPACE COLLECTIONNEUR','Chargement','Synchronisation avec votre tableau…')+'<div class="loading-surface" aria-busy="true"></div>';return;}

 const rows=collectionRows(), m=collectionMetrics(rows), sealed=collectionMetrics(collectionRows('sealed')), cards=collectionMetrics(collectionRows('cards'));
 const gems=rows.filter(d=>d.kind==='cards'&&d.img).sort((a,b)=>b.value-a.value).slice(0,3), top=[...rows].sort((a,b)=>b.value*b.qty-a.value*a.qty).slice(0,5);
 const share=m.value?sealed.value/m.value*100:0;
 const dt=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
 document.getElementById('tab-dash').innerHTML=`${titleBlock('VOTRE ESPACE COLLECTIONNEUR','Vue d’ensemble','')}<div class="dashboard-hero"><div class="portfolio"><span class="eyebrow">VALEUR ESTIMÉE DE LA COLLECTION</span><div class="portfolio-value">${money(m.value)}</div><div class="portfolio-meta"><span class="live-mark"></span> Synchronisé à ${dt}<span>·</span>${m.qty} objets</div><div class="portfolio-actions"><button class="primary-action" onclick="jump('stats')">Explorer les analyses <span>↗</span></button><button class="text-action" onclick="jump('cartes')">Ouvrir le classeur →</button></div></div><div class="hero-gallery" aria-label="Vos cartes remarquables">${gems.map((d,i)=>`<button class="hero-card hero-card-${i}" onclick="openPiece('${d.kind}',${d.index})" aria-label="Voir ${esc(d.name)}">${pieceImage(d)}</button>`).join('')}<span class="gallery-caption">QUELQUES PIÈCES DE VOTRE COLLECTION</span></div></div><div class="metrics-strip">${metric('Coût d’achat',money(m.cost),`${m.known} / ${rows.length} références documentées`)}${metric('Plus-value potentielle',money(m.gain),'Valeur estimée − coût d’achat',m.gain>=0?'positive':'negative')}${metric('Rendement',m.roi===null?'—':pct(m.roi),'Estimation, hors frais et ventes réalisées')}${metric('Votre collection',`${rows.length} références`,`${DS.length} scellés · ${DC.length} cartes`)}</div><div class="dashboard-bottom"><section class="surface">${panelTitle('COMPOSITION','Répartition')}<div class="allocation-bar"><span style="width:${share}%;background:var(--accent)"></span><span style="width:${100-share}%;background:var(--blue)"></span></div><button class="allocation-row" onclick="jump('scelles')"><span><i class="dot red"></i>Produits scellés<small>${sealed.qty} objets · ${share.toLocaleString('fr-FR',{maximumFractionDigits:1})} % de la valeur</small></span><strong>${money(sealed.value)} ↗</strong></button><button class="allocation-row" onclick="jump('cartes')"><span><i class="dot blue"></i>Cartes Pokémon<small>${cards.qty} cartes · ${(m.value?100-share:0).toFixed(1)} % de la valeur</small></span><strong>${money(cards.value)} ↗</strong></button><p class="data-note">Les cartes sans coût renseigné sont comptées à 0 €.</p></section><section class="surface">${panelTitle('PIÈCES MAJEURES','Top 5',`<button class="text-action" onclick="jump('stats')">Tout analyser ↗</button>`)}${top.map((d,i)=>pieceRow(d,i,money(d.value*d.qty))).join('')}</section></div>`;
};
function selectionSummary(id,rows){const m=collectionMetrics(rows);let el=document.getElementById(id);if(!el)return;el.innerHTML=`<span><b>${m.qty}</b> objets sélectionnés</span><span>Valeur totale <b>${money(m.value)}</b></span><span>Coût d’achat <b>${money(m.cost)}</b></span><span>Bénéfice potentiel <b class="${m.gain>=0?'positive':'negative'}">${money(m.gain)}</b></span>`;}
function selectMarkup(label,values,current,handler){return `<label class="filter-label">${label}<select onchange="${handler}(this.value)">${values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${v==='all'?'Tout afficher':esc(v)}</option>`).join('')}</select></label>`}
buildSellees=function(){originalBuildS();document.getElementById('sChips').innerHTML=selectMarkup('Série',['all',...new Set(DS.map(d=>d.ser).filter(Boolean).sort())],fSerS,'setFS');};
buildCartes=function(){originalBuildC();document.getElementById('cLngChips').innerHTML=selectMarkup('Langue',['all',...new Set(DC.map(d=>d.lng).filter(Boolean).sort())],fLng,'setFL');document.getElementById('cSerChips').innerHTML=selectMarkup('Série',['all',...new Set(DC.map(d=>d.ser).filter(Boolean).sort())],fSerC,'setFC')+selectMarkup('État',['all',...new Set(DC.map(d=>d.ett).filter(Boolean).sort())],cardCondition,'setCondition');};
function setCondition(value){cardCondition=value;renderC()}
renderS=function(){originalRenderS();selectionSummary('sealed-summary',_vs.map(d=>({...d,value:d.ven})));enhanceItems()};
renderC=function(){const all=DC;try{if(cardCondition!=='all')DC=DC.filter(d=>d.ett===cardCondition);originalRenderC()}finally{DC=all}selectionSummary('cards-summary',_vc.map(d=>({...d,value:d.val,kind:'cards'})));enhanceItems()};
function enhanceItems(){document.querySelectorAll('.c-gal-card,.s-gal-card,.c-list-card,.s-list-card').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}}});}
const originalOpenSht=openSht;
openSht=function(){originalOpenSht();document.getElementById('ov').setAttribute('role','dialog');document.getElementById('ov').setAttribute('aria-modal','true');document.getElementById('ov').setAttribute('aria-labelledby','shtT');document.getElementById('ov')._lastFocus=document.activeElement;document.querySelector('#ov .sht-close').focus();document.body.style.overflow='hidden'};
closeSht=function(){document.getElementById('ov').classList.remove('open');document.body.style.overflow='';document.getElementById('ov')._lastFocus?.focus()};
goTab=function(id,el){const current=document.querySelector('.tab.on');if(current?.id==='tab-'+id)return;if(current)scrollPositions[current.id]=window.scrollY;const change=()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.id==='tab-'+id));document.querySelectorAll('.ni').forEach(n=>{const on=n.dataset.tab===id;n.classList.toggle('on',on);n.setAttribute('aria-current',on?'page':'false')});if(id==='stats'&&ready)buildStats();if(id==='boosters'&&ready)buildBoosters();window.scrollTo({top:scrollPositions['tab-'+id]||0,behavior:'instant'});};if(document.startViewTransition&&!reducedMotion.matches)document.startViewTransition(change);else change()};
const allocationColors=['#e66759','#889de1','#d6b477','#73b5a0','#b497d0','#729cbd','#b77785','#a5b67c','#525b6c'];
function highlightAllocation(i){const chart=ch.aAllocation;if(!chart)return;const data=chart.data.datasets[0].data;document.getElementById('ringName').textContent=i<0?'Valeur totale':chart.data.labels[i];document.getElementById('ringValue').textContent=money(i<0?0:data[i]);if(i<0)document.getElementById('ringValue').textContent=money(data.reduce((a,b)=>a+b,0));chart.setActiveElements(i<0?[]:[{datasetIndex:0,index:i}]);chart.update('none')}
function setAnalysisScope(scope){analysisScope=scope;buildStats()}
function setAnalysisMetric(metric){analysisMetric=metric;buildStats()}
function chartPanel(id,kicker,title){return `<section class="surface chart-panel">${panelTitle(kicker,title)}<div class="chart-frame"><canvas id="${id}" role="img" aria-label="${title}"></canvas></div></section>`}
function drillSeries(kind,series){if(kind==='sealed'){fSerS=series;document.getElementById('sSearch').value='';buildSellees();jump('scelles')}else{fSerC=series;fLng='all';cardCondition='all';document.getElementById('cSearch').value='';buildCartes();jump('cartes')}}
buildStats=function(){
 Object.keys(ch).forEach(k=>kc(k));
 const rows=collectionRows(analysisScope),m=collectionMetrics(rows),ranked=rows.filter(d=>analysisMetric==='value'||((d.hasCost||d.kind==='cards')&&(analysisMetric!=='roi'||d.ach>0))).map(d=>({...d,score:analysisMetric==='value'?d.value*d.qty:analysisMetric==='gain'?(d.value-(d.ach||0))*d.qty:100*(d.value-d.ach)/d.ach})).sort((a,b)=>b.score-a.score).slice(0,8);
 const topValue=[...rows].sort((a,b)=>b.value*b.qty-a.value*a.qty).slice(0,5);const topShare=m.value?100*totalOf(topValue,d=>d.value*d.qty)/m.value:0;
 const groups={};rows.forEach(d=>{const key=d.kind+'|'+(d.ser||'Sans série');groups[key]??={kind:d.kind,series:d.ser||'',label:(d.ser||'Sans série')+' · '+(d.kind==='sealed'?'Scellés':'Cartes'),value:0};groups[key].value+=d.value*d.qty});const series=Object.values(groups).sort((a,b)=>b.value-a.value).slice(0,8);
 document.getElementById('stWrap').innerHTML=`${titleBlock('ANALYSES','Analyses','')}<div class="analysis-tools"><div class="segmented">${[['all','Toute la collection'],['sealed','Scellés'],['cards','Cartes']].map(([v,l])=>`<button aria-pressed="${v===analysisScope}" class="${v===analysisScope?'selected':''}" onclick="setAnalysisScope('${v}')">${l}</button>`).join('')}</div><span>${rows.length} références analysées</span></div><div class="metrics-strip">${metric('Valeur estimée',money(m.value),`${m.qty} objets`)}${metric('Coût d’achat',money(m.cost),'Cartes sans coût : 0 €')}${metric('Bénéfice potentiel',money(m.gain),'Valeur estimée − coût d’achat',m.gain>=0?'positive':'negative')}${metric('Concentration du top 5',topShare.toLocaleString('fr-FR',{maximumFractionDigits:1})+' %','Part de la valeur dans cinq références')}</div><section class="surface allocation-chart">${panelTitle('COMPOSITION','Répartition par série')}<div class="allocation-layout"><div class="ring-frame"><canvas id="aAllocation" role="img" aria-label="Répartition de la valeur par série"></canvas><div class="ring-label"><span id="ringName">Valeur totale</span><strong id="ringValue">${money(m.value)}</strong></div></div><div class="ring-legend">${series.map((g,i)=>`<button onmouseenter="highlightAllocation(${i})" onfocus="highlightAllocation(${i})" onmouseleave="highlightAllocation(-1)" onblur="highlightAllocation(-1)" onclick="drillSeries('${g.kind}',decodeURIComponent('${encodeURIComponent(g.series).replace(/'/g,'%27')}'))"><i style="background:${allocationColors[i]}"></i><span>${esc(g.label)}</span><strong>${money(g.value)}</strong></button>`).join('')}</div></div></section><div class="analysis-grid">${chartPanel('aCompare','INVESTISSEMENT','Coût et valeur actuelle')}${chartPanel('aSeries','RÉPARTITION','Valeur par série')}</div><p class="data-note">Cliquez sur une série pour afficher les pièces correspondantes.</p><section class="surface ranking-panel">${panelTitle('CLASSEMENT','Classement',`<label class="filter-label">Classer par<select onchange="setAnalysisMetric(this.value)"><option value="value" ${analysisMetric==='value'?'selected':''}>Valeur totale</option><option value="gain" ${analysisMetric==='gain'?'selected':''}>Gain potentiel (€)</option><option value="roi" ${analysisMetric==='roi'?'selected':''}>Rendement (%)</option></select></label>`)}${ranked.length?ranked.map((d,i)=>pieceRow(d,i,analysisMetric==='roi'?pct(d.score):money(d.score))).join(''):'<p class="data-note">Aucune référence avec un prix d’achat utilisable pour cette sélection.</p>'}</section><div class="history-note"><span>↗</span><div><strong>Source : votre tableau</strong><p>Les montants viennent de votre tableau. Un historique daté sera nécessaire pour suivre leur évolution réelle.</p></div></div>`;
 if(typeof Chart==='undefined'){document.querySelectorAll('.chart-frame').forEach(e=>e.textContent='Graphique indisponible. Les totaux et le classement restent accessibles.');return}
 const rest=Math.max(0,m.value-totalOf(series,d=>d.value));const allocation=series.map(g=>({label:g.label,value:g.value}));if(rest>0.01)allocation.push({label:'Autres séries',value:rest});
 ch.aAllocation=new Chart(document.getElementById('aAllocation'),{type:'doughnut',data:{labels:allocation.map(g=>g.label),datasets:[{data:allocation.map(g=>g.value),backgroundColor:allocationColors,borderWidth:5,borderColor:'#171a21',borderRadius:7,hoverOffset:12}]},options:{responsive:true,maintainAspectRatio:false,cutout:'78%',animation:{duration:reducedMotion.matches?0:1000},plugins:{legend:{display:false},tooltip:{enabled:false}},onHover:(e,els)=>highlightAllocation(els.length?els[0].index:-1),onClick:(e,els)=>{if(els.length&&series[els[0].index]){const g=series[els[0].index];drillSeries(g.kind,g.series)}}}});
 const common={responsive:true,maintainAspectRatio:false,animation:{duration:reducedMotion.matches?0:650},plugins:{legend:{position:'bottom',labels:{color:'#b4b9c5',usePointStyle:true,boxWidth:8,padding:20}},tooltip:{callbacks:{label:c=>`${c.dataset.label||'Valeur'} : ${money(c.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:'#b4b9c5',font:{size:11}}},y:{grid:{color:'#ffffff09'},ticks:{color:'#8b93a3',callback:v=>new Intl.NumberFormat('fr-FR',{notation:'compact'}).format(v)+' €'}}}};
 const kinds=analysisScope==='all'?['sealed','cards']:[analysisScope];const values=kinds.map(k=>{const r=rows.filter(d=>d.kind===k&&(d.hasCost||d.kind==='cards'));return {cost:totalOf(r,d=>d.qty*d.ach),value:totalOf(r,d=>d.qty*d.value)}});
 ch.aCompare=new Chart(document.getElementById('aCompare'),{type:'bar',data:{labels:kinds.map(k=>k==='sealed'?'Scellés':'Cartes'),datasets:[{label:'Coût d’achat',data:values.map(v=>v.cost),backgroundColor:'#59657a',borderRadius:5},{label:'Valeur actuelle',data:values.map(v=>v.value),backgroundColor:'#e66759',borderRadius:5}]},options:common});
 ch.aSeries=new Chart(document.getElementById('aSeries'),{type:'bar',data:{labels:series.map(s=>s.label),datasets:[{label:'Valeur',data:series.map(s=>s.value),backgroundColor:series.map(s=>s.kind==='sealed'?'#e66759':'#889de1'),borderRadius:4}]},options:{...common,indexAxis:'y',onClick:(e,els)=>{if(els.length){const s=series[els[0].index];drillSeries(s.kind,s.series)}},plugins:{...common.plugins,legend:{display:false}},scales:{x:common.scales.y,y:{grid:{display:false},ticks:{color:'#b4b9c5',font:{size:10}}}}}});
};
function initCollection(){
 document.querySelector('.hdr-row').insertAdjacentHTML('beforeend','<button class="bonus-button" aria-label="Ouvrir un booster" onclick="jump(\'boosters\')">✧ <span>Ouvrir un booster</span></button>');
 document.querySelector('.nav').insertAdjacentHTML('afterbegin','<div class="sidebar-brand"><img src="assets/pokeball.svg" alt="">Poké<span>Collect</span></div><p class="sidebar-caption">VOTRE COLLECTION</p>');
 document.querySelector('.nav').insertAdjacentHTML('beforeend','<div class="sidebar-footer"><span class="live-mark"></span> Collection personnelle<small></small></div>');
 document.querySelectorAll('.ni').forEach(n=>{n.tabIndex=0;n.setAttribute('role','button');n.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();n.click()}}});
 for(const [id,k,t,sub,sum] of [['scelles','INVENTAIRE','Vos scellés.','','sealed-summary'],['cartes','LE CLASSEUR','Vos cartes.','','cards-summary']]){document.getElementById('tab-'+id).insertAdjacentHTML('afterbegin',titleBlock(k,t,sub)+`<div id="${sum}" class="selection-summary"></div>`)}
 viewC='gal';viewS='gal';document.getElementById('cvList').classList.remove('on');document.getElementById('cvGal').classList.add('on');document.getElementById('svList').classList.remove('on');document.getElementById('svGal').classList.add('on');
 document.querySelector('#ov .sht-close').setAttribute('aria-label','Fermer la fiche');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSht();closeOpening();closeBC();closeHist()}if(e.key==='Tab'&&document.getElementById('ov').classList.contains('open')){const items=[...document.querySelectorAll('#ov button,#ov a[href],#ov select,#ov input')].filter(el=>el.getClientRects().length);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 buildDash();if(ready){buildSellees();buildCartes()}
}
initCollection();
// Animate the actual detail image, never a previously selected gallery image.
const panelOpen=openSht;
let detailAnimation=null;
openSht=function(){
 detailAnimation?.cancel();
 panelOpen();
 const target=document.querySelector('#shtB .sht-img img');
 if(!target||reducedMotion.matches)return;
 detailAnimation=target.animate([
  {opacity:0,transform:'translateY(14px) scale(.94)'},
  {opacity:1,transform:'translateY(0) scale(1)'}
 ],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'});
};
// Inspect the card under a moving light; inactive galleries remain still.
document.getElementById('shtB').addEventListener('pointermove',e=>{if(reducedMotion.matches||e.pointerType==='touch')return;const img=e.currentTarget.querySelector('.sht-img img');if(!img)return;const r=img.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;img.style.transform=`perspective(1000px) rotateY(${Math.max(-1,Math.min(1,x))*7}deg) rotateX(${-Math.max(-1,Math.min(1,y))*5}deg)`});
document.getElementById('shtB').addEventListener('pointerleave',e=>{const img=e.currentTarget.querySelector('.sht-img img');if(img)img.style.transform='none'});
// Open the reviewed catalogue record for the card actually displayed.
const cardDetail=openC;
openC=function(i){
 const d=_vc[i];if(!d)return;
 cardDetail(i);
 const link=cardmarketLink(d);
 document.getElementById('shtB').insertAdjacentHTML('beforeend',`<div class="det-row"><span class="det-lbl">Bénéfice potentiel / carte</span><span class="det-val">${money(d.val-(d.ach||0))}</span></div>${link?`<a class="cardmarket-link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">Voir sur Cardmarket <span>↗</span></a>${link.note?`<p class="cardmarket-note">${esc(link.note)}</p>`:''}`:'<p class="cardmarket-note">Aucun lien Cardmarket renseigné.</p>'}`);
};
