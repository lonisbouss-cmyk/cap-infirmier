// CAP Infirmier : service worker (utilisation hors connexion)
const CACHE = 'cap-infirmier-v1';
const BASE = '/cap-infirmier/';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([BASE, BASE + 'index.html', BASE + 'icon.png', BASE + 'manifest.webmanifest']).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // On ne touche qu'aux fichiers du site (pas au compte, ni au tuteur)
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === BASE || url.pathname.endsWith('version.txt');
  if (isPage) {
    // Page : réseau d'abord (pour recevoir les mises à jour), copie locale si hors connexion
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match(BASE + 'index.html')))
    );
    return;
  }
  // Scripts, images, polices : copie locale d'abord (leurs noms changent à chaque version)
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
