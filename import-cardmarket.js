/* Safari shortcut: Run JavaScript on Web Page, then Copy to Clipboard. */
(()=>{
 try {
  const u=new URL(location.href);
  if(u.protocol!=='https:'||!['cardmarket.com','www.cardmarket.com'].includes(u.hostname)||!/^\/[a-z]{2}\/Pokemon\/Products\/[^/]+\/[^/]+/.test(u.pathname))throw Error('Ouvre une fiche produit Pokémon Cardmarket.');
  const name=Array.from(document.querySelector('h1')?.childNodes||[]).filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
  if(!name)throw Error('Nom du produit introuvable. Attends le chargement de la fiche.');
  const image=Array.from(document.querySelectorAll('main img')).find(img=>img.src.startsWith('https://product-images.s3.cardmarket.com/'))?.src||'';
  u.search='';u.hash='';
  completion(JSON.stringify({format:'pokecollect-product-v1',name,url:u.href,image,kind:u.pathname.includes('/Singles/')?'card':'sealed'}));
 }catch(e){completion(JSON.stringify({format:'pokecollect-product-v1',error:e.message}));}
})();
