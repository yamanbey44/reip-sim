const CACHE='reip-field-shell-v2';
const OLD=['reip-field-shell-v1'];
const SHELL=['./field.html','./manifest.json'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(SHELL.map(x=>x+'?pwa=2')))
      .catch(()=>{})
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);

  // Never intercept writes or Firebase/API traffic.
  if(req.method!=='GET' || url.origin!==self.location.origin){ return; }

  // Field page: network-first so new versions arrive immediately; cached page is offline fallback.
  if(url.pathname.endsWith('/field.html')){
    event.respondWith(
      fetch(req).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put('./field.html',copy));
        return resp;
      }).catch(()=>caches.match('./field.html'))
    );
    return;
  }

  // Do not control the SCADA/index page. Always go to network.
  if(url.pathname.endsWith('/index.html') || url.pathname.endsWith('/reip-sim/')){
    event.respondWith(fetch(req));
    return;
  }

  // Other same-origin static Field assets: cache-first with network fill.
  event.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return resp;
    }))
  );
});