"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireEnv } from "config/env";
import { clearCookieSession, writeCookieSession } from "lib/auth/session";

/**
 * Authentication actions — Phase A
 *
 * Two flows only:
 *  - Admin: sign in, sign out, password reset
 *  - Customer: sign in, register, sign out, forgot password, change password
 *
 * No role inference. No permission checks. Binary admin/customer.
 */

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

// ============================================================================
// Admin auth actions
// ============================================================================

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

  await writeCookieSession({
    userId: data.user.id,
    email,
    fullName:
      (data.user.user_metadata?.full_name as string | undefined) ??
      email.split("@")[0] ??
      "Admin",
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

// ============================================================================
// Customer auth actions
// ============================================================================

export async function customerSignInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  if (!email || !password) {
    redirect(`/account/login?error=missing-fields&next=${encodeURIComponent(next)}`);
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    redirect(`/account/login?error=service-unavailable&next=${encodeURIComponent(next)}`);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    const code =
      error.message?.includes("not confirmed") || error.message?.includes("verify")
        ? "email-not-confirmed"
        : "invalid-credentials";
    redirect(
      `/account/login?error=${code}&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
    );
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

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    redirect(`/account/register?error=service-unavailable`);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName}${lastName ? " " + lastName : ""}`,
        role: "customer",
      },
    },
  });
  if (error) {
    redirect(`/account/register?error=${encodeURIComponent(error.message)}`);
  }

  // If the project has email confirmation enabled, `data.session` is null
  // and the user must verify their email before signing in.
  if (!data.session) {
    redirect(`/account/login?check-email=1&email=${encodeURIComponent(email)}`);
  }

  redirect(`/account/login?registered=1`);
}

export async function customerSignOutAction(): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // continue
  }
  redirect("/");
}

export async function customerForgotPasswordAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    redirect(`/account/forgot-password?error=missing-fields`);
  }
  try {
    const supabase = await getSupabaseServerClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/account/reset-password`,
    });
  } catch {
    // intentionally swallow — never reveal whether the email exists
  }
  redirect(`/account/forgot-password?sent=1`);
}

export async function customerChangePasswordAction(formData: FormData): Promise<void> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(`/account/settings?error=missing-fields`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/account/settings?error=password-mismatch`);
  }
  if (!passwordIsStrong(newPassword)) {
    redirect(`/account/settings?error=weak-password`);
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    redirect(`/account/settings?error=service-unavailable`);
  }

  // Re-authenticate with current password to confirm identity before change.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    redirect(`/account/login?next=/account/settings`);
  }
  const userEmail = sessionData.session.user.email;
  if (!userEmail) {
    redirect(`/account/settings?error=service-unavailable`);
  }

  // Re-verify current password
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: currentPassword,
  });
  if (reauthError) {
    redirect(`/account/settings?error=invalid-current-password`);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    redirect(`/account/settings?error=${encodeURIComponent(updateError.message)}`);
  }

  redirect(`/account/settings?password-changed=1`);
}

export async function customerUpdateProfileAction(formData: FormData): Promise<void> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const fullName = `${firstName}${lastName ? " " + lastName : ""}`.trim();

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    redirect(`/account/settings?error=service-unavailable`);
  }

  // Update Supabase Auth user metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone,
    },
  });
  if (error) {
    redirect(`/account/settings?error=${encodeURIComponent(error.message)}`);
  }

  // Sync to the customers table so orders, admin views, and
  // address records reflect current profile information.
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData.session?.user?.id;
    if (authUserId) {
      await supabase
        .from("customers")
        .update({ full_name: fullName, phone: phone || null })
        .eq("auth_user_id", authUserId);
    }
  } catch {
    // Non-critical: customer record may not exist yet — it will be
    // created on first order or address save.
  }

  redirect(`/account/settings?profile-updated=1`);
}
