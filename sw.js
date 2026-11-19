// Met l'application en cache pour qu'elle s'ouvre hors ligne.
// Les DONNÉES ne sont jamais mises en cache : elles sont toujours
// retéléchargées et déchiffrées à la volée.
// ⚠️ Version : bumper ICI et dans index.html (const VERSION) dans le MÊME commit.
// L'app affiche VERSION en pied de page et demande au service worker son CACHE :
// si les deux divergent, l'écart s'affiche — on sait toujours ce qui tourne.
const CACHE = "suivi-v42";
const COQUILLE = ["./index.html", "./manifest.json", "./icone.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

// L'app demande « version » : on répond avec le nom exact du cache qui tourne.
self.addEventListener("message", e => {
  if (e.data === "version" && e.source) e.source.postMessage({ version: CACHE });
});

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  // Tout ce qui vient de GitHub passe directement par le réseau, jamais par le cache.
  if (u.hostname !== self.location.hostname) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copie = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copie)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
