const CACHE='reip-field-shell-v1';
const SHELL=['./field.html','./manifest.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.pathname.endsWith('/state.json')){
   event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
   return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return resp}).catch(()=>caches.match('./field.html'))));
});