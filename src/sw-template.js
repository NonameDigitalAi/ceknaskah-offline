const CACHE='ceknaskah-__VERSION__';
const ASSETS=__ASSETS__;
const urls=ASSETS.map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{for(let i=0;i<urls.length;i+=12)await cache.addAll(urls.slice(i,i+12));}catch(e){await caches.delete(CACHE);throw e;}})()));
// A new version waits for all existing tabs to close. Drafts are never force-reloaded.
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();for(const key of await caches.keys())if(key.startsWith('ceknaskah-')&&key!==CACHE)await caches.delete(key);})()));
self.addEventListener('message',event=>{if(event.data?.type==='CHECK_OFFLINE')event.waitUntil((async()=>{const cache=await caches.open(CACHE);let ready=true;for(const url of urls){if(!await cache.match(url)){ready=false;break;}}event.ports[0]?.postMessage({ready,version:CACHE});})());});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).pathname.includes('/api/')||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;try{return await fetch(event.request);}catch(e){if(event.request.mode==='navigate')return (await cache.match(new URL('./',self.registration.scope).href))||Response.error();throw e;}})());});
