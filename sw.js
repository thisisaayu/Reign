/* Reign — offline service worker. Cache-first, network fallback. */
const CACHE = 'reign-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon.png',
  './assets/icons/32x32.png',
  './assets/icons/16x16.png',
  './assets/fonts/fonts.css',
  './src/styles/themes.css',
  './src/styles/layout.css',
  './src/styles/editor.css',
  './src/js/main.js',
  './src/js/core/store.js',
  './src/js/core/utils.js',
  './src/js/core/snapshots.js',
  './src/js/editor/editor.js',
  './src/js/editor/menus.js',
  './src/js/graph/graph.js',
  './src/js/views/preview.js',
  './src/js/views/novel.js',
  './src/js/ui/stats.js',
  './src/js/ui/toolbar.js',
  './src/js/ui/palette.js',
  './src/js/ui/find.js',
  './src/js/ui/search.js',
  // fonts — pre-cache woff2 (relative to sw scope)
  './assets/fonts/6NUs8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9hFwpX9W37ll9_mvIiQvTm.woff2',
  './assets/fonts/6NUs8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9hFwpX9W37ll9_mvMiQvTm.woff2',
  './assets/fonts/6NUs8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9hFwpX9W37ll9_mv0iQg.woff2',
  './assets/fonts/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxCBTeO-U.woff2',
  './assets/fonts/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxCFTeO-U.woff2',
  './assets/fonts/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2',
  './assets/fonts/pixiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0She1YmV.woff2',
  './assets/fonts/pixiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2',
  './assets/fonts/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx3cwhsk.woff2',
  './assets/fonts/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxTcwhsk.woff2',
  './assets/fonts/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxPcwhsk.woff2',
  './assets/fonts/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx_cwhsk.woff2',
  './assets/fonts/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx7cwhsk.woff2',
  './assets/fonts/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2',
  './assets/fonts/cY9XfjOCX1hbuyalUrK439vogqCz_goCYw7oRd6JFYkzbBZD.woff2',
  './assets/fonts/cY9XfjOCX1hbuyalUrK439vogqCz_goCYw7oRd6JFYgzbBZD.woff2',
  './assets/fonts/cY9XfjOCX1hbuyalUrK439vogqCz_goCYw7oRd6JFYYzbA.woff2',
  './assets/fonts/cY9AfjOCX1hbuyalUrK439HyjJBG.woff2',
  './assets/fonts/cY9AfjOCX1hbuyalUrK439DyjJBG.woff2',
  './assets/fonts/cY9AfjOCX1hbuyalUrK4397yjA.woff2'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=> self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  // Only handle GET for our origin
  if(e.request.method!=='GET') return;
  const url = new URL(e.request.url);
  // For navigations, serve index.html from cache (SPA fallback)
  if(e.request.mode==='navigate'){
    e.respondWith(caches.match('./index.html').then(r=> r || fetch(e.request)));
    return;
  }
  // Cache-first for same-origin assets
  if(url.origin===self.location.origin){
    e.respondWith(caches.match(e.request).then(hit=>{
      if(hit) return hit;
      return fetch(e.request).then(res=>{
        // opportunistic cache for future offline
        const clone=res.clone();
        caches.open(CACHE).then(c=> c.put(e.request, clone));
        return res;
      }).catch(()=> caches.match('./index.html'));
    }));
  }
});
