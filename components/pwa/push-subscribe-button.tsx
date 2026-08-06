"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "components/chds";

/**
 * Push subscription manager for admin users.
 *
 * Renders a toggle button on the admin dashboard that:
 *   - If notifications NOT granted: "Enable Notifications"
 *   - If notifications granted: "Notifications active"
 *
 * Handles VAPID key, service worker readiness, and
 * pushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscribeButton() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current permission state on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setError("Notification permission denied. Enable in browser settings.");
        setLoading(false);
        return;
      }

      // 2. Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("VAPID public key not configured.");
        setLoading(false);
        return;
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // 4. Store subscription on server via API route
      const subJson = subscription.toJSON();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Server error: ${response.status} ${body}`);
      }

      setSubscribed(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to enable notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Browser doesn't support notifications at all
  if (typeof window !== "undefined" && !("Notification" in window)) {
    return (
      <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  // Already granted and subscribed
  if (permission === "granted" && subscribed) {
    return (
      <div className="flex items-center gap-[var(--ds-space-2)]">
        <span className="inline-block h-[var(--ds-space-2)] w-[var(--ds-space-2)] rounded-full bg-[var(--ds-color-success)]" />
        <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          Push notifications active
        </span>
      </div>
    );
  }

  // Subscribed but not confirmed (page refresh — permission already granted)
  if (permission === "granted" && !subscribed) {
    return (
      <Button onClick={handleSubscribe} disabled={loading} variant="outline">
        {loading ? "Checking..." : "Enable Notifications"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--ds-space-2)]">
      <Button onClick={handleSubscribe} disabled={loading}>
        {loading ? "Enabling..." : "Enable Notifications"}
      </Button>
      {error ? (
        <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-danger)]">
          {error}
        </p>
      ) : null}
      <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
        Get instant alerts when new orders or quotations arrive.
      </p>
    </div>
  );
}
