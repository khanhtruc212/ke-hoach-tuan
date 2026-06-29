/* KT Planner service worker — chạy offline + tải nhanh */
const CACHE = "ktplanner-v1";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Trang web: ưu tiên mạng, offline thì dùng bản đã lưu
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }
  // Tài nguyên khác: lấy cache trước, đồng thời cập nhật ngầm
  e.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
        return resp;
      }).catch(() => cached)
    )
  );
});
