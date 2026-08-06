/**
 * CELJOE Store Admin — Service Worker
 *
 * Responsibilities:
 *   1. Push notification display (admin order/quotation alerts)
 *   2. Notification click → navigate to relevant admin page
 *   3. No aggressive caching — admin pages always fetch fresh
 */

// Activate immediately on install
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Take control of all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event — display notification from server
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "CELJOE Store", body: event.data.text() };
  }

  const title = payload.title ?? "CELJOE Store";
  const options = {
    body: payload.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag, // deduplicate notifications for the same order/quotation
    data: { url: payload.url ?? "/admin" },
    vibrate: [200, 100, 200],
    requireInteraction: true, // stay visible until admin taps
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — navigate to the relevant admin page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/admin";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // If a window is already open on any admin page, focus it
        for (const client of clients) {
          if (client.url.includes("/admin") && "focus" in client) {
            client.focus();
            return client.postMessage({ type: "navigate", url });
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(url);
      }),
  );
});

// Push subscription change — notify the server (handled client-side)
// No-op here; the PwaProvider client component handles this via the
// pushsubscriptionchange event on the ServiceWorkerRegistration.
