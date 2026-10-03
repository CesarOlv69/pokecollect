/* Pure validation/calculation, shared by the app and its tests. */
const PriceTrends=(()=>{
 const langs={fr:'Français',français:'Français',french:'Français',en:'Anglais',anglais:'Anglais',english:'Anglais',jap:'Japonais',japonais:'Japonais',japanese:'Japonais',coréen:'Coréen',korean:'Coréen'};
 const conditions={'M/NM':'NM',M:'NM',MINT:'NM','NEAR MINT':'NM',NM:'NM',EX:'EX',EXC:'EX',EXCELLENT:'EX','EX/NM':'EX',GD:'GD',GOOD:'GD',LP:'LP','LIGHT PLAYED':'LP',PL:'PL',PLAYED:'PL',PO:'PO',POOR:'PO'};
 const normalize=x=>String(x||'').normalize('NFKC').trim();
 const identity=d=>[d.nom,d.num,d.ser,d.lng,d.ett].map(x=>normalize(x).toLowerCase()).join('|');
 function product(url){const u=new URL(url);if(u.protocol!=='https:'||!['www.cardmarket.com','cardmarket.com'].includes(u.hostname)||u.username||u.password)throw Error('Lien Cardmarket invalide.');const m=u.pathname.match(/^\/[a-z]{2}\/Pokemon\/Products\/Singles\/(.+?)\/?$/);if(!m)throw Error('Fiche Cardmarket invalide.');return m[1]}
 function price(s){if(typeof s!=='string'||!/^\s*\d[\d .\u00a0\u202f]*,\d{2}\s*€\s*$/.test(s))return NaN;return Number(s.replace(/[ .\u00a0\u202f€]/g,'').replace(',','.'))}
 function prepare(text,card,url){
  if(text.length>2000000)throw Error('Relevé trop volumineux.');
  let r;try{r=JSON.parse(text)}catch{throw Error('Collez le relevé copié par le raccourci Safari.');}
  if(r.error)throw Error(String(r.error).slice(0,200));
  if(r.format!=='pokecollect-cardmarket-v1'||!Array.isArray(r.offers)||r.offers.length>5000||typeof r.incomplete!=='boolean')throw Error('Format de relevé non reconnu.');
  if(product(r.url)!==product(url))throw Error('Ce relevé concerne une autre carte.');
  const date=Date.parse(r.capturedAt);if(!Number.isFinite(date)||date>Date.now()+300000)throw Error('Date du relevé invalide.');
  const language=langs[normalize(card.lng).toLowerCase()],condition=conditions[normalize(card.ett).toUpperCase()];
  if(!language||!condition)throw Error('Langue ou état ambigu / carte gradée : estimation automatique indisponible pour cette référence.');
  if(/stamp|ed1|espèces delta/i.test(card.nom))throw Error('Cette variante nécessite une vérification manuelle des annonces (stamp, édition ou finition).');
  const seen=new Set();
  const matching=r.offers.filter(o=>{
   if(!o||typeof o.id!=='string'||seen.has(o.id))return false;seen.add(o.id);
   return langs[normalize(o.language).toLowerCase()]===language&&o.condition===condition&&Number.isFinite(price(o.price))&&price(o.price)>0&&!/\b(PSA|PCA|BGS|CGC|ACE|graded|gradée?)\b/i.test(o.description||'');
  }).map(o=>({id:o.id,seller:String(o.seller||'').slice(0,80),price:price(o.price)})).sort((a,b)=>a.price-b.price).slice(0,5);
  if(!matching.length)throw Error('Aucune offre non gradée dans la langue et l’état exacts de cette carte.');
  return {id:identity(card)+'|'+r.capturedAt,key:identity(card),name:card.nom,number:card.num,series:card.ser,language,condition,url:r.url,capturedAt:new Date(date).toISOString(),incomplete:r.incomplete,offers:matching,count:matching.length,mean:Math.round(matching.reduce((s,o)=>s+Math.round(o.price*100),0)/matching.length)/100};
 }
 return {prepare,identity,product};
})();
if(typeof module!=='undefined')module.exports=PriceTrends;
