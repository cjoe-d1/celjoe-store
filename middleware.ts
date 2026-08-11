import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireEnv } from "config/env";

const ADMIN_PROTECTED_PREFIXES = ["/admin"];
const ADMIN_PUBLIC_PATHS = new Set<string>([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);
const ACCOUNT_PROTECTED_PREFIXES = ["/account"];
const ACCOUNT_PUBLIC_PATHS = new Set<string>([
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
]);

const isAdminPath = (pathname: string) =>
  ADMIN_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

const isAccountPath = (pathname: string) =>
  ACCOUNT_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

const hasSupabaseAuthCookie = (request: NextRequest): boolean => {
  for (const cookie of request.cookies.getAll()) {
    const name = cookie.name;
    if (name.includes("auth-token") && name.startsWith("sb-")) return true;
  }
  return false;
};

// Content Security Policy — strict but compatible with Next.js, Supabase,
// Paystack, WhatsApp, and image CDNs.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co",
  "frame-src 'self' https://checkout.paystack.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const setSecurityHeaders = (response: NextResponse) => {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAdminSession = Boolean(request.cookies.get("celjoe_session")?.value);
  const hasCustomerSession = hasSupabaseAuthCookie(request);

  // --- Admin auth ---
  // Admin auth uses a custom celjoe_session cookie. No Supabase token
  // refresh is needed — the cookie has a fixed 8-hour TTL and is parsed
  // directly. This path is intentionally NOT touched by customer auth.

  if (isAdminPath(pathname) && !ADMIN_PUBLIC_PATHS.has(pathname)) {
    if (!hasAdminSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
      return NextResponse.redirect(url);
    }
    // Admin is authenticated — simple pass-through with headers.
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
  }

  // --- Customer auth (protected routes) ---
  // This is the session-refresh path. When an access token has expired
  // but a refresh token is still valid, Supabase needs to write new
  // cookies to the response. Server Components CANNOT write cookies
  // (cookieStore.set() throws in RSC). The middleware runs in a request
  // context where cookie writes succeed, so we call getSession() here
  // to trigger token refresh and persist the new tokens.
  //
  // If the refresh token has also expired, getSession() returns null
  // and we redirect to login.

  if (isAccountPath(pathname) && !ACCOUNT_PUBLIC_PATHS.has(pathname)) {
    if (!hasCustomerSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/account/login";
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
      return NextResponse.redirect(url);
    }

    // Session cookies exist — attempt to refresh the Supabase session.
    // This writes any refreshed tokens to the response, preventing the
    // stale-token logout problem.
    const response = NextResponse.next();
    try {
      const supabase = createServerClient(
        requireEnv.supabaseUrl(),
        requireEnv.supabaseAnonKey(),
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options) {
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options) {
              response.cookies.set({ name, value: "", ...options });
            },
          },
        },
      );
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Refresh token is also expired — clear cookies and redirect.
        for (const cookie of request.cookies.getAll()) {
          if (cookie.name.startsWith("sb-")) {
            response.cookies.set({ name: cookie.name, value: "", maxAge: 0, path: "/" });
          }
        }
        const url = request.nextUrl.clone();
        url.pathname = "/account/login";
        url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
        return NextResponse.redirect(url);
      }
    } catch {
      // Auth service unavailable — let the page handle it (it will
      // redirect to login if needed). Don't block the user entirely.
    }

    setSecurityHeaders(response);
    return response;
  }

  // --- All other routes ---
  // No auth gate — just security headers.
  const response = NextResponse.next();
  setSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/health).*)",
  ],
};
