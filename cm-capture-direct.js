/* Safari > Partager > Raccourcis > Exécuter JavaScript sur la page web.
   Reads displayed offers only. No network requests or account access. */
function collectCardmarketPage(doc, pageURL) {
 const u=new URL(pageURL);
 if(u.protocol!=='https:'||!['www.cardmarket.com','cardmarket.com'].includes(u.hostname)||!/^\/[a-z]{2}\/Pokemon\/Products\/Singles\//.test(u.pathname))throw Error('Ouvrez une fiche carte Pokémon sur Cardmarket.');
 const offers=[...doc.querySelectorAll('.article-row')].map(el=>{
  const attrs=el.querySelector('.product-attributes');
  const lang=[...(attrs?.querySelectorAll('[aria-label]')||[])].map(e=>e.getAttribute('aria-label')).find(s=>/^(Français|Anglais|Japonais|Coréen|French|English|Japanese|Korean)$/.test(s));
  const price=el.querySelector('.col-offer .price-container')?.textContent||el.querySelector('.mobile-offer-container .color-primary')?.textContent||'';
  return {id:el.id,condition:el.querySelector('.article-condition')?.textContent.trim(),language:lang||'',price:price.trim(),seller:el.querySelector('.seller-name a')?.textContent.trim()||'',description:(el.querySelector('.product-comments .fonticon-comments')?.getAttribute('aria-label')||el.querySelector('.product-comments [data-bs-original-title]')?.getAttribute('data-bs-original-title')||el.querySelector('.product-comments')?.textContent||'').trim().slice(0,1200),attributes:[...(attrs?.querySelectorAll('[aria-label]')||[])].map(e=>e.getAttribute('aria-label'))};
 });
 if(!offers.length)throw Error('Aucune offre chargée. Attendez que Cardmarket affiche les annonces.');
 const more=doc.querySelector('#loadMoreButton');
 return {format:'pokecollect-cardmarket-v1',url:u.origin+u.pathname,title:doc.querySelector('h1')?.textContent.trim()||'',capturedAt:new Date().toISOString(),incomplete:!!(more&&more.getClientRects().length),offers};
}
try { const data=JSON.stringify(collectCardmarketPage(document,location.href));if(data.length>60000)throw Error('Trop d’offres chargées pour le transfert direct. Utilisez le relevé classique.');completion('https://cesarolv69.github.io/pokecollect/#releve='+encodeURIComponent(data)); }
catch(e) { completion('https://cesarolv69.github.io/pokecollect/#releve='+encodeURIComponent(JSON.stringify({error:e.message})));  }
