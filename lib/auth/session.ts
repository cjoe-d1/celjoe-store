import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { requireEnv } from "config/env";

/**
 * Session management — Phase A
 *
 * Two session types:
 *  - AdminSession: full operational access (server-side cookie)
 *  - CustomerSession: own-data access (Supabase SSR cookie)
 *
 * No role hierarchy. No permission system.
 */

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  isActive: boolean;
};

export type CustomerSession = {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
};

const ADMIN_SESSION_COOKIE = "celjoe_session";
const SUPABASE_COOKIE_PREFIX = "sb-";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const getSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv.supabaseUrl(),
    requireEnv.supabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components cannot set cookies; ignored.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore
          }
        },
      },
    },
  );
};

const readCookieSession = async (): Promise<AdminSession | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf-8"),
    ) as Partial<AdminSession>;
    if (!parsed.userId || !parsed.email) return null;
    return {
      userId: parsed.userId,
      email: parsed.email,
      fullName: parsed.fullName ?? "Admin",
      isActive: parsed.isActive ?? true,
    };
  } catch {
    return null;
  }
};

const writeCookieSession = async (session: AdminSession) => {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64");
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: encoded,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
};

const clearCookieSession = async () => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};

export async function getCurrentSession(): Promise<AdminSession | null> {
  // Admin session is read exclusively from the celjoe_session cookie.
  // We do NOT fall back to a Supabase auth session: that would let any
  // Supabase user (including customers who registered via /account/register)
  // be treated as an admin, which is a privilege-escalation bug.
  return readCookieSession();
}

export async function requireSession(): Promise<AdminSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/**
 * Customer session is sourced directly from the Supabase SSR cookie.
 * The Supabase client is the source of truth for customer auth.
 *
 * Stale refresh tokens (e.g. leftover cookie after logout on another
 * device) can cause `getSession()` to throw `AuthApiError`. When that
 * happens we clear all Supabase auth cookies so the error doesn't
 * repeat on every request, then return null.
 */
export async function getCurrentCustomerSession(): Promise<CustomerSession | null> {
  const adminCookie = await readCookieSession();
  if (adminCookie) return null;

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    const user = data.session.user;
    return {
      userId: user.id,
      email: user.email ?? "",
      fullName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.first_name as string | undefined) ??
        "Customer",
      phone: (user.user_metadata?.phone as string | null) ?? null,
    };
  } catch (err: unknown) {
    // `AuthApiError` ("Invalid Refresh Token") escapes the normal
    // { data, error } return pattern when the refresh token has been
    // revoked or expired. Clear the stale cookies so the user can
    // log in fresh on the next attempt.
    const isAuthError =
      err instanceof Error &&
      (err.name === "AuthApiError" || err.message?.includes("Refresh Token"));

    if (isAuthError) {
      try {
        const cookieStore = await cookies();
        for (const c of cookieStore.getAll()) {
          if (c.name.startsWith(SUPABASE_COOKIE_PREFIX)) {
            cookieStore.set({ name: c.name, value: "", maxAge: 0, path: "/" });
          }
        }
      } catch {
        // Best effort — clearing cookies may fail in RSC context.
      }
    }
    return null;
  }
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCurrentCustomerSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function getClientMetadata(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor ? (forwardedFor.split(",")[0]?.trim() ?? null) : null;
  const userAgent = headerList.get("user-agent") ?? null;
  return { ip, userAgent };
}

export const sessionCookieName = ADMIN_SESSION_COOKIE;
export { writeCookieSession, clearCookieSession };
