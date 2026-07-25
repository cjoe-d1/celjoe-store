import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { requireEnv } from "config/env";
import { isAdminRole, type AdminRole } from "lib/auth/admin-roles";

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
};

const SESSION_COOKIE = "celjoe_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

type SupabaseSessionUser = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown> | null;
  app_metadata: Record<string, unknown> | null;
};

type SupabaseSessionResponse = {
  data: { session: { user: SupabaseSessionUser } | null };
  error: { message: string } | null;
};

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
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf-8"),
    ) as Partial<AdminSession>;
    if (!parsed.userId || !parsed.email || !parsed.role) return null;
    if (!isAdminRole(parsed.role)) return null;
    return {
      userId: parsed.userId,
      email: parsed.email,
      fullName: parsed.fullName ?? "Staff",
      role: parsed.role,
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
    name: SESSION_COOKIE,
    value: encoded,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
};

const clearCookieSession = async () => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};

export async function getCurrentSession(): Promise<AdminSession | null> {
  const cookieSession = await readCookieSession();
  if (cookieSession) return cookieSession;

  try {
    const supabase = await getSupabaseServerClient();
    const result = (await supabase.auth.getSession()) as SupabaseSessionResponse;
    if (result.error || !result.data.session) return null;

    const user = result.data.session.user;
    const roleMeta =
      (user.app_metadata?.role as string | undefined) ??
      (user.user_metadata?.role as string | undefined) ??
      "customer_service";

    if (!isAdminRole(roleMeta)) return null;

    const session: AdminSession = {
      userId: user.id,
      email: user.email ?? "staff@celjoe.store",
      fullName:
        (user.user_metadata?.full_name as string | undefined) ?? "Staff",
      role: roleMeta,
      isActive: true,
    };

    await writeCookieSession(session);
    return session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<AdminSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requireRole(
  roles: AdminRole | readonly AdminRole[],
): Promise<AdminSession> {
  const session = await requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.role)) {
    throw new Error("FORBIDDEN");
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

export const sessionCookieName = SESSION_COOKIE;
export { writeCookieSession, clearCookieSession };
