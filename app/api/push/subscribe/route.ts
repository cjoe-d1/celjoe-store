import { NextRequest, NextResponse } from "next/server";
import { db } from "lib/supabase/admin";
import { getCurrentSession } from "lib/auth/session";

/**
 * POST /api/push/subscribe
 *
 * Stores a browser PushSubscription for the authenticated admin user.
 * Called by the PushSubscribeButton component after pushManager.subscribe().
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;
    const { p256dh, auth } = keys ?? {};

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Missing subscription fields (endpoint, p256dh, auth)" },
        { status: 400 },
      );
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;

    // Upsert: replace existing subscription for same user+endpoint
    const { error } = await db.from("push_subscriptions").upsert(
      {
        user_id: session.userId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, endpoint" },
    );

    if (error) {
      console.error("[Push] Failed to store subscription:", error.message);
      return NextResponse.json(
        { error: "Failed to store subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[Push] Subscribe error:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
