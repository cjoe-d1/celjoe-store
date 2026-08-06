"use client";

import { useEffect } from "react";

/**
 * PWA lifecycle provider.
 *
 * Registers the service worker and handles push subscription
 * lifecycle. This runs on every page load — the service worker
 * registration is idempotent.
 *
 * Push subscription management is deferred to the admin-specific
 * PushSubscribeButton component on the /admin dashboard.
 */
export function PwaProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service worker registered:", reg.scope);

        // Listen for subscription changes (e.g., browser rotates VAPID keys)
        reg.addEventListener("pushsubscriptionchange", () => {
          console.log("[PWA] Push subscription changed — re-subscribe needed.");
        });

        // Listen for navigation messages from notification clicks
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "navigate" && event.data?.url) {
            window.location.href = event.data.url;
          }
        });
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err.message);
      });
  }, []);

  return null; // Invisible — just handles side effects
}
