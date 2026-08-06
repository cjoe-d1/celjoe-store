import webpush from "web-push";
import { db } from "lib/supabase/admin";

// --------------------------------------------------------------------------
// VAPID configuration
// --------------------------------------------------------------------------
// Generate once: npx web-push generate-vapid-keys
// Store private key server-side only (VAPID_PRIVATE_KEY).
// Expose public key to client (NEXT_PUBLIC_VAPID_PUBLIC_KEY).

const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@celjoe.com";

function ensureVapid(): void {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "[Push] VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.local.",
    );
  }

  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
}

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  /** Deduplicate notifications for the same entity. */
  tag?: string;
};

// --------------------------------------------------------------------------
// Dispatch
// --------------------------------------------------------------------------

/**
 * Send a push notification to all admin devices.
 *
 * Reads all subscriptions from the push_subscriptions table
 * and dispatches via web-push. Failed/expired subscriptions
 * (HTTP 404/410) are cleaned up automatically.
 *
 * Never throws — push failures must not affect upstream
 * operations (order creation, quotation submission).
 */
export async function sendPushToAllAdmins(
  payload: PushPayload,
): Promise<void> {
  try {
    ensureVapid();

    const { data: subscriptions, error } = (
      await db
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
    ) as {
      data: { id: string; endpoint: string; p256dh: string; auth: string }[] | null;
      error: null | { message: string };
    };

    if (error) {
      console.error("[Push] Failed to fetch subscriptions:", error.message);
      return;
    }

    if (!subscriptions?.length) {
      console.log("[Push] No admin subscriptions — skipping.");
      return;
    }

    const pushBody = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushBody,
          )
          .catch(async (err: webpush.WebPushError) => {
            // Clean up expired or invalid subscriptions
            if (
              err.statusCode === 404 ||
              err.statusCode === 410 ||
              err.statusCode === 400
            ) {
              await db
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id)
                .then((r: { error: null | { message: string } }) => {
                  if (r.error)
                    console.warn(
                      "[Push] Failed to clean up expired subscription:",
                      r.error.message,
                    );
                });
            }
            throw err; // re-throw for Promise.allSettled
          }),
      ),
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.warn(
        `[Push] ${failures.length}/${subscriptions.length} subscriptions failed.`,
      );
    }
  } catch (err) {
    console.error(
      "[Push] Dispatch error:",
      err instanceof Error ? err.message : err,
    );
    // Never throw — push failure must not roll back DB operations
  }
}
