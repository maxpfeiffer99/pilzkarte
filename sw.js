// Service Worker für pilzkarte_v14.html: hält die Seite und die Kartenbibliothek offline bereit
// und liefert vorgeladene Kartenkacheln aus dem Speicher.
const SHELL='pk-shell-v14', TILES='pk-tiles-v1', PAGE='./pilzkarte_v14.html';
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css','https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SHELL).then(c=>Promise.all(
    [PAGE,'./index.html',...LIBS].map(u=>fetch(u,{mode:u.startsWith('http')?'cors':'same-origin'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{}))
  )));
  self.skipWaiting();
});
// alte Shell-Caches (pk-shell-v1 …) entfernen, Kachel-Speicher bleibt erhalten
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pk-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(SHELL).then(c=>c.put(r,cp));return res})
      .catch(()=>caches.open(SHELL).then(c=>c.match(r,{ignoreSearch:true}).then(m=>m||c.match(PAGE)))));
    return;
  }
  if(r.url.startsWith('https://cdnjs.cloudflare.com/')){
    e.respondWith(caches.open(SHELL).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{c.put(r,res.clone());return res}))));
    return;
  }
  if(r.destination==='image'){
    e.respondWith(caches.open(TILES).then(c=>c.match(r.url).then(m=>m||fetch(r))));
  }
});
