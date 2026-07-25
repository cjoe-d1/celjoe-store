"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireEnv } from "config/env";
import { isAdminRole, type AdminRole } from "lib/auth/admin-roles";
import { clearCookieSession, writeCookieSession } from "lib/auth/session";
import { supabase as browserSupabase } from "lib/supabase/client";

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
            // Server Component — ignored.
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

const inferRole = (
  userMetadata: Record<string, unknown> | null | undefined,
  appMetadata: Record<string, unknown> | null | undefined,
  email: string,
): AdminRole | null => {
  const declared =
    (appMetadata?.role as string | undefined) ??
    (userMetadata?.role as string | undefined);
  if (declared && isAdminRole(declared)) return declared;
  if (email.endsWith("@celjoe.store") || email.endsWith("@celjoe.com")) {
    return "customer_service";
  }
  return null;
};

const passwordIsStrong = (password: string): boolean => {
  if (password.length < 10) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

const appendNext = (next: string, search: string): string => {
  const params = new URLSearchParams(search);
  params.set("next", next);
  return `?${params.toString()}`;
};

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    redirect(`/admin/login${appendNext(next, "error=missing-fields")}`);
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    redirect(`/admin/login${appendNext(next, "error=service-unavailable")}`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    redirect(`/admin/login${appendNext(next, "error=invalid-credentials")}`);
  }

  const role = inferRole(data.user.user_metadata, data.user.app_metadata, email);
  if (!role) {
    await supabase.auth.signOut();
    redirect(`/admin/login${appendNext(next, "error=not-staff")}`);
  }

  await writeCookieSession({
    userId: data.user.id,
    email,
    fullName:
      (data.user.user_metadata?.full_name as string | undefined) ??
      email.split("@")[0] ??
      "Staff",
    role,
    isActive: true,
  });

  redirect(next || "/admin");
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // continue
  }
  await clearCookieSession();
  redirect("/admin/login");
}

export async function customerSignInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  if (!email || !password) {
    redirect(`/account/login?error=missing-fields&next=${encodeURIComponent(next)}`);
  }

  const { error } = await browserSupabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    redirect(`/account/login?error=invalid-credentials&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function customerRegisterAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!email || !password || !firstName) {
    redirect(`/account/register?error=missing-fields`);
  }
  if (!passwordIsStrong(password)) {
    redirect(`/account/register?error=weak-password`);
  }

  const { error } = await browserSupabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, role: "customer" },
    },
  });
  if (error) {
    redirect(`/account/register?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/account/login?registered=1`);
}

export async function requestPasswordResetAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    redirect(`/admin/forgot-password?error=missing-fields`);
  }
  try {
    const supabase = await getSupabaseServerClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/admin/reset-password`,
    });
  } catch {
    // intentionally swallow — never reveal whether the email exists
  }
  redirect(`/admin/forgot-password?sent=1`);
}
